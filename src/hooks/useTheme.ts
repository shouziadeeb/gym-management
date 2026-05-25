import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorScheme, type ThemeColors } from '@/theme/colors';
import { useThemeStore } from '@/store/theme.store';

export function useTheme() {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  const resolvedScheme = preference === 'system' ? systemScheme : preference;
  const colorScheme: ColorScheme = resolvedScheme === 'dark' ? 'dark' : 'light';
  const colors: ThemeColors = colorScheme === 'dark' ? darkColors : lightColors;
  const isDark = colorScheme === 'dark';

  return {
    colors,
    colorScheme,
    isDark,
    preference,
    setPreference,
  };
}
