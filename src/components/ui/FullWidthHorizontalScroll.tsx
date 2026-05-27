import { Children, ReactNode, isValidElement } from 'react';
import { Platform, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';

import { fullBleedHorizontalStyle, isWeb, webHorizontalPagingStyle } from '@/lib/web-layout';
import { screenLayout } from '@/theme/spacing';

type Props = {
  children: ReactNode;
  /** Gap between items inside the scroll row. */
  gap?: number;
  /** Matches `Screen` horizontal padding (`px-4`); first/last items align with page content. */
  edgePadding?: number;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Horizontal strip that breaks out of parent side padding so chips/cards scroll edge-to-edge.
 */
export function FullWidthHorizontalScroll({
  children,
  gap = 8,
  edgePadding = screenLayout.screenPaddingX,
  style,
  contentContainerStyle,
}: Props) {
  const items = Children.toArray(children);

  return (
    <View style={[fullBleedHorizontalStyle(edgePadding), style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={[{ flexGrow: 0, alignSelf: 'stretch' }, isWeb ? ({ minWidth: 0 } as ViewStyle) : null, webHorizontalPagingStyle]}
        {...(Platform.OS === 'web' ? { dataSet: { rnwCarousel: 'chips' } } : null)}
        contentContainerStyle={[
          {
            paddingHorizontal: edgePadding,
            paddingVertical: 6,
            alignItems: 'center',
          },
          contentContainerStyle,
        ]}
      >
        {items.map((child, index) => {
          if (!isValidElement(child)) return child;

          return (
            <View key={child.key ?? `full-width-chip-${index}`} style={{ marginRight: index < items.length - 1 ? gap : 0 }}>
              {child}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
