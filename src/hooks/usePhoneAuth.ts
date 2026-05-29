/**
 * @file usePhoneAuth.ts
 * Phone OTP flow hook: send, verify, resend with loading/message state and OTP session guards.
 */
import { useCallback, useState } from 'react';

import { useOTP } from '@/hooks/useOTP';
import { isDevPhoneAuthEnabled } from '@/lib/env';
import { getErrorMessage } from '@/lib/errors';
import { mapAuthErrorMessage } from '@/services/auth/auth.utils';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import { hybridAuth } from '@/services/auth/hybrid-auth.service';
import { getPhoneDevOtpHint } from '@/services/auth/providers/phone.provider';
import {
  assertOtpSessionValid,
  clearOtpSession,
  recordVerifyAttempt,
  startOtpSession,
} from '@/services/auth/otp.service';
import { normalizeIndianMobile10 } from '@/utils/phone';

/** Phone OTP state machine: send → verify → resend with in-memory session guards. */
export function usePhoneAuth(mode: AuthScreenMode = 'login') {
  const otp = useOTP();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /** Calls hybridAuth.sendPhoneOtp, starts OTP timers, shows dev hint when applicable. */
  const sendCode = useCallback(
    async (rawPhone: string, isResend = false) => {
      setMessage(null);
      setLoading(true);
      try {
        const { normalizedPhone } = await hybridAuth.sendPhoneOtp(rawPhone);
        setIdentifier(normalizedPhone);
        startOtpSession('phone', normalizedPhone, isResend);
        otp.beginSession('phone', normalizedPhone, isResend);

        if (isDevPhoneAuthEnabled()) {
          const digits = normalizeIndianMobile10(rawPhone);
          setMessage(`Development phone OTP: ${getPhoneDevOtpHint(digits)}`);
        } else {
          setMessage('Check your phone for the verification code.');
        }
        return normalizedPhone;
      } catch (error) {
        setMessage(mapAuthErrorMessage(error, 'phone'));
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [otp],
  );

  /** Validates OTP session, verifies with Supabase (or dev bridge), clears session on success. */
  const verifyCode = useCallback(
    async (token: string) => {
      setMessage(null);
      setLoading(true);
      try {
        assertOtpSessionValid(identifier, 'phone');
        recordVerifyAttempt();
        const session = await hybridAuth.verifyPhoneOtp({ phone: identifier, token, mode });
        clearOtpSession();
        otp.resetSession();
        return session;
      } catch (error) {
        setMessage(getErrorMessage(error, 'phone'));
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [identifier, mode, otp],
  );

  const resendCode = useCallback(
    async (rawPhone: string) => {
      if (!otp.canResend) return;
      await sendCode(rawPhone, true);
      setMessage('A new code was sent to your phone.');
    },
    [otp.canResend, sendCode],
  );

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
