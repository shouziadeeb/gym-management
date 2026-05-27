import { useMemo } from 'react';
import { type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isWeb } from '@/lib/web-layout';

/**
 * Background layer that extends into the status bar and system nav areas
 * without oversizing beyond the visible window (avoids cover-mode over-zoom).
 */
export function useFullBleedBackgroundFrame(): ViewStyle {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    if (isWeb) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
      } as ViewStyle;
    }

    return {
      position: 'absolute',
      top: -insets.top,
      right: 0,
      bottom: -insets.bottom,
      left: 0,
      zIndex: 0,
    };
  }, [insets.top, insets.bottom]);
}
