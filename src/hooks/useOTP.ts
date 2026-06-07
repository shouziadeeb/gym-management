/**
 * @file useOTP.ts
 * OTP UI timers: resend cooldown countdown, expiry countdown, and canResend flag.
 */
import { useCallback, useEffect, useState } from 'react';

import type { AuthMethod } from '@/services/auth/auth.types';
import {
  canResendOtp,
  clearOtpSession,
  formatCountdown,
  getExpiryRemainingMs,
  getResendCooldownRemainingMs,
  isOtpServerExpired,
  isOtpSessionExpired,
  startOtpSession,
} from '@/services/auth/otp.service';

/** Polls otp.service every second for resend cooldown and code expiry labels. */
export function useOTP() {
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [expirySecondsLeft, setExpirySecondsLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [serverExpired, setServerExpired] = useState(false);

  const tick = useCallback(() => {
    const resendMs = getResendCooldownRemainingMs();
    const expiryMs = getExpiryRemainingMs();
    setResendSecondsLeft(Math.ceil(resendMs / 1000));
    setExpirySecondsLeft(Math.ceil(expiryMs / 1000));
    setCanResend(canResendOtp());
    setServerExpired(isOtpServerExpired());
  }, []);

  useEffect(() => {
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const beginSession = useCallback(
    (method: AuthMethod, identifier: string, isResend = false) => {
      startOtpSession(method, identifier, isResend);
      tick();
    },
    [tick],
  );

  const resetSession = useCallback(() => {
    clearOtpSession();
    setResendSecondsLeft(0);
    setExpirySecondsLeft(0);
    setCanResend(false);
    setServerExpired(false);
  }, []);

  const expired = serverExpired || isOtpSessionExpired();

  const resendLabel =
    canResend && resendSecondsLeft === 0
      ? 'Resend code'
      : resendSecondsLeft > 0
        ? `Resend in ${formatCountdown(resendSecondsLeft)}`
        : 'Resend code';

  return {
    beginSession,
    resetSession,
    tick,
    canResend: canResend && resendSecondsLeft === 0 && !expired,
    resendLabel,
    expirySecondsLeft,
    serverExpired,
    isExpired: expired,
    expiryLabel:
      !expired && expirySecondsLeft > 0
        ? `Code expires in ${formatCountdown(expirySecondsLeft)}`
        : null,
  };
}
