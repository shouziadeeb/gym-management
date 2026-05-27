import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';

import { fetchOwnerGymMemberSummary } from '@/api/owner-members.api';
import { queryKeys } from '@/api/queries/keys';
import { GymLogo } from '@/components/gym/GymLogo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Gym } from '@/types/models';
import { useAppStore } from '@/store/app.store';
import { layout, text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

type Props = {
  ownedGyms: Gym[];
  memberGymCount: number;
};

export function OwnerMembershipHubCard({ ownedGyms, memberGymCount }: Props) {
  const setAppMode = useAppStore((state) => state.setAppMode);
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const setActiveOwnerGymId = useAppStore((state) => state.setActiveOwnerGymId);

  const activeGym = ownedGyms.find((gym) => gym.id === activeOwnerGymId) ?? ownedGyms[0] ?? null;
  const gymId = activeGym?.id;

  const summaryQuery = useQuery({
    queryKey: queryKeys.members.ownerSummary(gymId),
    queryFn: () => fetchOwnerGymMemberSummary(gymId!),
    enabled: Boolean(gymId),
  });

  const summary = summaryQuery.data ?? {
    total_members: 0,
    active_memberships: 0,
    expiring_memberships: 0,
    expired_memberships: 0,
  };

  function openOwnerRoute(path: '/manage-members?view=add_member' | '/manage-members?view=current_members' | '/attendance') {
    setAppMode('owner');
    router.push(path);
  }

  return (
    <Card title="Gym management" className={layout.section}>
      {activeGym ? (
        <View className={`${layout.row} mb-3 items-center`} style={{ gap: spacing[3] }}>
          <GymLogo logoUrl={activeGym.logo_url} gymName={activeGym.name} size="sm" />
          <View className={layout.flex1}>
            <Text className={text.listTitle}>{activeGym.name}</Text>
            <Text className={text.caption}>Owned gym</Text>
          </View>
        </View>
      ) : null}

      {ownedGyms.length > 1 ? (
        <View className={`${layout.row} mb-3 flex-wrap`} style={{ gap: spacing[2] }}>
          {ownedGyms.map((gym) => {
            const selected = gym.id === (activeOwnerGymId ?? ownedGyms[0]?.id);
            return (
              <View key={gym.id} style={{ flexGrow: 1, minWidth: '45%' }}>
                <Button
                  title={gym.name}
                  variant={selected ? 'primary' : 'ghost'}
                  fullWidth
                  onPress={() => setActiveOwnerGymId(gym.id)}
                />
              </View>
            );
          })}
        </View>
      ) : null}

      <Text className={text.caption}>Joined gyms: {memberGymCount}</Text>
      <Text className={`${layout.stackSm} ${text.caption}`}>Owned gyms: {ownedGyms.length}</Text>

      {summaryQuery.isLoading ? <Text className={`${layout.stackMd} ${text.loading}`}>Loading member stats…</Text> : null}
      {!summaryQuery.isLoading ? (
        <View className={layout.stackMd}>
          <Text className={text.bodySm}>Total members: {summary.total_members}</Text>
          <Text className={text.bodySm}>Active: {summary.active_memberships}</Text>
          <Text className={text.warningBody}>Expiring soon: {summary.expiring_memberships}</Text>
          <Text className={text.error}>Expired: {summary.expired_memberships}</Text>
        </View>
      ) : null}

      <View className={layout.vstack} style={{ gap: spacing[3], marginTop: spacing[3] }}>
        <View className={`${layout.row} w-full`} style={{ gap: spacing[2] }}>
          <View className={layout.flex1}>
            <Button title="Add Member" onPress={() => openOwnerRoute('/manage-members?view=add_member')} />
          </View>
          <View className={layout.flex1}>
            <Button title="Members" variant="ghost" onPress={() => openOwnerRoute('/manage-members?view=current_members')} />
          </View>
        </View>
        <Button title="Attendance" variant="ghost" onPress={() => openOwnerRoute('/attendance')} />
      </View>
    </Card>
  );
}
