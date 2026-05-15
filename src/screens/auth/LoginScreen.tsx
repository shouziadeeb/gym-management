import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { APP_NAME } from '@/constants/app';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { sendOtp, verifyOtp } from '@/services/auth/auth.service';

const phoneSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number with country code'),
});

const otpSchema = z.object({
  token: z.string().min(4, 'Enter the code you received'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export function LoginScreen() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: '' },
  });

  const sendCode = phoneForm.handleSubmit(async (values) => {
    setMessage(null);

    try {
      const { normalizedPhone } = await sendOtp(values.phone);
      setPhone(normalizedPhone);
      setStep('otp');
      setMessage('Check your phone for the login code.');
      logger.info('OTP sent', { phone: normalizedPhone });
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  });

  const verifyCode = otpForm.handleSubmit(async (values) => {
    setMessage(null);

    try {
      await verifyOtp({ phone, token: values.token });
      logger.info('OTP verified', { phone });
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  });

  return (
    <Screen scroll>
      <View className="pt-10">
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">{APP_NAME}</Text>
        <Text className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Phone sign-in. Use E.164 format (include country code).
        </Text>
      </View>

      {step === 'phone' ? (
        <>
          <Controller
            control={phoneForm.control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Phone"
                placeholder="+15551234567"
                keyboardType="phone-pad"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {phoneForm.formState.errors.phone?.message ? (
            <Text className="mb-2 text-sm text-red-600">{phoneForm.formState.errors.phone.message}</Text>
          ) : null}
          <Button title="Send code" onPress={sendCode} loading={phoneForm.formState.isSubmitting} />
        </>
      ) : (
        <>
          <Text className="mb-2 text-sm text-slate-600 dark:text-slate-400">Code sent to {phone}</Text>
          <Controller
            control={otpForm.control}
            name="token"
            render={({ field: { onChange, value } }) => (
              <Input
                label="One-time code"
                placeholder="123456"
                keyboardType="phone-pad"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {otpForm.formState.errors.token?.message ? (
            <Text className="mb-2 text-sm text-red-600">{otpForm.formState.errors.token.message}</Text>
          ) : null}
          <Button title="Verify & continue" onPress={verifyCode} loading={otpForm.formState.isSubmitting} />
          <View className="mt-3">
            <Button
              title="Use different number"
              variant="ghost"
              onPress={() => {
                setStep('phone');
                setPhone('');
                otpForm.reset({ token: '' });
              }}
            />
          </View>
        </>
      )}

      {message ? <Text className="mt-4 text-center text-sm text-slate-700 dark:text-slate-300">{message}</Text> : null}
    </Screen>
  );
}