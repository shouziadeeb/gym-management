import type { Session } from '@supabase/supabase-js';

import { ensureProfileForUser, ensureProfileForUserWithPhone } from '@/api/profiles.api';
import { isDevAuthEnabled } from '@/lib/env';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { getDevOtpForPhone, sendDevOtp, signInDevEmailBridge, verifyDevOtp } from '@/services/auth/dev-otp';
import { isValidIndianMobile10, normalizeIndianMobile10, toIndianE164 } from '@/utils/phone';

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function sendOtp(rawPhone: string): Promise<{ normalizedPhone: string }> {
  const input = typeof rawPhone === 'string' ? rawPhone : String(rawPhone ?? '');

  if (__DEV__) {
    console.log('RAW PHONE (sendOtp input):', JSON.stringify(input));
    console.log('TYPEOF PHONE:', typeof rawPhone);
  }

  const digits = normalizeIndianMobile10(input);
  if (!isValidIndianMobile10(digits)) {
    throw new Error('Enter a valid 10-digit Indian mobile number');
  }
  const normalizedPhone = toIndianE164(digits);

  if (__DEV__) {
    console.log('NORMALIZED PHONE:', normalizedPhone);
  }

  if (isDevAuthEnabled()) {
    await sendDevOtp(digits);
    logger.info('auth.dev.send_otp.success', { phone: normalizedPhone });
    return { normalizedPhone };
  }

  const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
  if (error) {
    logger.warn('auth.signInWithOtp failed', { phone: normalizedPhone, error: error.message });
    throw error;
  }

  logger.info('auth.signInWithOtp success', { phone: normalizedPhone });
  return { normalizedPhone };
}

export async function verifyOtp(payload: { phone: string; token: string; mode?: 'signup' | 'login' }): Promise<Session> {
  const digits = normalizeIndianMobile10(payload.phone);
  if (!isValidIndianMobile10(digits)) {
    throw new Error('Invalid phone number on verify step');
  }
  const normalizedPhone = toIndianE164(digits);

  const otpToken = (payload.token ?? '').trim();

  if (isDevAuthEnabled()) {
    await verifyDevOtp(digits, otpToken);
    const session = await signInDevEmailBridge(digits, payload.mode ?? 'login');
    logger.info('auth.dev.session_created', { phone: normalizedPhone, otp: getDevOtpForPhone(digits) });
    return session;
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: otpToken,
    type: 'sms',
  });

  if (error) {
    logger.warn('auth.verifyOtp failed', { phone: normalizedPhone, error: error.message });
    throw error;
  }

  if (!data.session) {
    throw new Error('Verification succeeded but no session was returned.');
  }

  if (data.user) {
    await ensureProfileForUserWithPhone(data.user, normalizedPhone);
  }

  logger.info('auth.verifyOtp success', { userId: data.user?.id });
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  logger.info('auth.sign_out.success');
}

export type AuthStateChangeCallback = (event: string, session: Session | null) => void;

export function onAuthStateChange(callback: AuthStateChangeCallback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    logger.info('auth.state_changed', { event, userId: session?.user?.id ?? null });
    callback(event, session);
  });
}

export function getUserFromSession(session: Session | null) {
  return session?.user ?? null;
}
