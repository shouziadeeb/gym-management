/**
 * @file OtpVerificationPanel.tsx
 * OTP step layout: destination hint, OtpInput, verify/resend/back actions, optional dev hint.
 */
import { Text, View } from 'react-native';

import { OtpInput } from '@/components/auth/OtpInput';
import { Button } from '@/components/ui/Button';
import { OTP_DIGIT_COUNT } from '@/services/auth/auth.constants';
import type { AuthMethod, AuthScreenMode } from '@/services/auth/auth.types';
import { layout, text } from '@/theme/classes';

type OtpVerificationPanelProps = {
  method: AuthMethod;
  mode: AuthScreenMode;
  destination: string;
  value: string;
  onChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
  loading?: boolean;
  canResend?: boolean;
  resendLabel?: string;
  expiryLabel?: string | null;
  errorMessage?: string | null;
  devHint?: string | null;
};

/** OTP verification step: six-digit input, verify when complete, resend with cooldown label. */
export function OtpVerificationPanel({
  method,
  mode,
  destination,
  value,
  onChange,
  onVerify,
  onResend,
  onBack,
  loading = false,
  canResend = false,
  resendLabel = 'Resend code',
  expiryLabel,
  errorMessage,
  devHint,
}: OtpVerificationPanelProps) {
  const isComplete = value.replace(/\D/g, '').length === OTP_DIGIT_COUNT;

  return (
    <View className={layout.vstackMd} style={{ width: '100%', alignSelf: 'stretch' }}>
      <Text className={text.caption}>Code sent to {destination}</Text>
      {devHint ? <Text className={text.bodySm}>{devHint}</Text> : null}
      {expiryLabel ? <Text className={text.bodySm}>{expiryLabel}</Text> : null}

      <OtpInput key="otp-6-digit" value={value} onChange={onChange} disabled={loading} />

      {errorMessage ? <Text className={text.error}>{errorMessage}</Text> : null}

      <Button
        title={mode === 'signup' ? 'Verify & create account' : 'Verify & continue'}
        onPress={onVerify}
        loading={loading}
        disabled={!isComplete || loading}
      />
      <Button title={resendLabel} variant="ghost" onPress={onResend} disabled={!canResend || loading} />
      <Button
        title={method === 'phone' ? 'Use different number' : 'Use different email'}
        variant="ghost"
        onPress={onBack}
        disabled={loading}
      />
    </View>
  );
}
