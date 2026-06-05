import { palette, type ThemeColors } from '@/theme/colors';
import type { TextStyle, ViewStyle } from 'react-native';

/** Light, neutral skeleton blocks (works on light and dark backgrounds). */
export function skeletonBlockColors(isDark: boolean): { base: string; subtle: string } {
  if (isDark) {
    return {
      base: 'rgba(255, 255, 255, 0.08)',
      subtle: 'rgba(255, 255, 255, 0.05)',
    };
  }
  return {
    base: palette.slate200,
    subtle: palette.slate100,
  };
}

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
    borderColor: colors.border,
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

/** Frosted glass tint over onboarding background — keeps photo visible behind. */
export function onboardingFormPanelSurface(
  colors: ThemeColors,
  isDark: boolean,
  authCard = false,
): ViewStyle {
  return {
    backgroundColor: authCard
      ? isDark
        ? 'rgba(8, 10, 18, 0.62)'
        : 'rgba(255, 255, 255, 0.28)'
      : isDark
        ? 'rgba(13, 13, 13, 0.32)'
        : 'rgba(255, 255, 255, 0.22)',
    borderColor: authCard
      ? isDark
        ? 'rgba(255, 255, 255, 0.14)'
        : 'rgba(255, 255, 255, 0.5)'
      : isDark
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
  };
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
