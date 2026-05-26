import { memo } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { PROMO_CAMPAIGNS } from '@/constants/gym-discovery';
import { layout, text } from '@/theme/classes';
import { screenLayout } from '@/theme/spacing';

const TILE_GAP = 12;

export const PromoBannerCarousel = memo(function PromoBannerCarousel() {
  const { width: windowWidth } = useWindowDimensions();
  const edgePadding = screenLayout.screenPaddingX;
  /** One card spans the content gutter; peek the next tile while scrolling. */
  const tileWidth = Math.max(280, windowWidth - edgePadding * 2);

  return (
    <View style={{ marginHorizontal: -edgePadding }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.carousel}
        contentContainerStyle={{
          columnGap: TILE_GAP,
          paddingHorizontal: edgePadding,
          paddingVertical: 4,
        }}
      >
        {PROMO_CAMPAIGNS.map((item) => (
          <LinearGradient
            colors={[item.tone, '#0f172a']}
            key={item.id}
            style={{ width: tileWidth, borderRadius: 28, padding: 20 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className={layout.stack}>
              <Text className="text-xl font-semibold text-white">{item.title}</Text>
              <Text className={`${text.body} text-white opacity-85`}>{item.subtitle}</Text>
            </View>
          </LinearGradient>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  carousel: { flexGrow: 0 },
});
