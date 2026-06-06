/**
 * @file email.provider.ts
 * Real Supabase email OTP (6-digit in-app verify). Optional password flows for forgot-password.
 */
import type { Session } from '@supabase/supabase-js';

import { ensureProfileForUser } from '@/api/profiles.api';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type {
  AuthScreenMode,
  EmailPasswordSignInPayload,
  EmailPasswordSignUpPayload,
  SendEmailOtpResult,
  VerifyEmailOtpPayload,
} from '@/services/auth/auth.types';
import { isSignupDuplicateError, isSignupRateLimitError, normalizeEmail, isValidEmail } from '@/services/auth/auth.utils';

function assertValidEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Enter a valid email address');
  }
  return normalized;
}

/**
 * Sends a real 6-digit OTP to the user's inbox via Supabase Auth.
 * Never uses a local/dev hardcoded code — configure Supabase Email templates to include {{ .Token }}.
 */
export async function sendEmailOtp(emailRaw: string, mode: AuthScreenMode = 'login'): Promise<SendEmailOtpResult> {
  const email = assertValidEmail(emailRaw);
  const shouldCreateUser = mode === 'signup';

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser,
      // Do not redirect — we verify the 6-digit code in-app (Instagram-style).
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    logger.warn('auth.email.signInWithOtp failed', { email, mode, error: error.message });
    throw error;
  }

  logger.info('auth.email.signInWithOtp success', { email, mode, shouldCreateUser });
  return { email };
}

/**
 * Verifies email OTP; tries both `email` and `signup` types for Supabase compatibility.
 */
export async function verifyEmailOtp(payload: VerifyEmailOtpPayload): Promise<Session> {
  const email = assertValidEmail(payload.email);
  const token = (payload.token ?? '').trim();

  if (!token) {
    throw new Error('Enter the verification code from your email');
  }

  const otpTypes = payload.mode === 'signup' ? (['signup', 'email'] as const) : (['email', 'signup'] as const);

  let data: Awaited<ReturnType<typeof supabase.auth.verifyOtp>>['data'] | null = null;
  let lastError: Error | null = null;

  for (const otpType of otpTypes) {
    const result = await supabase.auth.verifyOtp({ email, token, type: otpType });
    if (!result.error && result.data.session) {
      data = result.data;
      lastError = null;
      break;
    }
    lastError = result.error ?? new Error('Verification failed');
  }

  if (!data?.session) {
    logger.warn('auth.email.verifyOtp failed', { email, error: lastError?.message });
    throw lastError ?? new Error('Invalid or expired code. Request a new code and try again.');
  }

  if (data.user) {
    await ensureProfileForUser(data.user, { authMethod: 'email', authProvider: 'email' });
  }

  logger.info('auth.email.verifyOtp success', { userId: data.user?.id });
  return data.session;
}

export async function signUpWithEmailPassword(payload: EmailPasswordSignUpPayload): Promise<{
  session: Session | null;
  needsEmailVerification: boolean;
}> {
  const email = assertValidEmail(payload.email);
  const password = payload.password?.trim();
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        auth_provider: 'email',
        full_name: payload.fullName?.trim() || email.split('@')[0],
      },
    },
  });

  if (error) {
    if (isSignupDuplicateError(error)) {
      throw new Error('This email is already registered');
    }
    if (isSignupRateLimitError(error)) {
      throw new Error('Too many signup attempts. Please wait and try again.');
    }
    throw error;
  }

  const needsEmailVerification = !data.session && Boolean(data.user);
  if (data.session && data.user) {
    await ensureProfileForUser(data.user, { authMethod: 'email', authProvider: 'email' });
  }

  return { session: data.session, needsEmailVerification };
}

export async function signInWithEmailPassword(payload: EmailPasswordSignInPayload): Promise<Session> {
  const email = assertValidEmail(payload.email);
  const password = payload.password?.trim();
  if (!password) throw new Error('Password is required');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error('Login succeeded but no session was returned.');
  if (data.user) await ensureProfileForUser(data.user, { authMethod: 'email', authProvider: 'email' });
  return data.session;
}

export async function requestPasswordReset(emailRaw: string): Promise<void> {
  const email = assertValidEmail(emailRaw);
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  logger.info('auth.email.reset_password_requested', { email });
}

export async function resendSignupConfirmation(emailRaw: string): Promise<void> {
  const email = assertValidEmail(emailRaw);
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}
