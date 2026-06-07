/**
 * @file otp.service.ts
 * In-memory OTP session tracking: expiry, resend cooldown, and verify attempt limits.
 */
import {
  OTP_EXPIRY_SECONDS_EMAIL,
  OTP_EXPIRY_SECONDS_PHONE,
  OTP_MAX_RESEND_COUNT,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '@/services/auth/auth.constants';
import type { AuthMethod } from '@/services/auth/auth.types';

export type OtpSessionState = {
  method: AuthMethod;
  identifier: string;
  sentAt: number;
  expiresAt: number;
  resendAvailableAt: number;
  resendCount: number;
  verifyAttempts: number;
  serverExpired: boolean;
};

let activeSession: OtpSessionState | null = null;

function otpExpiryMs(method: AuthMethod): number {
  const seconds = method === 'phone' ? OTP_EXPIRY_SECONDS_PHONE : OTP_EXPIRY_SECONDS_EMAIL;
  return seconds * 1000;
}

/** Creates or extends in-memory OTP session with expiry and resend cooldown timestamps. */
export function startOtpSession(method: AuthMethod, identifier: string, isResend = false): OtpSessionState {
  const now = Date.now();

  if (isResend && activeSession?.identifier === identifier && activeSession.method === method) {
    if (activeSession.resendCount >= OTP_MAX_RESEND_COUNT) {
      throw new Error('Maximum resend attempts reached. Try again later.');
    }
    activeSession = {
      ...activeSession,
      sentAt: now,
      expiresAt: now + otpExpiryMs(method),
      resendAvailableAt: now + OTP_RESEND_COOLDOWN_SECONDS * 1000,
      resendCount: activeSession.resendCount + 1,
      verifyAttempts: 0,
      serverExpired: false,
    };
    return activeSession;
  }

  activeSession = {
    method,
    identifier,
    sentAt: now,
    expiresAt: now + otpExpiryMs(method),
    resendAvailableAt: now + OTP_RESEND_COOLDOWN_SECONDS * 1000,
    resendCount: isResend ? 1 : 0,
    verifyAttempts: 0,
    serverExpired: false,
  };

  return activeSession;
}

export function getOtpSession(): OtpSessionState | null {
  return activeSession;
}

export function clearOtpSession(): void {
  activeSession = null;
}

/** Marks the active OTP session expired after Supabase rejects the code (server TTL < client timer). */
export function markOtpSessionServerExpired(): void {
  if (!activeSession) return;
  activeSession = {
    ...activeSession,
    serverExpired: true,
    expiresAt: Date.now(),
  };
}

/** Throws if no active OTP session, identifier mismatch, or code expired. */
export function assertOtpSessionValid(identifier: string, method: AuthMethod): void {
  if (!activeSession || activeSession.identifier !== identifier || activeSession.method !== method) {
    throw new Error('OTP session expired. Request a new code.');
  }
  if (activeSession.serverExpired || Date.now() > activeSession.expiresAt) {
    clearOtpSession();
    throw new Error('Code expired. Request a new code and try again.');
  }
}

/** Increments failed verify attempts; throws when max attempts exceeded. */
export function recordVerifyAttempt(): number {
  if (!activeSession) return 0;
  activeSession.verifyAttempts += 1;
  if (activeSession.verifyAttempts > OTP_MAX_VERIFY_ATTEMPTS) {
    throw new Error('Too many incorrect attempts. Request a new code.');
  }
  return activeSession.verifyAttempts;
}

export function getResendCooldownRemainingMs(now = Date.now()): number {
  if (!activeSession || activeSession.serverExpired) return 0;
  return Math.max(0, activeSession.resendAvailableAt - now);
}

export function getExpiryRemainingMs(now = Date.now()): number {
  if (!activeSession || activeSession.serverExpired) return 0;
  return Math.max(0, activeSession.expiresAt - now);
}

export function isOtpSessionExpired(now = Date.now()): boolean {
  if (!activeSession) return false;
  return activeSession.serverExpired || now >= activeSession.expiresAt;
}

export function canResendOtp(now = Date.now()): boolean {
  if (!activeSession || activeSession.serverExpired) return false;
  if (activeSession.resendCount >= OTP_MAX_RESEND_COUNT) return false;
  return now >= activeSession.resendAvailableAt;
}

export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** True when Supabase rejected the OTP as expired/invalid — hide client countdown. */
export function isOtpServerExpired(): boolean {
  return activeSession?.serverExpired ?? false;
}
