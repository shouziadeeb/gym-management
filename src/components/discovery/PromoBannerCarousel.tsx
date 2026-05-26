import { memo, useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { PROMO_CAMPAIGNS } from '@/constants/gym-discovery';
import { layout, text } from '@/theme/classes';
import { screenLayout } from '@/theme/spacing';
import { carouselPageStyle, webFullBleedRailStyle, webHorizontalPagingStyle } from '@/lib/web-layout';

const TILE_GAP = 12;

export const PromoBannerCarousel = memo(function PromoBannerCarousel() {
  const edgePadding = screenLayout.screenPaddingX;
  const [railWidth, setRailWidth] = useState(0);

  const onRailLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0) {
      setRailWidth((current) => (current === width ? current : width));
    }
  }, []);

  /** One card spans the content gutter; peek the next tile while scrolling. */
  const tileWidth = Math.max(280, railWidth - edgePadding * 2);

  return (
    <View style={[{ marginHorizontal: -edgePadding }, webFullBleedRailStyle]} onLayout={onRailLayout}>
      {railWidth > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={[styles.carousel, webHorizontalPagingStyle]}
          {...(Platform.OS === 'web' ? { dataSet: { rnwCarousel: 'paging' } } : null)}
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
              style={[carouselPageStyle(tileWidth), { borderRadius: 28, padding: 20 }]}
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
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  carousel: { flexGrow: 0 },
});
