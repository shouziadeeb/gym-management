/**
 * @file ForgotPasswordScreen.tsx
 * Password reset request via Supabase email link (separate from OTP-only login flow).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { AuthStatusMessage } from '@/components/auth/AuthStatusMessage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OnboardingFormPanel } from '@/components/onboarding/OnboardingFormPanel';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { getErrorMessage } from '@/lib/errors';
import { hybridAuth } from '@/services/auth/hybrid-auth.service';
import { layout, text } from '@/theme/classes';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    setMessage(null);
    try {
      await hybridAuth.requestPasswordReset(values.email);
      setSent(true);
      setMessage('If an account exists for this email, you will receive a password reset link shortly.');
    } catch (error) {
      setMessage(getErrorMessage(error, 'email'));
    }
  });

  return (
    <OnboardingScreen scroll>
      <OnboardingFormPanel>
        <Text className={text.screenTitleMd}>Reset password</Text>
        <Text className={`${layout.stack} ${text.screenSubtitle}`}>
          {sent
            ? 'Check your email for the reset link from Supabase.'
            : 'Enter the email you used to sign up.'}
        </Text>

        {!sent ? (
          <View className={`${layout.sectionXl} ${layout.vstackMd}`}>
            <Controller
              control={form.control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            <Button title="Send reset link" onPress={submit} loading={form.formState.isSubmitting} />
          </View>
        ) : (
          <Button title="Back to login" onPress={() => router.replace('/auth/login' as never)} />
        )}

        <AuthStatusMessage message={message} />
      </OnboardingFormPanel>
    </OnboardingScreen>
  );
}
