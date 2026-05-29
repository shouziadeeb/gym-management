/**
 * @file auth.types.ts
 * Shared TypeScript types for hybrid auth: methods, providers, OTP payloads,
 * profile sync fields, and session callback shapes.
 */
import type { Session, User } from '@supabase/supabase-js';

import type { AUTH_METHODS, AUTH_PROVIDERS } from '@/services/auth/auth.constants';

export type AuthMethod = (typeof AUTH_METHODS)[number];

export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export type AuthScreenMode = 'login' | 'signup';

export type PhoneAuthStep = 'phone' | 'otp';

export type EmailAuthStep = 'email' | 'otp';

export type HybridAuthStep = 'method' | PhoneAuthStep | EmailAuthStep;

export type AuthIdentifier =
  | { method: 'phone'; phoneE164: string; phoneDigits: string }
  | { method: 'email'; email: string };

export type ProfileAuthSyncInput = {
  auth_provider: AuthProvider;
  auth_type: AuthMethod | 'oauth';
  email: string | null;
  phone: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  provider_metadata?: Record<string, unknown>;
};

export type SendPhoneOtpResult = { normalizedPhone: string };

export type SendEmailOtpResult = { email: string };

export type VerifyOtpPayload = {
  phone: string;
  token: string;
  mode?: AuthScreenMode;
};

export type VerifyEmailOtpPayload = {
  email: string;
  token: string;
  mode?: AuthScreenMode;
};

export type EmailPasswordSignInPayload = {
  email: string;
  password: string;
};

export type EmailPasswordSignUpPayload = {
  email: string;
  password: string;
  fullName?: string;
};

export type AuthStateChangeCallback = (event: string, session: Session | null) => void;

export type ResolvedAuthUser = {
  user: User;
  session: Session;
  method: AuthMethod;
  provider: AuthProvider;
};
