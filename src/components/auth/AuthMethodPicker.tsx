/**
 * @file AuthMethodPicker.tsx
 * Initial auth method choice (phone vs email) and inline switch between methods.
 */
import { Pressable, Text, View } from 'react-native';

import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { SupabaseOAuthDevHint } from '@/components/auth/SupabaseOAuthDevHint';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import type { AuthMethod, AuthScreenMode } from '@/services/auth/auth.types';
import { layout, text } from '@/theme/classes';

/** Horizontal rule with centered "or" between stacked auth method buttons. */
function AuthOrDivider() {
  const { colors } = useTheme();

  return (
    <View className={`${layout.row} w-full items-center`} accessibilityRole="none">
      <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
      <Text className={`px-3 ${text.caption}`}>or</Text>
      <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
    </View>
  );
}

type AuthMethodPickerProps = {
  mode: AuthScreenMode;
  onSelect: (method: AuthMethod) => void;
  onGooglePress: () => void;
  googleLoading?: boolean;
};

export function AuthMethodPicker({ mode, onSelect, onGooglePress, googleLoading = false }: AuthMethodPickerProps) {
  return (
    <View className={layout.vstackMd}>
      <GoogleAuthButton mode={mode} onPress={onGooglePress} loading={googleLoading} />
      <SupabaseOAuthDevHint />
      <AuthOrDivider />
      <Button title="Continue with Phone" onPress={() => onSelect('phone')} />
      <AuthOrDivider />
      <Button title="Continue with Email" variant="ghost" onPress={() => onSelect('email')} />
      <Text className={`text-center ${text.caption}`}>
        Phone accounts receive an SMS code. Email accounts receive a one-time code in their inbox.
      </Text>
    </View>
  );
}

type AuthMethodSwitchProps = {
  current: AuthMethod;
  onSwitch: (method: AuthMethod) => void;
};

export function AuthMethodSwitch({ current, onSwitch }: AuthMethodSwitchProps) {
  const other: AuthMethod = current === 'phone' ? 'email' : 'phone';
  return (
    <Pressable onPress={() => onSwitch(other)} className={layout.stack}>
      <Text className={`text-center ${text.link}`}>
        Use {other === 'phone' ? 'phone' : 'email'} instead
      </Text>
    </Pressable>
  );
}
