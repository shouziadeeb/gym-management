import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sheetBottomPadding, screenScrollBottomPadding, screenTopPadding } from '@/lib/safe-area';
import { screenLayout } from '@/theme/spacing';

/** Semantic safe-area padding for screens, sheets, and modals. */
export function useSafeAreaPadding() {
  const insets = useSafeAreaInsets();

  return {
    insets,
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    /** Bottom sheets: clears Android nav bar / iOS home indicator. */
    sheetBottom: sheetBottomPadding(insets),
    /** Standard horizontal screen gutter including notch inset. */
    horizontal: Math.max(insets.left, insets.right, screenLayout.screenPaddingX),
    screenTop: (omitTopSafeArea = false) => screenTopPadding(insets, omitTopSafeArea),
    screenScrollBottom: (inTabs: boolean) => screenScrollBottomPadding(insets, inTabs),
  };
}
