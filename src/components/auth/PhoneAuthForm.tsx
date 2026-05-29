/**
 * @file PhoneAuthForm.tsx
 * Indian mobile number form (react-hook-form + Zod) that triggers send-phone-OTP on submit.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AuthMethodSwitch } from '@/components/auth/AuthMethodPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { phoneInputSchema, type PhoneInputValues } from '@/services/auth/auth.validators';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import { layout, text } from '@/theme/classes';

type PhoneAuthFormProps = {
  mode: AuthScreenMode;
  loading?: boolean;
  onSend: (values: PhoneInputValues) => void;
  onSwitchMethod: (method: 'phone' | 'email') => void;
};

export function PhoneAuthForm({ mode, loading, onSend, onSwitchMethod }: PhoneAuthFormProps) {
  const form = useForm<PhoneInputValues>({
    resolver: zodResolver(phoneInputSchema),
    defaultValues: { phone: '' },
    mode: 'onChange',
  });

  return (
    <View className={layout.vstackMd}>
      <AuthMethodSwitch current="phone" onSwitch={onSwitchMethod} />
      <Controller
        control={form.control}
        name="phone"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="Phone number"
            placeholder="9876543210"
            keyboardType="phone-pad"
            autoCapitalize="none"
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {form.formState.errors.phone?.message ? (
        <Text className={text.error}>{form.formState.errors.phone.message}</Text>
      ) : null}
      <Button
        title={mode === 'signup' ? 'Send signup code' : 'Send login code'}
        onPress={form.handleSubmit(onSend)}
        loading={loading || form.formState.isSubmitting}
      />
    </View>
  );
}
