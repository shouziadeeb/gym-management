import type { ThemeColors } from '@/theme/colors';
import type { TextStyle, ViewStyle } from 'react-native';

/** Programmatic styles for React Native — CSS variables do not resolve on native. */
export function cardSurface(colors: ThemeColors, elevated = false): ViewStyle {
  return {
    backgroundColor: elevated ? colors.cardElevated : colors.card,
    borderColor: colors.border,
    borderWidth: 1,
  };
}

export function inputSurface(colors: ThemeColors): ViewStyle & TextStyle {
  return {
    backgroundColor: colors.inputBackground,
    borderColor: colors.borderInput,
    borderWidth: 1,
    color: colors.foreground,
  };
}

export function buttonSurface(
  colors: ThemeColors,
  variant: 'primary' | 'ghost' | 'danger',
): ViewStyle {
  if (variant === 'primary') {
    return { backgroundColor: colors.primary };
  }
  if (variant === 'danger') {
    return { backgroundColor: colors.danger };
  }
  return {
    backgroundColor: 'transparent',
    borderColor: colors.ghostBorder,
    borderWidth: 1,
  };
}

export function buttonLabelColor(colors: ThemeColors, variant: 'primary' | 'ghost' | 'danger'): string {
  if (variant === 'ghost') return colors.foreground;
  if (variant === 'danger') return colors.dangerForeground;
  return colors.primaryForeground;
}

export function chipSurface(colors: ThemeColors, active: boolean): ViewStyle {
  return {
    backgroundColor: active ? colors.primary : colors.chipInactive,
  };
}

export function chipLabelColor(colors: ThemeColors, active: boolean): string {
  return active ? colors.primaryForeground : colors.foreground;
}

export function modalOverlay(colors: ThemeColors): ViewStyle {
  return { backgroundColor: colors.overlay };
}

export function highlightBorder(colors: ThemeColors): ViewStyle {
  return { borderColor: `${colors.highlightBorder}99` };
}

const textRoles = {
  foreground: (c: ThemeColors) => c.foreground,
  secondary: (c: ThemeColors) => c.foregroundSecondary,
  muted: (c: ThemeColors) => c.muted,
  primary: (c: ThemeColors) => c.primary,
  accent: (c: ThemeColors) => c.accent,
  success: (c: ThemeColors) => c.success,
  warning: (c: ThemeColors) => c.warning,
  danger: (c: ThemeColors) => c.danger,
} as const;

export function textColor(colors: ThemeColors, role: keyof typeof textRoles): string {
  return textRoles[role](colors);
}
