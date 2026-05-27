import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import type { GymCardPresentation } from '@/domain/discovery/types';

import { GymDiscoverCard } from '@/components/discovery/GymDiscoverCard';
import { carouselPageStyle, webFullBleedClipStyle, webHorizontalPagingStyle } from '@/lib/web-layout';

type Props = {
  items: GymCardPresentation[];
  onPressGym: (id: string) => void;
  /**
   * Width of each card. Defaults to almost full viewport (matches FlatList horizontal padding).
   */
  cardWidth?: number;
};

/** Horizontal inset on the rail (`contentContainerStyle.paddingHorizontal` × 2). */
const RAIL_INSET_TOTAL = 32;
const RAIL_EDGE_PADDING = 16;

export function HorizontalGymRail({ items, onPressGym, cardWidth: cardWidthProp }: Props) {
  const [railWidth, setRailWidth] = useState(0);

  const onRailLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0) {
      setRailWidth((current) => (current === width ? current : width));
    }
  }, []);

  const cardWidth = cardWidthProp ?? Math.max(260, railWidth - RAIL_INSET_TOTAL);

  return (
    <View style={webFullBleedClipStyle} onLayout={onRailLayout}>
      {railWidth > 0 ? (
        <FlatList
          horizontal
          data={items}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={[styles.railList, webHorizontalPagingStyle]}
          initialNumToRender={4}
          windowSize={5}
          contentContainerStyle={{ gap: 12, paddingHorizontal: RAIL_EDGE_PADDING, paddingBottom: 4 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={carouselPageStyle(cardWidth)}>
              <GymDiscoverCard
                variant="rail"
                railWidth={cardWidth}
                gym={item}
                onPress={() => onPressGym(item.id)}
              />
            </View>
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  railList: { flexGrow: 0 },
});
