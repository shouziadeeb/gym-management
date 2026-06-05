import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { buttonLabelColor, buttonSurface } from '@/theme/styles';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  /** When false, button sizes to its container instead of stretching full width. */
  fullWidth?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  fullWidth = true,
}: Props) {
  const { colors } = useTheme();
  const spinnerColor = buttonLabelColor(colors, variant);
  const surfaceStyle = buttonSurface(colors, variant);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.15)' }}
      style={({ pressed }) => [
        fullWidth ? styles.fullWidth : styles.shrink,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      <View style={[styles.face, surfaceStyle]}>
        {loading ? (
          <ActivityIndicator color={spinnerColor} />
        ) : (
          <Text style={[styles.label, { color: spinnerColor }]}>{title}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  shrink: {
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
  face: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    overflow: 'hidden',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
