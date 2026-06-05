import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { GymFollowButton } from '@/components/discovery/GymFollowButton';
import { GymStatsRow } from '@/components/discovery/GymStatsRow';
import type { GymCardPresentation } from '@/domain/discovery/types';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

type Props = {
  gym: GymCardPresentation;
  priceHint?: string | null;
  onPress: () => void;
};

function formatSubtitle(gym: GymCardPresentation): string {
  const parts = [gym.distanceLabel, gym.addressLine?.split(',')[0]?.trim()].filter(Boolean);
  return parts.join(' • ') || 'Explore details';
}

export function ExploreGymListRow({ gym, priceHint, onPress }: Props) {
  const { colors } = useTheme();
  const imageUri = gym.imageUrls[0] ?? gym.imageUrl;
  const rating = gym.ratingAvg > 0 ? `${gym.ratingAvg.toFixed(1)} ★` : 'New';

  return (
    <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${gym.name}`}
        style={styles.mainPressable}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, { backgroundColor: colors.chipInactive }]} />
        )}

        <View style={styles.content}>
          <View style={styles.topLine}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {gym.name}
            </Text>
            <Text style={[styles.rating, { color: colors.primary }]}>{rating}</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
            {formatSubtitle(gym)}
          </Text>
          <GymStatsRow
            followerCount={gym.followerCount}
            activeMemberCount={gym.activeMemberCount}
            compact
          />
          {priceHint ? (
            <Text style={[styles.priceHint, { color: colors.primary }]}>{priceHint}</Text>
          ) : null}
        </View>

        <View style={[styles.chevron, { borderColor: colors.border }]}>
          <ChevronRight size={18} color={colors.foreground} strokeWidth={2} />
        </View>
      </Pressable>

      <View style={styles.followSlot}>
        <GymFollowButton gymId={gym.id} compact />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mainPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[3],
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  rating: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  priceHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followSlot: {
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
  },
});
