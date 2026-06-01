/**
 * @file hybrid-auth.service.ts
 * Unified entry point that routes phone and email auth to their providers.
 */
import type { Session } from '@supabase/supabase-js';

import type { AuthMethod, AuthScreenMode } from '@/services/auth/auth.types';
import {
  sendEmailOtp,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  verifyEmailOtp,
  requestPasswordReset,
  resendSignupConfirmation,
} from '@/services/auth/providers/email.provider';
import { signInWithGoogle } from '@/services/auth/providers/oauth.provider';
import { sendPhoneOtp, verifyPhoneOtp } from '@/services/auth/providers/phone.provider';

/** Unified facade for phone + email authentication flows. */
export const hybridAuth = {
  sendPhoneOtp,
  verifyPhoneOtp,
  sendEmailOtp: (email: string, mode?: AuthScreenMode) => sendEmailOtp(email, mode),
  verifyEmailOtp,
  signUpWithEmailPassword,
  signInWithEmailPassword,
  requestPasswordReset,
  resendSignupConfirmation,
  signInWithGoogle,
};

export type { AuthMethod, AuthScreenMode };

export async function sendOtpForMethod(method: AuthMethod, identifier: string, mode?: AuthScreenMode) {
  if (method === 'phone') return sendPhoneOtp(identifier);
  return sendEmailOtp(identifier, mode);
}

/** Dispatches OTP verify to phone or email provider and returns a Supabase session. */
export async function verifyOtpForMethod(
  method: AuthMethod,
  payload: { identifier: string; token: string; mode?: AuthScreenMode },
): Promise<Session> {
  if (method === 'phone') {
    return verifyPhoneOtp({ phone: payload.identifier, token: payload.token, mode: payload.mode });
  }
  return verifyEmailOtp({ email: payload.identifier, token: payload.token, mode: payload.mode });
}
