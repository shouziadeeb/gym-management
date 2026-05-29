/**
 * @file auth.service.ts
 * Backward-compatible facade: re-exports session helpers and `hybridAuth`,
 * plus legacy `sendOtp` / `verifyOtp` aliases used by older imports.
 */
import type { Session } from '@supabase/supabase-js';

import { hybridAuth } from '@/services/auth/hybrid-auth.service';
import {
  getCurrentSession,
  getUserFromSession,
  onAuthStateChange,
  refreshSession,
  signOut,
} from '@/services/auth/session.service';
import type { AuthStateChangeCallback, VerifyOtpPayload } from '@/services/auth/auth.types';

export { getCurrentSession, getUserFromSession, onAuthStateChange, refreshSession, signOut, hybridAuth };
export type { AuthStateChangeCallback };

/** @deprecated Use `hybridAuth.sendPhoneOtp` */
export async function sendOtp(rawPhone: string) {
  return hybridAuth.sendPhoneOtp(rawPhone);
}

/** @deprecated Use `hybridAuth.verifyPhoneOtp` */
export async function verifyOtp(payload: VerifyOtpPayload): Promise<Session> {
  return hybridAuth.verifyPhoneOtp(payload);
}
