/**
 * Central color palette and semantic theme tokens.
 * Hex values here are the single source of truth for programmatic styling on all platforms.
 * NativeWind class colors use explicit dark: variants in classes.ts (CSS variables do not resolve on native).
 */

export const palette = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  slate950: '#020617',

  emerald100: '#000099',
  emerald200: '#03045e',
  emerald400: '#4361ee',
  emerald600: '#4361ee',
  emerald700: '#03045e',
  emerald800: '#000099',
  emerald950: '#000099',

  red100: '#fee2e2',
  red200: '#fecaca',
  red600: '#dc2626',
  red700: '#b91c1c',
  red800: '#991b1b',
  red950: '#450a0a',

  amber100: '#fef3c7',
  amber300: '#fcd34d',
  amber600: '#d97706',
  amber700: '#b45309',
  amber900: '#78350f',
  amber950: '#451a03',
} as const;

export type ThemeColors = {
  background: string;
  surface: string;
  card: string;
  cardElevated: string;
  border: string;
  borderInput: string;
  foreground: string;
  foregroundSecondary: string;
  muted: string;
  placeholder: string;
  primary: string;
  primaryPressed: string;
  primaryForeground: string;
  accent: string;
  success: string;
  successMuted: string;
  successForeground: string;
  warning: string;
  warningMuted: string;
  warningForeground: string;
  danger: string;
  dangerPressed: string;
  dangerForeground: string;
  tabActive: string;
  tabInactive: string;
  overlay: string;
  ghostBorder: string;
  inputBackground: string;
  chipInactive: string;
  chartAxis: string;
  highlightBorder: string;
};

export const lightColors: ThemeColors = {
  background: palette.slate50,
  surface: palette.white,
  card: palette.white,
  cardElevated: palette.white,
  border: palette.slate200,
  borderInput: palette.slate200,
  foreground: palette.slate900,
  foregroundSecondary: palette.slate700,
  muted: palette.slate600,
  placeholder: palette.slate400,
  primary: palette.emerald600,
  primaryPressed: palette.emerald700,
  primaryForeground: palette.white,
  accent: palette.emerald400,
  success: palette.emerald600,
  successMuted: palette.emerald100,
  successForeground: palette.emerald800,
  warning: palette.amber600,
  warningMuted: palette.amber100,
  warningForeground: palette.amber900,
  danger: palette.red600,
  dangerPressed: palette.red700,
  dangerForeground: palette.white,
  tabActive: palette.emerald400,
  tabInactive: palette.slate500,
  overlay: 'rgba(0, 0, 0, 0.5)',
  ghostBorder: palette.slate300,
  inputBackground: palette.white,
  chipInactive: palette.slate200,
  chartAxis: palette.slate500,
  highlightBorder: palette.emerald600,
};

export const darkColors: ThemeColors = {
  background: palette.slate950,
  surface: palette.slate900,
  card: palette.slate900,
  cardElevated: palette.slate900,
  border: palette.slate800,
  borderInput: palette.slate700,
  foreground: palette.slate50,
  foregroundSecondary: palette.slate300,
  muted: palette.slate400,
  placeholder: palette.slate400,
  primary: palette.emerald400,
  primaryPressed: palette.emerald600,
  primaryForeground: palette.white,
  accent: palette.emerald400,
  success: palette.emerald400,
  successMuted: palette.emerald950,
  successForeground: palette.emerald200,
  warning: palette.amber300,
  warningMuted: palette.amber950,
  warningForeground: palette.amber100,
  danger: palette.red600,
  dangerPressed: palette.red700,
  dangerForeground: palette.white,
  tabActive: palette.emerald400,
  tabInactive: palette.slate400,
  overlay: 'rgba(0, 0, 0, 0.5)',
  ghostBorder: palette.slate600,
  inputBackground: palette.slate900,
  chipInactive: palette.slate800,
  chartAxis: palette.slate400,
  highlightBorder: palette.emerald400,
};

export const themes = {
  light: lightColors,
  dark: darkColors,
} as const;

export type ColorScheme = keyof typeof themes;
