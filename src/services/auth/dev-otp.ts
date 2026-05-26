import type { Session } from '@supabase/supabase-js';

import { ensureProfileForUserWithPhone } from '@/api/profiles.api';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { sanitizeIndianPhoneInput } from '@/utils/phone';

const DEV_OTP_VALUE = '123456';
const BRIDGE_DOMAIN = 'gymos.app';
const LEGACY_BRIDGE_DOMAINS = ['app.local'];
const BRIDGE_PASSWORD_PREFIX = 'bridge_pwd_v1_';
const SIGNUP_EXISTS_CODES = ['user_already_exists', 'email_exists', 'already_exists'];
const SIGNUP_EXISTS_MESSAGES = ['already registered', 'already exists', 'already been registered'];
const SIGNUP_RATE_LIMIT_CODES = ['over_email_send_rate_limit'];
const LOGIN_NOT_FOUND_MESSAGES = ['invalid login credentials', 'user not found'];

export function getDevOtpForPhone(_phoneDigits: string): string {
  return DEV_OTP_VALUE;
}

export async function sendDevOtp(phoneDigits: string): Promise<void> {
  logger.info('auth.dev.send_otp', { phoneDigits });
}

export async function verifyDevOtp(phoneDigits: string, token: string): Promise<void> {
  const normalizedToken = String(token ?? '').trim();
  if (normalizedToken !== getDevOtpForPhone(phoneDigits)) {
    logger.warn('auth.dev.verify_otp.failed', { phoneDigits });
    throw new Error('Invalid OTP code');
  }
  logger.info('auth.dev.verify_otp.success', { phoneDigits });
}

type AuthMode = 'signup' | 'login';

function bridgeEmailForPhone(phoneDigits: string): string {
  return `${phoneDigits}@${BRIDGE_DOMAIN}`;
}

function bridgeEmailForPhoneWithDomain(phoneDigits: string, domain: string): string {
  return `${phoneDigits}@${domain}`;
}

function bridgeLoginCandidates(phoneDigits: string): string[] {
  const candidates = [bridgeEmailForPhone(phoneDigits), ...LEGACY_BRIDGE_DOMAINS.map((domain) => bridgeEmailForPhoneWithDomain(phoneDigits, domain))];
  return [...new Set(candidates)];
}

function bridgePasswordForPhone(phoneDigits: string): string {
  return `${BRIDGE_PASSWORD_PREFIX}${phoneDigits}`;
}

function isSignupDuplicateError(error: { code?: string | null; message?: string | null }): boolean {
  const code = (error.code ?? '').toLowerCase();
  const message = (error.message ?? '').toLowerCase();
  return SIGNUP_EXISTS_CODES.includes(code) || SIGNUP_EXISTS_MESSAGES.some((needle) => message.includes(needle));
}

function isSignupRateLimitError(error: { code?: string | null; message?: string | null }): boolean {
  const code = (error.code ?? '').toLowerCase();
  const message = (error.message ?? '').toLowerCase();
  return SIGNUP_RATE_LIMIT_CODES.includes(code) || message.includes('rate limit');
}

function isLoginMissingError(error: { message?: string | null }): boolean {
  const message = (error.message ?? '').toLowerCase();
  return LOGIN_NOT_FOUND_MESSAGES.some((needle) => message.includes(needle));
}

async function signInBridgeUser(email: string, password: string): Promise<Session> {
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error) {
    const message = (signIn.error.message ?? '').toLowerCase();
    if (message.includes('email not confirmed')) {
      throw new Error(
        'Email confirmation is enabled in Supabase. Disable "Confirm email" in Authentication -> Providers -> Email for development phone bridge auth.',
      );
    }
    if (isLoginMissingError(signIn.error)) {
      throw new Error('No account found for this number. Please sign up first.');
    }
    throw signIn.error;
  }
  if (!signIn.data.session) {
    throw new Error('Login succeeded but no session was returned.');
  }
  if (signIn.data.user) {
    const inferredPhone = (() => {
      const digits = email.split('@')[0];
      return /^\d{10,15}$/.test(digits) ? `+${digits}` : null;
    })();
    await ensureProfileForUserWithPhone(signIn.data.user, inferredPhone);
  }
  return signIn.data.session;
}

async function hasExistingBridgeAccount(email: string, password: string): Promise<boolean> {
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error) {
    if (isLoginMissingError(signIn.error)) return false;
    throw signIn.error;
  }
  // Clear the probe session and keep signup flow deterministic.
  await supabase.auth.signOut();
  return true;
}

async function signUpBridgeUser(email: string, password: string, phoneE164: string, phoneDigits: string): Promise<void> {
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        phone: phoneE164,
        full_name: `User ${phoneDigits}`,
        auth_provider: 'phone_email_bridge',
      },
    },
  });

  if (signUp.error) {
    logger.warn('auth.dev.bridge.sign_up_failed', { phoneDigits, error: signUp.error.message, code: signUp.error.code });
    if (isSignupDuplicateError(signUp.error)) {
      throw new Error('This number is already registered');
    }
    if (isSignupRateLimitError(signUp.error)) {
      throw new Error('Too many signup attempts. Please wait a few seconds and try again.');
    }
    throw signUp.error;
  }
}

export async function signInDevEmailBridge(phoneRaw: string, mode: AuthMode): Promise<Session> {
  const phoneDigits = sanitizeIndianPhoneInput(phoneRaw);
  if (!phoneDigits) throw new Error('Phone number is required');

  const email = bridgeEmailForPhone(phoneDigits);
  const password = bridgePasswordForPhone(phoneDigits);
  const phoneE164 = `+91${phoneDigits}`;
  const candidates = bridgeLoginCandidates(phoneDigits);

  if (mode === 'signup') {
    for (const candidateEmail of candidates) {
      const exists = await hasExistingBridgeAccount(candidateEmail, password);
      if (exists) {
        throw new Error('This number is already registered');
      }
    }
    await signUpBridgeUser(email, password, phoneE164, phoneDigits);
  } else {
    // Login path: if account doesn't exist, don't auto-create.
    let foundSession: Session | null = null;
    let lastNonMissingError: Error | null = null;

    for (const candidateEmail of candidates) {
      try {
        foundSession = await signInBridgeUser(candidateEmail, password);
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.toLowerCase().includes('no account found for this number')) {
          continue;
        }
        lastNonMissingError = error instanceof Error ? error : new Error(message);
        break;
      }
    }
    if (lastNonMissingError) throw lastNonMissingError;
    if (!foundSession) {
      throw new Error('This number is not registered. Please create an account.');
    }
    logger.info('auth.dev.bridge.session_created', { phoneDigits, userId: foundSession.user.id, mode, email });
    return foundSession;
  }

  const session = await signInBridgeUser(email, password);

  logger.info('auth.dev.bridge.session_created', { phoneDigits, userId: session.user.id, mode });
  return session;
}

