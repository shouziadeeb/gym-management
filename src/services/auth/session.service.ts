/**
 * @file session.service.ts
 * Supabase session lifecycle: get, refresh, sign out, and auth state listener.
 */
import type { Session } from '@supabase/supabase-js';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type { AuthStateChangeCallback } from '@/services/auth/auth.types';

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function refreshSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  logger.info('auth.session.sign_out');
}

export function onAuthStateChange(callback: AuthStateChangeCallback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    logger.info('auth.session.state_changed', { event, userId: session?.user?.id ?? null });
    callback(event, session);
  });
}

export function getUserFromSession(session: Session | null) {
  return session?.user ?? null;
}
