import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import {
  carouselPageStyle,
  horizontalPagingListStyle,
  webHorizontalPageStyle,
  webHorizontalPagingStyle,
} from '@/lib/web-layout';

type Props = {
  imageUrls: string[];
  height?: number;
  borderRadius?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  /** `overlay` places dots on the image; `below` renders under the carousel. */
  dotPlacement?: 'below' | 'overlay';
  onPress?: () => void;
};

export function ImageCarousel({
  imageUrls,
  height = 200,
  borderRadius = 16,
  autoPlay = false,
  autoPlayInterval = 3500,
  showDots = true,
  dotPlacement = 'below',
  onPress,
}: Props) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<string>>(null);
  const autoPlayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  }, [containerWidth]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (containerWidth <= 0) return;
      const index = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
      setActiveIndex(index);
    },
    [containerWidth],
  );

  useEffect(() => {
    setActiveIndex(0);
    if (containerWidth > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [imageUrls, containerWidth]);

  useEffect(() => {
    if (!autoPlay || imageUrls.length <= 1 || containerWidth <= 0) return;

    autoPlayTimer.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % imageUrls.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, autoPlayInterval);

    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [autoPlay, autoPlayInterval, imageUrls.length, containerWidth]);

  if (imageUrls.length === 0) return null;

  const Wrapper = onPress ? Pressable : View;
  const wrapperProps = onPress ? { onPress } : {};

  const dots =
    showDots && imageUrls.length > 1 ? (
      <View
        className="flex-row items-center justify-center gap-1.5"
        style={
          dotPlacement === 'overlay'
            ? { position: 'absolute', bottom: 10, left: 0, right: 0 }
            : { marginTop: 8 }
        }
        pointerEvents="none"
      >
        {imageUrls.map((_, index) => (
          <View
            key={index}
            style={{
              width: index === activeIndex ? 16 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: index === activeIndex ? colors.primary : colors.foregroundSecondary,
              opacity: index === activeIndex ? 1 : 0.55,
            }}
          />
        ))}
      </View>
    ) : null;

  return (
    <Wrapper
      {...wrapperProps}
      onLayout={onLayout}
      style={{
        width: '100%',
        height,
        borderRadius,
        overflow: 'hidden',
        backgroundColor: colors.muted,
      }}
    >
      {containerWidth > 0 ? (
        <FlatList
          ref={flatListRef}
          data={imageUrls}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          scrollEnabled={imageUrls.length > 1}
          showsHorizontalScrollIndicator={false}
          style={[horizontalPagingListStyle(containerWidth), webHorizontalPagingStyle]}
          contentContainerStyle={{ flexGrow: 0 }}
          {...(Platform.OS === 'web' ? { dataSet: { rnwCarousel: 'paging' } } : null)}
          snapToInterval={containerWidth}
          decelerationRate="fast"
          disableIntervalMomentum
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(uri, index) => `${uri}-${index}`}
          getItemLayout={(_, index) => ({
            length: containerWidth,
            offset: containerWidth * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({
              offset: info.index * containerWidth,
              animated: true,
            });
          }}
          renderItem={({ item }) => (
            <View style={[carouselPageStyle(containerWidth), webHorizontalPageStyle]}>
              <Image
                source={{ uri: item }}
                style={{
                  width: containerWidth,
                  height,
                  flexShrink: 0,
                  backgroundColor: colors.muted,
                }}
                resizeMode="cover"
              />
            </View>
          )}
        />
      ) : null}

      {dots}
    </Wrapper>
  );
}
