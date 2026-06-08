import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

import { getBottomChromeColor } from '@/lib/system-chrome';
import { darkColors, lightColors } from '@/theme/colors';
import { webFullWidthStyle } from '@/lib/web-layout';
export function createNavigationTheme(isDark: boolean): Theme {
  const colors = isDark ? darkColors : lightColors;

  const base = isDark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.foreground,
      border: colors.border,
      notification: colors.danger,
    },
  };
}

export function createTabBarOptions(isDark: boolean) {
  const colors = isDark ? darkColors : lightColors;

  return {
    sceneStyle: {
      backgroundColor: colors.background,
      ...(Platform.OS === 'web' ? webFullWidthStyle : null),
    },
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.foreground,
    tabBarStyle: {
      backgroundColor: getBottomChromeColor(colors, isDark),
      borderTopColor: colors.border,
      elevation: 0,
    },
    tabBarActiveTintColor: colors.tabActive,
    tabBarInactiveTintColor: colors.tabInactive,
  };
}

export function createStackTabBarOptions() {
  const colors = darkColors;

  return {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.foreground,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
    tabBarActiveTintColor: colors.tabActive,
    tabBarInactiveTintColor: colors.tabInactive,
  };
}
