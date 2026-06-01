import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { useTheme } from '@/hooks/useTheme';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import { buttons, layout, text } from '@/theme/classes';
import { googleButtonSurface } from '@/theme/styles';

type GoogleAuthButtonProps = {
  mode: AuthScreenMode;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function GoogleAuthButton({ mode, onPress, loading = false, disabled = false }: GoogleAuthButtonProps) {
  const { colors, isDark } = useTheme();
  const label = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={`${buttons.base} w-full max-w-full ${layout.row} items-center ${isDisabled ? buttons.disabled : ''}`}
      style={googleButtonSurface(colors, isDark)}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.foreground} accessibilityLabel="Signing in with Google" />
      ) : (
        <>
          <View className={`relative ${layout.row} w-full items-center justify-center`}>
            <View className="absolute left-0">
              <GoogleIcon size={20} />
            </View>
            <Text className={`px-8 text-center font-semibold ${text.bodySm}`} style={{ color: colors.foreground }}>
              {label}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}
