/**
 * @file phone.provider.ts
 * Production SMS OTP via Supabase, or dev pseudo-email bridge when dev auth is on.
 * Ensures profiles row exists after successful verify.
 */
import type { Session } from '@supabase/supabase-js';

import { isDevPhoneAuthEnabled } from '@/lib/env';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { getDevOtpForPhone, sendDevOtp, signInDevEmailBridge, verifyDevOtp } from '@/services/auth/dev-otp';
import type { AuthScreenMode, SendPhoneOtpResult, VerifyOtpPayload } from '@/services/auth/auth.types';
import { isValidIndianMobile10, normalizeIndianMobile10, toIndianE164 } from '@/utils/phone';

/** Normalizes Indian mobile, sends SMS OTP (or dev fake OTP). */
export async function sendPhoneOtp(rawPhone: string): Promise<SendPhoneOtpResult> {
  const digits = normalizeIndianMobile10(rawPhone);
  if (!isValidIndianMobile10(digits)) {
    throw new Error('Enter a valid 10-digit Indian mobile number');
  }
  const normalizedPhone = toIndianE164(digits);

  if (isDevPhoneAuthEnabled()) {
    await sendDevOtp(digits);
    logger.info('auth.phone.dev.send_otp', { phone: normalizedPhone });
    return { normalizedPhone };
  }

  const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
  if (error) {
    logger.warn('auth.phone.signInWithOtp failed', { phone: normalizedPhone, error: error.message });
    throw error;
  }

  logger.info('auth.phone.signInWithOtp success', { phone: normalizedPhone });
  return { normalizedPhone };
}

/** Verifies SMS OTP (or dev bridge), syncs profile phone, returns Supabase session. */
export async function verifyPhoneOtp(payload: VerifyOtpPayload): Promise<Session> {
  const digits = normalizeIndianMobile10(payload.phone);
  if (!isValidIndianMobile10(digits)) {
    throw new Error('Invalid phone number on verify step');
  }
  const normalizedPhone = toIndianE164(digits);
  const otpToken = (payload.token ?? '').trim();
  const mode: AuthScreenMode = payload.mode ?? 'login';

  if (isDevPhoneAuthEnabled()) {
    await verifyDevOtp(digits, otpToken);
    const session = await signInDevEmailBridge(digits, mode);
    logger.info('auth.phone.dev.session_created', { phone: normalizedPhone });
    return session;
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: otpToken,
    type: 'sms',
  });

  if (error) {
    logger.warn('auth.phone.verifyOtp failed', { phone: normalizedPhone, error: error.message });
    throw error;
  }

  if (!data.session) {
    throw new Error('Verification succeeded but no session was returned.');
  }

  logger.info('auth.phone.verifyOtp success', { userId: data.user?.id });
  return data.session;
}

export function getPhoneDevOtpHint(phoneDigits: string): string {
  return getDevOtpForPhone(phoneDigits);
}
