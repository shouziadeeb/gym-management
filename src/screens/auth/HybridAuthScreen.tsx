/**
 * @file HybridAuthScreen.tsx
 * Main login/signup screen: method picker → phone or email → OTP verify → post-auth navigation.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthMethodPicker } from '@/components/auth/AuthMethodPicker';
import { AuthStatusMessage } from '@/components/auth/AuthStatusMessage';
import { EmailAuthForm } from '@/components/auth/EmailAuthForm';
import { OtpVerificationPanel } from '@/components/auth/OtpVerificationPanel';
import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm';
import { OnboardingFormPanel } from '@/components/onboarding/OnboardingFormPanel';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { APP_NAME } from '@/constants/app';
import { useEmailAuth } from '@/hooks/useEmailAuth';
import { useHybridAuth } from '@/hooks/useHybridAuth';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { isDevPhoneAuthEnabled } from '@/lib/env';
import { logger } from '@/lib/logger';
import { OTP_DIGIT_COUNT } from '@/services/auth/auth.constants';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import { layout, text } from '@/theme/classes';

type HybridAuthScreenProps = {
  mode?: AuthScreenMode;
};

function buildAuthRoute(pathname: '/auth/login' | '/auth/signup', redirect?: string, intent?: string): string {
  const params = new URLSearchParams();
  if (redirect) params.set('redirect', redirect);
  if (intent) params.set('intent', intent);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** After OTP success: signup → profile-setup; login → redirect or home. */
function postAuthNavigate(mode: AuthScreenMode, redirect?: string) {
  const targetRedirect = typeof redirect === 'string' && redirect.length > 0 ? redirect : '/';
  if (mode === 'signup') {
    router.replace(`/profile-setup?redirect=${encodeURIComponent(targetRedirect)}` as never);
  } else {
    router.replace(targetRedirect as never);
  }
}

/** Orchestrates phone/email hooks, wizard steps, and navigation after successful OTP verify. */
export function HybridAuthScreen({ mode = 'login' }: HybridAuthScreenProps) {
  const { redirect, intent } = useLocalSearchParams<{ redirect?: string; intent?: string }>();
  const hybrid = useHybridAuth({ mode });
  const phoneAuth = usePhoneAuth(mode);
  const emailAuth = useEmailAuth(mode);

  const [otpValue, setOtpValue] = useState('');

  const setOtpDigits = useCallback((next: string) => {
    setOtpValue(next.replace(/\D/g, '').slice(0, OTP_DIGIT_COUNT));
  }, []);
  const [lastPhoneInput, setLastPhoneInput] = useState('');

  const useDevFakePhoneOtp = isDevPhoneAuthEnabled();
  const activeAuth = hybrid.method === 'email' ? emailAuth : phoneAuth;
  const isOtpStep = hybrid.step === 'otp';

  /** Sends phone OTP, clears prior digits, advances UI to OTP step. */
  const handlePhoneSend = useCallback(
    async ({ phone }: { phone: string }) => {
      setLastPhoneInput(phone);
      setOtpValue('');
      const normalized = await phoneAuth.sendCode(phone);
      hybrid.advancePhoneToOtp(normalized);
      logger.info('auth.phone.otp_sent', { phone: normalized });
    },
    [hybrid, phoneAuth],
  );

  /** Sends email OTP via Supabase, clears prior digits, advances UI to OTP step. */
  const handleEmailSend = useCallback(
    async ({ email }: { email: string }) => {
      setOtpValue('');
      const normalized = await emailAuth.sendCode(email);
      hybrid.advanceEmailToOtp(normalized);
      logger.info('auth.email.otp_sent', { email: normalized });
    },
    [emailAuth, hybrid],
  );

  /** Verifies six-digit code with active provider, then routes to app or profile-setup. */
  const handleVerify = useCallback(async () => {
    try {
      if (hybrid.method === 'phone') {
        await phoneAuth.verifyCode(otpValue);
      } else {
        await emailAuth.verifyCode(otpValue);
      }
      postAuthNavigate(mode, typeof redirect === 'string' ? redirect : undefined);
    } catch {
      // message set on hook
    }
  }, [emailAuth, hybrid.method, mode, otpValue, phoneAuth, redirect]);

  /** Clears OTP input and resends code (phone uses last input; email uses stored identifier). */
  const handleResend = useCallback(async () => {
    setOtpValue('');
    if (hybrid.method === 'phone' && lastPhoneInput) {
      await phoneAuth.resendCode(lastPhoneInput);
    } else if (hybrid.method === 'email') {
      await emailAuth.resendCode();
    }
  }, [emailAuth, hybrid.method, lastPhoneInput, phoneAuth]);

  /** From OTP: email goes back to email field; phone resets to method picker. */
  const handleBack = useCallback(() => {
    setOtpValue('');
    if (hybrid.method === 'email') {
      emailAuth.reset();
      hybrid.backToEmailEntry();
    } else {
      phoneAuth.reset();
      hybrid.goToMethodPicker();
    }
  }, [emailAuth, hybrid, phoneAuth]);

  /** Switches between phone and email after resetting both provider hooks. */
  const handleSwitchMethod = useCallback(
    (method: 'phone' | 'email') => {
      setOtpValue('');
      phoneAuth.reset();
      emailAuth.reset();
      hybrid.selectMethod(method);
    },
    [emailAuth, hybrid, phoneAuth],
  );

  const title = mode === 'signup' ? 'Create your account' : 'Login to your account';

  const subtitle =
    hybrid.step === 'method'
      ? 'Choose how you want to continue'
      : hybrid.method === 'phone'
        ? isOtpStep
          ? 'Enter the code sent to your phone'
          : useDevFakePhoneOtp
            ? 'Phone OTP (development mode only)'
            : 'Enter your mobile number'
        : isOtpStep
          ? 'Enter the code from your email'
          : 'Enter your email address';

  const devHint =
    hybrid.method === 'phone' && isOtpStep && useDevFakePhoneOtp && phoneAuth.message
      ? phoneAuth.message
      : null;

  return (
    <OnboardingScreen scroll>
      <OnboardingFormPanel>
        <Text className={text.screenTitle}>{APP_NAME}</Text>
        <Text className={`${layout.stackSm} ${text.screenTitleMd}`}>{title}</Text>
        <Text className={`${layout.stack} ${text.screenSubtitle}`}>{subtitle}</Text>

        <View className={layout.sectionXl}>
          {hybrid.step === 'method' ? (
            <AuthMethodPicker onSelect={hybrid.selectMethod} />
          ) : null}

          {hybrid.method === 'phone' && hybrid.step === 'phone' ? (
            <PhoneAuthForm
              mode={mode}
              loading={phoneAuth.loading}
              onSend={handlePhoneSend}
              onSwitchMethod={handleSwitchMethod}
            />
          ) : null}

          {hybrid.method === 'email' && hybrid.step === 'email' ? (
            <EmailAuthForm
              mode={mode}
              loading={emailAuth.loading}
              onSend={handleEmailSend}
              onSwitchMethod={handleSwitchMethod}
            />
          ) : null}

          {isOtpStep && hybrid.method ? (
            <OtpVerificationPanel
              method={hybrid.method}
              mode={mode}
              destination={activeAuth.identifier}
              value={otpValue}
              onChange={setOtpDigits}
              onVerify={handleVerify}
              onResend={handleResend}
              onBack={handleBack}
              loading={activeAuth.loading}
              canResend={activeAuth.otp.canResend}
              resendLabel={activeAuth.otp.resendLabel}
              expiryLabel={activeAuth.otp.expiryLabel}
              errorMessage={
                activeAuth.message?.toLowerCase().includes('invalid') ||
                activeAuth.message?.toLowerCase().includes('expired') ||
                activeAuth.message?.toLowerCase().includes('attempt')
                  ? activeAuth.message
                  : null
              }
              devHint={devHint}
            />
          ) : null}
        </View>

        {hybrid.step === 'method' ? (
          <View className={`${layout.section} items-center`}>
            {mode === 'login' ? (
              <Pressable
                onPress={() =>
                  router.replace(
                    buildAuthRoute(
                      '/auth/signup',
                      typeof redirect === 'string' ? redirect : undefined,
                      typeof intent === 'string' ? intent : undefined,
                    ) as never,
                  )
                }
              >
                <Text className={text.link}>New here? Create an account</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() =>
                  router.replace(
                    buildAuthRoute(
                      '/auth/login',
                      typeof redirect === 'string' ? redirect : undefined,
                      typeof intent === 'string' ? intent : undefined,
                    ) as never,
                  )
                }
              >
                <Text className={text.link}>Already registered? Login instead</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        <AuthStatusMessage
          message={isOtpStep && devHint ? null : activeAuth.message}
          tone="info"
        />
      </OnboardingFormPanel>
    </OnboardingScreen>
  );
}
