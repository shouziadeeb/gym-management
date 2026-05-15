import type { Session, User } from '@supabase/supabase-js';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { toE164 } from '@/utils/slug';

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function sendOtp(rawPhone: string): Promise<{ normalizedPhone: string }> {
  const normalizedPhone = toE164(rawPhone);

  const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
  if (error) {
    logger.warn('auth.signInWithOtp failed', { phone: normalizedPhone, error: error.message });
    throw error;
  }

  logger.info('auth.signInWithOtp success', { phone: normalizedPhone });
  return { normalizedPhone };
}

export async function verifyOtp(payload: { phone: string; token: string }): Promise<Session> {
  const phone = toE164(payload.phone);
  const token = payload.token.trim();

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) {
    logger.warn('auth.verifyOtp failed', { phone, error: error.message });
    throw error;
  }

  if (!data.session) {
    throw new Error('Verification succeeded but no session was returned.');
  }

  logger.info('auth.verifyOtp success', { userId: data.user?.id });
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export type AuthStateChangeCallback = (event: string, session: Session | null) => void;

export function onAuthStateChange(callback: AuthStateChangeCallback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

export function getUserFromSession(session: Session | null): User | null {
  return session?.user ?? null;
}