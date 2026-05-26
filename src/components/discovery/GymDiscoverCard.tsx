import { memo, useMemo } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { ImageCarousel } from '@/components/gym/ImageCarousel';
import type { GymCardPresentation } from '@/domain/discovery/types';

import { layout, text, badges } from '@/theme/classes';
import { useTheme } from '@/hooks/useTheme';

export type GymDiscoverCardProps = {
  gym: GymCardPresentation;
  variant?: 'deck' | 'rail';
  /** When `variant="rail"`, overrides the default (~280px) width. */
  railWidth?: number;
  onPress: () => void;
};

export const GymDiscoverCard = memo(function GymDiscoverCard({
  gym,
  variant = 'deck',
  railWidth,
  onPress,
}: GymDiscoverCardProps) {
  const { colors } = useTheme();

  const imageHeight = variant === 'rail' ? 132 : 156;
  const cardWidth = variant === 'rail' ? (railWidth ?? 280) : undefined;

  const footerMeta = useMemo(() => {
    const reviews = `${gym.reviewCount} review${gym.reviewCount === 1 ? '' : 's'}`;
    const members = `${gym.activeMemberCount.toLocaleString()} active members`;
    return `${reviews} • ${members}`;
  }, [gym.activeMemberCount, gym.reviewCount]);

  const ratingLabel = gym.ratingAvg > 0 ? `${gym.ratingAvg.toFixed(1)} ★` : 'New on GYM';

  const visibleCategories = gym.categories.slice(0, 3);
  const imageUrls = gym.imageUrls.length > 0 ? gym.imageUrls : gym.imageUrl ? [gym.imageUrl] : [];

  const cardStyle =
    variant === 'rail'
      ? { width: cardWidth, alignSelf: 'flex-start' as const }
      : Platform.OS === 'web'
        ? { width: '100%' as const, alignSelf: 'stretch' as const }
        : { alignSelf: 'stretch' as const };

  return (
    <View
      className={`${layout.cardSpacing} rounded-3xl border px-4 py-3`}
      style={{
        borderColor: colors.border,
        backgroundColor: colors.card,
        ...cardStyle,
      }}
    >      <View className="overflow-hidden rounded-2xl border" style={{ borderColor: colors.border }}>
        {imageUrls.length > 0 ? (
          <ImageCarousel
            imageUrls={imageUrls}
            height={imageHeight}
            borderRadius={0}
            autoPlay={imageUrls.length > 1}
            autoPlayInterval={3500}
            showDots={imageUrls.length > 1}
            dotPlacement="overlay"
          />
        ) : (
          <View className="items-center justify-center" style={{ height: imageHeight, backgroundColor: colors.muted }}>
            <Text className={text.caption} style={{ color: colors.foregroundSecondary }}>
              Image coming soon
            </Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${gym.name}`}
        className={layout.stackMd}
      >
        <View className={`${layout.rowBetween} flex-wrap gap-3`}>
          <Text className={`${text.cardTitle} flex-1 pr-4`}>{gym.name}</Text>
          {!gym.isActiveListing ? (
            <View className={`${badges.cancelled} ${badges.container}`}>
              <Text className={`${text.bodySm} capitalize`}>Paused</Text>
            </View>
          ) : (
            <View className={`${badges.active} ${badges.container}`}>
              <Text className={text.bodySm}>Open</Text>
            </View>
          )}
        </View>

        {gym.addressLine ? (
          <Text numberOfLines={2} className={`${text.caption} ${layout.flex1}`}>
            {gym.addressLine}
          </Text>
        ) : null}

        <View className={`${layout.row} flex-wrap`}>
          <Text className={`${text.bodySm} mr-4`}>{ratingLabel}</Text>
          {gym.distanceLabel ? <Text className={text.meta}>{gym.distanceLabel}</Text> : null}
        </View>

        <Text className={text.bodySm}>{footerMeta}</Text>

        <View className={`${layout.row} flex-wrap`}>
          <Text className={text.bodySm}>From {gym.monthlyFeeLabel}</Text>
        </View>

        <View className={`${layout.row} flex-wrap`}>
          {visibleCategories.map((tag) => (
            <View key={tag} className={`${badges.container} mr-2 mt-2`} style={{ backgroundColor: colors.chipInactive }}>
              <Text className={text.meta}>{tag}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </View>
  );
});
