import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { fetchGymById } from '@/api/gyms.api';
import { getAllGymImageUrls } from '@/api/gym-images.api';
import { queryKeys } from '@/api/queries/keys';
import { GymFollowButton } from '@/components/discovery/GymFollowButton';
import { GymConnectButton } from '@/components/discovery/GymConnectButton';
import { GymStatsRow } from '@/components/discovery/GymStatsRow';
import { ImageCarousel } from '@/components/gym/ImageCarousel';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { layout, text } from '@/theme/classes';
import type { GymSettings } from '@/types/models';
import { recordGymView } from '@/services/discovery/preferences.storage';
import { useAuthStore } from '@/store/auth.store';
import { compactList, formatInrFromCents, formatTime12h } from '@/utils/gym-settings';
import { spacing } from '@/theme/spacing';

type Props = {
  gymId?: string;
};

export function GymDetailScreen({ gymId }: Props) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.session?.user.id);

  const gymQuery = useQuery({
    queryKey: queryKeys.gyms.byId(gymId),
    queryFn: () => fetchGymById(gymId!),
    enabled: Boolean(gymId),
  });

  useEffect(() => {
    const freshId = gymQuery.data?.id;
    if (!freshId) return;

    void (async () => {
      await recordGymView(freshId);
      await queryClient.invalidateQueries({ queryKey: ['discovery', 'personalization-bundle'] });
    })();
  }, [gymQuery.data?.id, queryClient]);

  const stats = useMemo(() => {
    const gym = gymQuery.data;
    if (!gym) {
      return { followerCount: 0, activeMemberCount: 0 };
    }

    return {
      followerCount: typeof gym.follower_count === 'number' ? gym.follower_count : 0,
      activeMemberCount: typeof gym.active_member_count === 'number' ? gym.active_member_count : 0,
    };
  }, [gymQuery.data]);

  if (!gymId) {
    return (
      <Screen>
        <Text className={`${layout.screenTopMd} ${text.caption}`}>No gym selected.</Text>
      </Screen>
    );
  }

  if (gymQuery.isLoading) {
    return (
      <Screen>
        <Text className={`${layout.screenTopMd} ${text.caption}`}>Loading gym details…</Text>
      </Screen>
    );
  }

  const gym = gymQuery.data;
  if (!gym) {
    return (
      <Screen>
        <Text className={`${layout.screenTopMd} ${text.caption}`}>Gym not found.</Text>
      </Screen>
    );
  }

  const settings = parseGymSettings(gym.settings);
  const workingDays = settings.timings?.workingDays ?? [];
  const facilities = settings.facilities ?? [];
  const membershipPlans = settings.membershipPlans;
  const owner = settings.ownerProfile;
  const allImageUrls = getAllGymImageUrls(gym);
  const ratingLabel =
    typeof gym.rating_avg === 'number' && gym.rating_avg > 0
      ? `${gym.rating_avg.toFixed(1)} ★`
      : 'New on GYM';
  const isGymOwner = Boolean(userId && gym.owner_id === userId);

  return (
    <Screen scroll omitTopSafeArea>
      {allImageUrls.length > 0 && (
        <View className="mb-4">
          <ImageCarousel imageUrls={allImageUrls} height={240} borderRadius={16} />
        </View>
      )}

      <Text className={text.screenTitle}>{gym.name}</Text>
      <Text className={`${layout.stackSm} ${text.bodySm}`}>{ratingLabel}</Text>
      <Text className={`${layout.stack} ${text.caption}`}>{gym.description ?? 'No description available yet.'}</Text>

      <GymStatsRow
        followerCount={stats.followerCount}
        activeMemberCount={stats.activeMemberCount}
        compact
      />

      <View style={styles.actionRow}>
        <GymFollowButton gymId={gym.id} fullWidth />
        <GymConnectButton gymId={gym.id} gymName={gym.name} hidden={isGymOwner} />
      </View>

      <Card title="Overview" className="mt-2">
        <Text className={text.bodySm}>Gym Type: {settings.gymType ?? 'Not provided'}</Text>
        {gym.address ? <Text className={`${layout.stackSm} ${text.bodySm}`}>Address: {gym.address}</Text> : null}
        <Text className={`${layout.stackSm} ${text.bodySm}`}>Timezone: {gym.timezone}</Text>
      </Card>

      <Card title="Gym Timing">
        <Text className={text.bodySm}>Opening: {formatTime12h(settings.timings?.openingTime)}</Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>Closing: {formatTime12h(settings.timings?.closingTime)}</Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>
          Working Days: {workingDays.length ? workingDays.join(', ') : 'Not set'}
        </Text>
      </Card>

      <Card title="Membership Setup">
        <Text className={text.bodySm}>
          Monthly Fee: {formatInrFromCents(membershipPlans?.monthlyFeeCents)}
        </Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>
          Quarterly Fee: {formatInrFromCents(membershipPlans?.quarterlyFeeCents)}
        </Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>
          Yearly Fee: {formatInrFromCents(membershipPlans?.yearlyFeeCents)}
        </Text>
      </Card>

      <Card title="Facilities">
        <Text className={text.bodySm}>{compactList(facilities, 10)}</Text>
      </Card>

      <Card title="Owner Information">
        <Text className={text.bodySm}>Name: {owner?.name ?? 'Not provided'}</Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>Email: {owner?.email ?? 'Not provided'}</Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>Phone: {owner?.phone ?? 'Not provided'}</Text>
      </Card>
    </Screen>
  );
}

function parseGymSettings(raw: unknown): GymSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as GymSettings;
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing[2],
    marginTop: spacing[2],
  },
});
