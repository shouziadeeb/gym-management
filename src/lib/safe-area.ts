import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

import { screenLayout, spacing } from '@/theme/spacing';

/** Routes that render {@link GlobalBackButton} above the stack — skip top safe-area on Screen. */
export function shouldOmitTopSafeAreaForRoute(segments: string[]): boolean {
  const first = segments[0];
  if (!first || first === '(tabs)') return false;
  if (first === 'auth' || first === 'profile-setup') return true;
  return true;
}

/** System bottom inset — some Android devices report 0 with edge-to-edge. */
export function systemBottomInset(insets: EdgeInsets): number {
  if (Platform.OS === 'android') {
    return Math.max(insets.bottom, spacing[4]);
  }
  return insets.bottom;
}

/** Bottom inset for bottom sheets (system nav + comfortable tap target). */
export function sheetBottomPadding(insets: EdgeInsets, extra = screenLayout.screenPaddingBottom): number {
  return systemBottomInset(insets) + extra;
}

/** Bottom padding for scrollable stack screen content. */
export function screenScrollBottomPadding(insets: EdgeInsets, inTabs: boolean): number {
  if (inTabs) {
    return screenLayout.scrollEndPadding;
  }
  return screenLayout.screenPaddingBottom + systemBottomInset(insets);
}

/** Top inset when Screen applies its own status-bar padding (tab routes). */
export function screenTopPadding(insets: EdgeInsets, omitTopSafeArea: boolean): number {
  return omitTopSafeArea ? 0 : insets.top;
}

/** Small gap below the global back row on stack screens. */
export const stackContentTopGap = spacing[2];
