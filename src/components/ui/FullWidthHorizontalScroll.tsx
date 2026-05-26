import { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';

import { screenLayout } from '@/theme/spacing';

type Props = {
  children: ReactNode;
  /** Gap between items inside the scroll row. */
  gap?: number;
  /** Matches `Screen` horizontal padding (`px-4`); first/last items align with page content. */
  edgePadding?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Horizontal strip that breaks out of `Screen` side padding so chips/cards scroll edge-to-edge.
 */
export function FullWidthHorizontalScroll({
  children,
  gap = 8,
  edgePadding = screenLayout.screenPaddingX,
  style,
}: Props) {
  return (
    <View style={[{ marginHorizontal: -edgePadding }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          gap,
          paddingHorizontal: edgePadding,
          paddingVertical: 6,
          alignItems: 'center',
        }}
      >
        {children}
      </ScrollView>
    </View>
  );
}
