/**
 * @file EmailAuthForm.tsx
 * Email identifier form (react-hook-form + Zod) that triggers send-email-OTP on submit.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AuthMethodSwitch } from '@/components/auth/AuthMethodPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { emailInputSchema, type EmailInputValues } from '@/services/auth/auth.validators';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import { layout, text } from '@/theme/classes';

type EmailAuthFormProps = {
  mode: AuthScreenMode;
  loading?: boolean;
  onSend: (values: EmailInputValues) => void;
  onSwitchMethod: (method: 'phone' | 'email') => void;
};

export function EmailAuthForm({ mode, loading, onSend, onSwitchMethod }: EmailAuthFormProps) {
  const form = useForm<EmailInputValues>({
    resolver: zodResolver(emailInputSchema),
    defaultValues: { email: '' },
    mode: 'onChange',
  });

  return (
    <View className={layout.vstackMd}>
      <AuthMethodSwitch current="email" onSwitch={onSwitchMethod} />
      <Controller
        control={form.control}
        name="email"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {form.formState.errors.email?.message ? (
        <Text className={text.error}>{form.formState.errors.email.message}</Text>
      ) : null}
      <Button
        title={mode === 'signup' ? 'Send signup code' : 'Send login code'}
        onPress={form.handleSubmit(onSend)}
        loading={loading || form.formState.isSubmitting}
      />
    </View>
  );
}
