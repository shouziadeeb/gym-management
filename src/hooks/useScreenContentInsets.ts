import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  screenScrollBottomPadding,
  screenTopPadding,
  shouldOmitTopSafeAreaForRoute,
  stackContentTopGap,
} from '@/lib/safe-area';

type Options = {
  /**
   * Stack routes with {@link GlobalBackButton} already clear the status bar —
   * skip top safe-area on Screen. When omitted, inferred from the active route.
   */
  omitTopSafeArea?: boolean;
};

/**
 * Insets for {@link Screen} scroll content and safe-area edges.
 */
export function useScreenContentInsets(options?: Options) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const inTabs = segments[0] === '(tabs)';
  const omitTopSafeArea = options?.omitTopSafeArea ?? shouldOmitTopSafeAreaForRoute(segments);

  const topInset = screenTopPadding(insets, omitTopSafeArea);
  const bottomInset = screenScrollBottomPadding(insets, inTabs);
  const contentTopGap = omitTopSafeArea ? stackContentTopGap : 0;

  return {
    topInset,
    bottomInset,
    contentTopGap,
    omitTopSafeArea,
    insets,
    inTabs,
  };
}
