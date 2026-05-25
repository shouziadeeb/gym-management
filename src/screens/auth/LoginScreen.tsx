import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { APP_NAME } from '@/constants/app';
import { isDevAuthEnabled } from '@/lib/env';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { sendOtp, verifyOtp } from '@/services/auth/auth.service';
import { getDevOtpForPhone } from '@/services/auth/dev-otp';
import { normalizeIndianMobile10 } from '@/utils/phone';
import { layout, text } from '@/theme/classes';

const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'Enter your phone number')
    .refine((value) => {
      const digits = value.replace(/\D/g, '');
      return /^[6-9]\d{9}$/.test(digits);
    }, 'Enter a valid 10-digit Indian mobile number'),
});

const otpSchema = z.object({
  token: z.string().min(1, 'Enter code'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

type AuthScreenMode = 'login' | 'signup';

type AuthScreenProps = {
  mode?: AuthScreenMode;
};

function buildAuthRoute(pathname: '/auth/login' | '/auth/signup', redirect?: string, intent?: string): string {
  const params = new URLSearchParams();
  if (redirect) params.set('redirect', redirect);
  if (intent) params.set('intent', intent);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function LoginScreen({ mode = 'login' }: AuthScreenProps) {
  const { redirect, intent } = useLocalSearchParams<{ redirect?: string; intent?: string }>();
  const useDevFakeOtp = isDevAuthEnabled();
  const authMode: AuthScreenMode = mode;
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
    mode: 'onChange',
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: '' },
  });

  const sendCode = phoneForm.handleSubmit(async (values) => {
    setMessage(null);

    if (__DEV__) {
      console.log('RAW FORM VALUES:', values);
      console.log('RAW PHONE:', values.phone);
      console.log('TYPEOF PHONE:', typeof values.phone);
    }

    try {
      const { normalizedPhone } = await sendOtp(values.phone);
      setPhone(normalizedPhone);
      setStep('otp');
      if (useDevFakeOtp) {
        const digits = normalizeIndianMobile10(values.phone);
        setMessage(`Development OTP sent. Use ${getDevOtpForPhone(digits)} to verify.`);
      } else {
        setMessage('Check your phone for the login code.');
      }
      logger.info('OTP sent', { phone: normalizedPhone });
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  });

  const verifyCode = otpForm.handleSubmit(async (values) => {
    setMessage(null);

    try {
      await verifyOtp({ phone, token: values.token, mode: authMode });
      const targetRedirect = typeof redirect === 'string' && redirect.length > 0 ? redirect : '/';
      if (authMode === 'signup') {
        router.replace(`/profile-setup?redirect=${encodeURIComponent(targetRedirect)}` as never);
      } else {
        router.replace(targetRedirect as never);
      }
      logger.info('OTP verified', { phone });
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  });

  return (
    <Screen scroll>
      <View className={layout.screenTopLg}>
        <Text className={text.screenTitle}>{APP_NAME}</Text>
        <Text className={`${layout.stackSm} ${text.screenTitleMd}`}>
          {authMode === 'signup' ? 'Create your account' : 'Login to your account'}
        </Text>
        <Text className={`${layout.stack} ${text.screenSubtitle}`}>
          {useDevFakeOtp
            ? `Development OTP ${authMode === 'signup' ? 'signup' : 'login'}: enter a 10-digit phone. OTP is simulated.`
            : 'Phone sign-in. Example: 9756304445'}
        </Text>
      </View>

      {step === 'phone' ? (
        <>
          <Controller
            control={phoneForm.control}
            name="phone"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Phone"
                placeholder="9756304445"
                keyboardType="phone-pad"
                autoCapitalize="none"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          {phoneForm.formState.errors.phone?.message ? (
            <Text className={`mb-2 ${text.error}`}>{phoneForm.formState.errors.phone.message}</Text>
          ) : null}
          <Button
            title={authMode === 'signup' ? 'Send signup code' : 'Send login code'}
            onPress={sendCode}
            loading={phoneForm.formState.isSubmitting}
          />
        </>
      ) : (
        <>
          <Text className={`mb-2 ${text.caption}`}>Code sent to {phone}</Text>
          <Controller
            control={otpForm.control}
            name="token"
            render={({ field: { onChange, value } }) => (
              <Input
                label={useDevFakeOtp ? 'Development one-time code' : 'One-time code'}
                placeholder={useDevFakeOtp ? '123456' : '123456'}
                keyboardType="number-pad"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {otpForm.formState.errors.token?.message ? (
            <Text className={`mb-2 ${text.error}`}>{otpForm.formState.errors.token.message}</Text>
          ) : null}
          <Button
            title={authMode === 'signup' ? 'Verify & create account' : 'Verify & continue'}
            onPress={verifyCode}
            loading={otpForm.formState.isSubmitting}
          />
          <View className={layout.stackMd}>
            <Button
              title="Use different number"
              variant="ghost"
              onPress={() => {
                setStep('phone');
                setPhone('');
                otpForm.reset({ token: '' });
                phoneForm.reset({ phone: '' });
              }}
            />
          </View>
        </>
      )}

      <View className={`${layout.sectionXl} items-center`}>
        {authMode === 'login' ? (
          <Pressable
            onPress={() =>
              router.replace(buildAuthRoute('/auth/signup', typeof redirect === 'string' ? redirect : undefined, typeof intent === 'string' ? intent : undefined) as never)
            }
          >
            <Text className={text.link}>New here? Create an account</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() =>
              router.replace(buildAuthRoute('/auth/login', typeof redirect === 'string' ? redirect : undefined, typeof intent === 'string' ? intent : undefined) as never)
            }
          >
            <Text className={text.link}>Already registered? Login instead</Text>
          </Pressable>
        )}
      </View>

      {message ? <Text className={`${layout.stackLg} text-center ${text.bodySm}`}>{message}</Text> : null}
    </Screen>
  );
}
