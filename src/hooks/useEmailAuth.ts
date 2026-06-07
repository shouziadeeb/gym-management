/**
 * @file useEmailAuth.ts
 * Email OTP flow hook: send, verify, resend via Supabase (real email codes only).
 */
import { useCallback, useState } from 'react';

import { useOTP } from '@/hooks/useOTP';
import { getErrorMessage } from '@/lib/errors';
import { isOtpRejectedError, mapAuthErrorMessage } from '@/services/auth/auth.utils';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import { hybridAuth } from '@/services/auth/hybrid-auth.service';
import {
  assertOtpSessionValid,
  clearOtpSession,
  markOtpSessionServerExpired,
  recordVerifyAttempt,
} from '@/services/auth/otp.service';

/** Email OTP state machine: always real Supabase inbox codes (no dev bypass). */
export function useEmailAuth(mode: AuthScreenMode = 'login') {
  const otp = useOTP();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sendCode = useCallback(
    async (email: string, isResend = false) => {
      setMessage(null);
      setLoading(true);
      try {
        const { email: normalized } = await hybridAuth.sendEmailOtp(email, mode);
        setIdentifier(normalized);
        otp.beginSession('email', normalized, isResend);
        setMessage(`We sent a verification code to ${normalized}. Check your inbox and spam.`);
        return normalized;
      } catch (error) {
        setMessage(mapAuthErrorMessage(error, 'email'));
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [mode, otp],
  );

  const verifyCode = useCallback(
    async (token: string) => {
      setMessage(null);
      setLoading(true);
      try {
        assertOtpSessionValid(identifier, 'email');
        recordVerifyAttempt();
        const session = await hybridAuth.verifyEmailOtp({ email: identifier, token, mode });
        clearOtpSession();
        otp.resetSession();
        return session;
      } catch (error) {
        if (isOtpRejectedError(error)) {
          markOtpSessionServerExpired();
          otp.tick();
        }
        setMessage(getErrorMessage(error, 'email'));
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [identifier, mode, otp],
  );

  const resendCode = useCallback(async () => {
    if (!identifier || !otp.canResend) return;
    await sendCode(identifier, true);
    setMessage(`A new code was sent to ${identifier}.`);
  }, [identifier, otp.canResend, sendCode]);

  const reset = useCallback(() => {
    setIdentifier('');
    setMessage(null);
    otp.resetSession();
    clearOtpSession();
  }, [otp]);

  return {
    identifier,
    loading,
    message,
    setMessage,
    sendCode,
    verifyCode,
    resendCode,
    reset,
    otp,
  };
}
