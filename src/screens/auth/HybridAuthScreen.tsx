/**
 * @file HybridAuthScreen.tsx
 * Main login/signup screen: method picker → phone or email → OTP verify → post-auth navigation.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthBrandHeader } from '@/components/auth/AuthBrandHeader';
import { AuthMethodPicker } from '@/components/auth/AuthMethodPicker';
import { AuthStatusMessage } from '@/components/auth/AuthStatusMessage';
import { EmailAuthForm } from '@/components/auth/EmailAuthForm';
import { OtpVerificationPanel } from '@/components/auth/OtpVerificationPanel';
import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm';
import { OnboardingFormPanel } from '@/components/onboarding/OnboardingFormPanel';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { APP_NAME } from '@/constants/app';
import { useEmailAuth } from '@/hooks/useEmailAuth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useHybridAuth } from '@/hooks/useHybridAuth';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { isDevPhoneAuthEnabled } from '@/lib/env';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { postAuthNavigate } from '@/lib/post-auth-navigate';
import { OTP_DIGIT_COUNT } from '@/services/auth/auth.constants';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import { spacing } from '@/theme/spacing';
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

/** Orchestrates phone/email hooks, wizard steps, and navigation after successful OTP verify. */
export function HybridAuthScreen({ mode = 'login' }: HybridAuthScreenProps) {
  const { redirect, intent } = useLocalSearchParams<{ redirect?: string; intent?: string }>();
  const hybrid = useHybridAuth({ mode });
  const phoneAuth = usePhoneAuth(mode);
  const emailAuth = useEmailAuth(mode);
  const googleAuth = useGoogleAuth(
    mode,
    typeof redirect === 'string' ? redirect : undefined,
  );

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

  /** Opens native Google Sign-In (mobile) or OAuth redirect (web). */
  const handleGoogleSignIn = useCallback(async () => {
    try {
      await googleAuth.signIn();
    } catch {
      // message set on hook
    }
  }, [googleAuth]);

  /** Verifies six-digit code with active provider, then routes to app or profile-setup. */
  const handleVerify = useCallback(async () => {
    try {
      const session =
        hybrid.method === 'phone'
          ? await phoneAuth.verifyCode(otpValue)
          : await emailAuth.verifyCode(otpValue);

      const profileOptions =
        hybrid.method === 'phone'
          ? {
              authMethod: 'phone' as const,
              authProvider: 'phone' as const,
              fallbackPhone: phoneAuth.identifier,
            }
          : { authMethod: 'email' as const, authProvider: 'email' as const };

      await postAuthNavigate(
        session,
        mode,
        typeof redirect === 'string' ? redirect : undefined,
        hybrid.method,
        profileOptions,
      );
    } catch (error) {
      const msg = getErrorMessage(error, hybrid.method === 'phone' ? 'phone' : 'email');
      if (hybrid.method === 'phone') phoneAuth.setMessage(msg);
      else emailAuth.setMessage(msg);
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

  const isMethodStep = hybrid.step === 'method';

  return (
    <OnboardingScreen scroll>
      <View style={styles.authShell}>
      <View style={styles.authColumn}>
      {isMethodStep ? <AuthBrandHeader title={title} /> : null}

      <OnboardingFormPanel spacious={isMethodStep} embedded>
        {!isMethodStep ? (
          <>
            <Text className={text.screenTitle}>{APP_NAME}</Text>
            <Text className={`${layout.stackSm} ${text.screenTitleMd}`}>{title}</Text>
            <Text className={`${layout.stack} ${text.screenSubtitle}`}>{subtitle}</Text>
          </>
        ) : null}

        <View className={isMethodStep ? undefined : layout.sectionXl}>
          {isMethodStep ? (
            <AuthMethodPicker
              onSelect={hybrid.selectMethod}
              onGooglePress={handleGoogleSignIn}
              googleLoading={googleAuth.loading}
            />
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

        {!isMethodStep ? (
          <AuthStatusMessage
            message={
              isOtpStep
                ? devHint
                  ? null
                  : activeAuth.message &&
                      !/invalid|expired|attempt/i.test(activeAuth.message)
                    ? activeAuth.message
                    : null
                : activeAuth.message
            }
            tone="info"
          />
        ) : null}
      </OnboardingFormPanel>

      {isMethodStep ? (
        <View style={styles.methodFooter}>
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
              <Text style={styles.footerText}>
                New here?{' '}
                <Text className={text.linkAccent}>Create an account</Text>
              </Text>
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
              <Text style={styles.footerText}>
                Already registered?{' '}
                <Text className={text.linkAccent}>Login instead</Text>
              </Text>
            </Pressable>
          )}

          <AuthStatusMessage message={googleAuth.message} tone="info" />
        </View>
      ) : null}
      </View>
      </View>
    </OnboardingScreen>
  );
}

const AUTH_COLUMN_MAX_WIDTH = 420;

const styles = StyleSheet.create({
  authShell: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authColumn: {
    width: '100%',
    maxWidth: AUTH_COLUMN_MAX_WIDTH,
    alignItems: 'stretch',
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[6],
  },
  methodFooter: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing[5],
    gap: spacing[3],
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.82)',
    textAlign: 'center',
  },
});
