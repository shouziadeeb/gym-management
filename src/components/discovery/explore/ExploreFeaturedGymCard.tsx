import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { GymFollowButton } from '@/components/discovery/GymFollowButton';
import { GymStatsRow } from '@/components/discovery/GymStatsRow';
import type { GymCardPresentation } from '@/domain/discovery/types';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

type Props = {
  gym: GymCardPresentation;
  onPress: () => void;
};

function formatLocationLine(gym: GymCardPresentation): string {
  const parts = [gym.distanceLabel, gym.addressLine].filter(Boolean);
  return parts.join(' • ') || 'Location unavailable';
}

export function ExploreFeaturedGymCard({ gym, onPress }: Props) {
  const { colors } = useTheme();
  const imageUri = gym.imageUrls[0] ?? gym.imageUrl;
  const rating = gym.ratingAvg > 0 ? gym.ratingAvg.toFixed(1) : null;
  const tags = gym.categories.slice(0, 2).map((tag) => tag.toUpperCase());

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Featured gym ${gym.name}`}
      >
        <View style={styles.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, { backgroundColor: colors.chipInactive }]} />
          )}
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.featuredText, { color: colors.primaryForeground }]}>FEATURED</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
              {gym.name}
            </Text>
            {rating ? (
              <Text style={[styles.rating, { color: colors.foreground }]}>
                {rating} <Text style={{ color: colors.primary }}>★</Text>
              </Text>
            ) : null}
          </View>

          <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
            {formatLocationLine(gym)}
          </Text>

          <GymStatsRow
            followerCount={gym.followerCount}
            activeMemberCount={gym.activeMemberCount}
            compact
          />

          <View style={styles.footer}>
            <View style={styles.tagRow}>
              {tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.chipInactive }]}>
                  <Text style={[styles.tagText, { color: colors.muted }]}>{tag}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.price, { color: colors.primary }]}>
              {gym.monthlyFeeLabel}
              <Text style={[styles.priceSuffix, { color: colors.muted }]}>/mo</Text>
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.followSlot}>
        <GymFollowButton gymId={gym.id} compact />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 168,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    borderRadius: 8,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  body: {
    padding: spacing[4],
    gap: spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  rating: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[1],
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flex: 1,
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  priceSuffix: {
    fontSize: 12,
    fontWeight: '500',
  },
  followSlot: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
});
