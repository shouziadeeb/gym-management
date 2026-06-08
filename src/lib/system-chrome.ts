import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { Platform } from 'react-native';

import type { ThemeColors } from '@/theme/colors';

/** Bottom tab bar + Android system navigation bar share one chrome color. */
export function getBottomChromeColor(colors: ThemeColors, isDark: boolean): string {
  return isDark ? colors.background : colors.surface;
}

/**
 * Keep OS navigation chrome aligned with the in-app tab bar.
 * With Android edge-to-edge, the nav bar is transparent — the app must paint
 * the gesture area; only button contrast can be set on the system bar.
 */
export async function applySystemChrome(colors: ThemeColors, isDark: boolean): Promise<void> {
  const chrome = getBottomChromeColor(colors, isDark);

  try {
    await SystemUI.setBackgroundColorAsync(chrome);
  } catch {
    // Web and some dev clients do not support SystemUI.
  }

  if (Platform.OS !== 'android') {
    return;
  }

  try {
    NavigationBar.setStyle(isDark ? 'dark' : 'light');
    await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    // Background/border APIs are no-ops while `edgeToEdgeEnabled` is true in app.json.
    // The tab bar paints the gesture-nav region instead (see CenterTabBar).
  } catch {
    // Older Android builds may not expose every navigation-bar API.
  }
}
