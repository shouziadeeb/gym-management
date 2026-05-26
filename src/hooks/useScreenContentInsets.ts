import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';

import { screenLayout } from '@/theme/spacing';

type Options = {
  /** Stack routes with {@link GlobalBackButton} already apply top inset — skip doubling it. */
  omitTopSafeArea?: boolean;
};

/**
 * Bottom inset for scroll content.
 *
 * - **Tab screens:** React Navigation already lays out the scene above the tab bar, so we only
 *   add a small end-of-scroll gap (no tab-bar height, no extra system inset).
 * - **Stack / modal screens:** Add system bottom inset (home indicator / Android nav) plus padding.
 */
export function useScreenContentInsets(options?: Options) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const inTabs = segments[0] === '(tabs)';

  const topInset = options?.omitTopSafeArea ? 0 : insets.top;

  const webTabBottomPadding = Platform.OS === 'web' && inTabs ? screenLayout.screenPaddingBottom : 0;

  const bottomInset = inTabs
    ? screenLayout.scrollEndPadding + webTabBottomPadding
    : screenLayout.screenPaddingBottom + insets.bottom;

  return {
    topInset,
    bottomInset,
    insets,
    inTabs,
  };
}
