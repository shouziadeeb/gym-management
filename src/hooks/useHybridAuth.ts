/**
 * @file useHybridAuth.ts
 * UI-only state for hybrid auth screens: selected method, step (method/phone/email/otp), messages.
 */
import { useCallback, useState } from 'react';

import type { AuthMethod, AuthScreenMode, EmailAuthStep, PhoneAuthStep } from '@/services/auth/auth.types';

export type HybridAuthUiStep = 'method' | PhoneAuthStep | EmailAuthStep;

type UseHybridAuthOptions = {
  initialMethod?: AuthMethod;
  mode?: AuthScreenMode;
};

/** Manages wizard steps: method picker → identifier entry → OTP verify. */
export function useHybridAuth(options: UseHybridAuthOptions = {}) {
  const { initialMethod, mode = 'login' } = options;

  const [method, setMethod] = useState<AuthMethod | null>(initialMethod ?? null);
  const [step, setStep] = useState<HybridAuthUiStep>(
    initialMethod ? (initialMethod === 'phone' ? 'phone' : 'email') : 'method',
  );
  const [identifier, setIdentifier] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  /** Picks phone or email and moves to the identifier entry step. */
  const selectMethod = useCallback((next: AuthMethod) => {
    setMethod(next);
    setIdentifier('');
    setStatusMessage(null);
    setStep(next === 'phone' ? 'phone' : 'email');
  }, []);

  const goToMethodPicker = useCallback(() => {
    setMethod(null);
    setIdentifier('');
    setStatusMessage(null);
    setStep('method');
  }, []);

  /** Stores normalized phone and shows the OTP verification step. */
  const advancePhoneToOtp = useCallback((phoneE164: string) => {
    setIdentifier(phoneE164);
    setStep('otp');
  }, []);

  /** Stores normalized email and shows the OTP verification step. */
  const advanceEmailToOtp = useCallback((email: string) => {
    setIdentifier(email);
    setStep('otp');
  }, []);

  const backToEmailEntry = useCallback(() => {
    setStep('email');
  }, []);

  return {
    mode,
    method,
    step,
    identifier,
    statusMessage,
    setStatusMessage,
    selectMethod,
    goToMethodPicker,
    advancePhoneToOtp,
    advanceEmailToOtp,
    backToEmailEntry,
  };
}
