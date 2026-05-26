import { FlatList, StyleSheet, useWindowDimensions } from 'react-native';

import type { GymCardPresentation } from '@/domain/discovery/types';

import { GymDiscoverCard } from '@/components/discovery/GymDiscoverCard';

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

export function HorizontalGymRail({ items, onPressGym, cardWidth: cardWidthProp }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = cardWidthProp ?? Math.max(260, windowWidth - RAIL_INSET_TOTAL);

  return (
    <FlatList
      horizontal
      data={items}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.railList}
      initialNumToRender={4}
      windowSize={5}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 4 }}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <GymDiscoverCard variant="rail" railWidth={cardWidth} gym={item} onPress={() => onPressGym(item.id)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  railList: { flexGrow: 0 },
});
