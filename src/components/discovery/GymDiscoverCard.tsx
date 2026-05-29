import { memo, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ImageCarousel } from '@/components/gym/ImageCarousel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { GymCardPresentation } from '@/domain/discovery/types';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

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
      style={[
        styles.card,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        cardStyle,
      ]}
    >
      <View style={[styles.imageFrame, { borderColor: colors.border }]}>
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
          <View style={[styles.imagePlaceholder, { height: imageHeight, backgroundColor: colors.chipInactive }]}>
            <Text style={[styles.caption, { color: colors.foregroundSecondary }]}>Image coming soon</Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${gym.name}`}
        style={styles.body}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {gym.name}
          </Text>
          {!gym.isActiveListing ? (
            <StatusBadge label="Paused" tone="cancelled" />
          ) : (
            <StatusBadge label="Open" tone="active" />
          )}
        </View>

        {gym.addressLine ? (
          <Text style={[styles.caption, { color: colors.muted }]} numberOfLines={2}>
            {gym.addressLine}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={[styles.bodySm, styles.metaItem, { color: colors.foreground }]}>{ratingLabel}</Text>
          {gym.distanceLabel ? (
            <Text style={[styles.bodySm, { color: colors.muted }]}>{gym.distanceLabel}</Text>
          ) : null}
        </View>

        <Text style={[styles.bodySm, { color: colors.foreground }]}>{footerMeta}</Text>

        <Text style={[styles.bodySm, { color: colors.foreground }]}>
          {`From ${gym.monthlyFeeLabel ?? '—'}`}
        </Text>

        {visibleCategories.length > 0 ? (
          <View style={styles.tagRow}>
            {visibleCategories.map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: colors.chipInactive }]}
              >
                <Text style={[styles.tagText, { color: colors.muted }]}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[2],
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  imageFrame: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing[3],
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    marginTop: spacing[1],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingRight: spacing[2],
  },
  caption: {
    fontSize: 14,
    marginBottom: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  metaItem: {
    marginRight: spacing[2],
  },
  bodySm: {
    fontSize: 14,
    marginBottom: spacing[2],
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 14,
  },
});
