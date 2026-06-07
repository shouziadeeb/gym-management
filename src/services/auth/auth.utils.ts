/**
 * @file auth.utils.ts
 * Auth helpers: pseudo-email bridge, provider detection, validation, and user-facing error mapping.
 */
import type { User } from '@supabase/supabase-js';

import {
  LEGACY_PHONE_BRIDGE_DOMAINS,
  LOGIN_NOT_FOUND_MESSAGES,
  PHONE_BRIDGE_DOMAIN,
  PHONE_BRIDGE_PASSWORD_PREFIX,
  SIGNUP_EXISTS_CODES,
  SIGNUP_EXISTS_MESSAGES,
  SIGNUP_RATE_LIMIT_CODES,
} from '@/services/auth/auth.constants';
import type { AuthMethod, AuthProvider, AuthIdentifier } from '@/services/auth/auth.types';
import { sanitizeIndianPhoneInput } from '@/utils/phone';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return EMAIL_REGEX.test(normalized);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function bridgeEmailForPhone(phoneDigits: string, domain = PHONE_BRIDGE_DOMAIN): string {
  return `${phoneDigits}@${domain}`;
}

/** Returns primary + legacy pseudo emails to try at login (backward compatibility). */
export function bridgeLoginCandidates(phoneDigits: string): string[] {
  const candidates = [
    bridgeEmailForPhone(phoneDigits),
    ...LEGACY_PHONE_BRIDGE_DOMAINS.map((domain) => bridgeEmailForPhone(phoneDigits, domain)),
  ];
  return [...new Set(candidates)];
}

export function bridgePasswordForPhone(phoneDigits: string): string {
  return `${PHONE_BRIDGE_PASSWORD_PREFIX}${phoneDigits}`;
}

/** True for internal phone bridge emails (e.g. 9876543210@app.local) — never show in UI. */
export function isSyntheticBridgeEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  if (lower.endsWith(`@${PHONE_BRIDGE_DOMAIN}`)) return true;
  return LEGACY_PHONE_BRIDGE_DOMAINS.some((domain) => lower.endsWith(`@${domain}`));
}

export function phoneDigitsFromBridgeEmail(email: string): string | null {
  if (!isSyntheticBridgeEmail(email)) return null;
  const digits = email.split('@')[0];
  return /^\d{10,15}$/.test(digits) ? digits : null;
}

export function resolveRealEmail(user: Pick<User, 'email'>): string | null {
  const raw = typeof user.email === 'string' ? user.email.trim() : '';
  if (!raw || !isValidEmail(raw) || isSyntheticBridgeEmail(raw)) return null;
  return normalizeEmail(raw);
}

/** Infers auth method from Supabase user metadata and linked identities. */
export function detectAuthMethodFromUser(
  user: Pick<User, 'email' | 'phone' | 'identities'>,
): 'phone' | 'email' | 'oauth' {
  if (hasOAuthIdentity(user, 'google') || hasOAuthIdentity(user, 'apple')) {
    return 'oauth';
  }
  if (user.phone?.trim()) return 'phone';
  const email = resolveRealEmail(user);
  if (email) return 'email';
  if (isSyntheticBridgeEmail(user.email)) return 'phone';
  return 'phone';
}

function hasOAuthIdentity(user: Pick<User, 'identities'>, provider: string): boolean {
  return user.identities?.some((identity) => identity.provider === provider) ?? false;
}

/** Infers auth_provider from Supabase user metadata and email/phone fields. */
export function detectAuthProviderFromUser(
  user: Pick<User, 'email' | 'phone' | 'app_metadata' | 'user_metadata' | 'identities'>,
): AuthProvider {
  const metadataProvider = user.user_metadata?.auth_provider;
  if (typeof metadataProvider === 'string' && metadataProvider.length > 0) {
    return metadataProvider as AuthProvider;
  }

  if (hasOAuthIdentity(user, 'google')) return 'google';
  if (hasOAuthIdentity(user, 'apple')) return 'apple';

  if (isSyntheticBridgeEmail(user.email)) return 'phone_email_bridge';
  if (user.phone?.trim()) return 'phone';
  if (resolveRealEmail(user)) return 'email';
  return 'phone';
}

export function buildAuthIdentifier(input: string, method: AuthMethod): AuthIdentifier | null {
  if (method === 'email') {
    const email = normalizeEmail(input);
    if (!isValidEmail(email)) return null;
    return { method: 'email', email };
  }

  const digits = sanitizeIndianPhoneInput(input);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return { method: 'phone', phoneDigits: digits, phoneE164: `+91${digits}` };
}

export function isSignupDuplicateError(error: { code?: string | null; message?: string | null }): boolean {
  const code = (error.code ?? '').toLowerCase();
  const message = (error.message ?? '').toLowerCase();
  return (
    (SIGNUP_EXISTS_CODES as readonly string[]).includes(code) ||
    SIGNUP_EXISTS_MESSAGES.some((needle) => message.includes(needle))
  );
}

export function isSignupRateLimitError(error: { code?: string | null; message?: string | null }): boolean {
  const code = (error.code ?? '').toLowerCase();
  const message = (error.message ?? '').toLowerCase();
  return (
    (SIGNUP_RATE_LIMIT_CODES as readonly string[]).includes(code) ||
    message.includes('rate limit')
  );
}

export function isLoginMissingError(error: { message?: string | null }): boolean {
  const message = (error.message ?? '').toLowerCase();
  return LOGIN_NOT_FOUND_MESSAGES.some((needle) => message.includes(needle));
}

/** True when Supabase rejected an OTP as expired or invalid — sync client OTP UI. */
export function isOtpRejectedError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase();
  return (
    message.includes('expired') ||
    message.includes('otp_expired') ||
    message.includes('invalid otp') ||
    message.includes('invalid token') ||
    message.includes('token has expired')
  );
}

/** Converts Supabase/auth errors into short messages for phone vs email flows. */
export function mapAuthErrorMessage(error: unknown, method: AuthMethod): string {
  const fallback = error instanceof Error ? error.message : String(error ?? 'Something went wrong');
  const message = fallback.toLowerCase();

  if (isSignupDuplicateError({ message })) {
    return method === 'phone' ? 'This number is already registered' : 'This email is already registered';
  }
  if (isSignupRateLimitError({ message })) {
    return 'Too many attempts. Please wait a few seconds and try again.';
  }
  if (isLoginMissingError({ message })) {
    return method === 'phone'
      ? 'This number is not registered. Please create an account.'
      : 'No account found for this email. Please sign up first.';
  }
  if (message.includes('email not confirmed')) {
    return 'Please verify your email before signing in. Check your inbox for the confirmation link.';
  }
  if (message.includes('token has expired') || message.includes('otp_expired')) {
    return 'Code expired. Request a new code and try again.';
  }
  if (message.includes('invalid otp') || message.includes('invalid token')) {
    return 'Invalid code. Please try again.';
  }

  return fallback;
}

/** User-facing messages for Google Sign-In failures. */
export function mapGoogleAuthErrorMessage(error: unknown): string {
  const fallback = error instanceof Error ? error.message : String(error ?? 'Something went wrong');
  const message = fallback.toLowerCase();

  if (message.includes('cancel')) {
    return 'Google sign-in was cancelled';
  }
  if (message.includes('play services')) {
    return 'Google Play Services is required for sign-in on this device.';
  }
  if (message.includes('id token') || message.includes('web client id')) {
    return 'Google sign-in is not configured correctly. Contact support.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }
  if (isSignupDuplicateError({ message })) {
    return 'This Google account is already registered. Try logging in instead.';
  }

  return fallback;
}
