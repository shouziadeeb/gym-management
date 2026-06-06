import { useQuery } from '@tanstack/react-query';
import { Alert, Text, View } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import { respondToMemberRequest } from '@/api/member-requests.api';
import { queryKeys } from '@/api/queries/keys';
import { queryClient } from '@/api/queries/client';
import { fetchMembershipForUser } from '@/api/memberships.api';
import { fetchMemberGymHistory, removeMemberFromGym } from '@/api/members.api';
import { GymLogo } from '@/components/gym/GymLogo';
import { MemberRequestCard } from '@/components/member/MemberRequestCard';
import { MembershipCountdown } from '@/components/membership/MembershipCountdown';
import { MembershipStatusBadge } from '@/components/MembershipStatusBadge';
import { OwnerMembershipHubCard } from '@/components/owner/OwnerMembershipHubCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { formatMembershipLongDate } from '@/domain/memberships';
import { useMemberRequests } from '@/hooks/useMemberRequests';
import { useUserGyms } from '@/hooks/useUserGyms';
import { getErrorMessage } from '@/lib/errors';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { layout, text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';
import { useState } from 'react';

export function MemberHomeScreen() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const isFocused = useIsFocused();
  const activeMemberGymId = useAppStore((state) => state.activeMemberGymId);
  const setActiveMemberGymId = useAppStore((state) => state.setActiveMemberGymId);
  const { memberGyms, ownedGyms } = useUserGyms();
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const gym = memberGyms.find((item) => item.id === activeMemberGymId) ?? memberGyms[0];
  const requestsQuery = useMemberRequests(userId);
  const isOwnerModeUser = ownedGyms.length > 0;

  useEffect(() => {
    if (activeMemberGymId && memberGyms.length > 0 && !memberGyms.some((g) => g.id === activeMemberGymId)) {
      setActiveMemberGymId(memberGyms[0]?.id ?? null);
    }
    if (activeMemberGymId && memberGyms.length === 0) {
      setActiveMemberGymId(null);
    }
  }, [memberGyms, activeMemberGymId, setActiveMemberGymId]);

  const membershipQuery = useQuery({
    queryKey: queryKeys.memberships.byUser(activeMemberGymId ?? undefined, userId),
    queryFn: () => fetchMembershipForUser(activeMemberGymId!, userId!),
    enabled: !!activeMemberGymId && !!userId,
  });

  const membership = membershipQuery.data;

  const historyQuery = useQuery({
    queryKey: queryKeys.members.history(userId),
    queryFn: () => fetchMemberGymHistory(userId!),
    enabled: Boolean(userId),
  });

  const historyRows = historyQuery.data ?? [];
  const leftGymRows = historyRows.filter((row) => row.left_at);
  const activeGymRows = historyRows.filter((row) => row.is_active && !row.left_at);
  const activeGymMembership = activeGymRows.find((row) => row.gym_id === activeMemberGymId) ?? activeGymRows[0] ?? null;
  const hasActiveGym = gym != null || (activeGymRows.length > 0 && memberGyms.length > 0);
  const currentGymId = hasActiveGym ? (activeMemberGymId ?? activeGymMembership?.gym_id ?? gym?.id ?? null) : null;
  const membershipCancelled = membership?.status === 'cancelled';
  const membershipValidThrough =
    membership &&
    (formatMembershipLongDate(membership.ends_at) ?? formatMembershipLongDate(membership.expiry_date));

  useEffect(() => {
    if (!isFocused || !userId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.members.memberRequests(userId) });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.memberships.byUser(activeMemberGymId ?? undefined, userId),
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.members.history(userId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.gyms.member(userId) });
  }, [isFocused, userId, activeMemberGymId]);

  async function respond(requestId: string, decision: 'accepted' | 'rejected') {
    try {
      setBusyRequestId(requestId);
      await respondToMemberRequest(requestId, decision);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.members.memberRequests(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.memberships.byUser(activeMemberGymId ?? undefined, userId) }),
      ]);
      Alert.alert('Updated', decision === 'accepted' ? 'Invitation accepted.' : 'Invitation rejected.');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setBusyRequestId(null);
    }
  }

  async function leaveCurrentGym() {
    if (!currentGymId || !userId) return;
    try {
      await removeMemberFromGym(currentGymId, userId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.members.history(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.memberships.byUser(currentGymId, userId) }),
      ]);
      setActiveMemberGymId(null);
      Alert.alert('Left gym', 'Gym moved to your history.');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  }

  async function handleRefresh() {
    if (!userId) return;
    try {
      setIsRefreshing(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.members.memberRequests(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.memberships.byUser(activeMemberGymId ?? undefined, userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.members.history(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.gyms.member(userId) }),
      ]);
      await Promise.all([requestsQuery.refetch(), membershipQuery.refetch(), historyQuery.refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <Screen scroll refreshing={isRefreshing} onRefresh={() => void handleRefresh()}>
      <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>
        {isOwnerModeUser ? 'Memberships' : 'My membership'}
      </Text>
      {isOwnerModeUser ? (
        <Text className={`${layout.stackSm} ${text.caption}`}>
          Manage gym members, attendance, and your own memberships.
        </Text>
      ) : gym ? (
        <Text className={text.caption}>{gym.name}</Text>
      ) : null}

      {isOwnerModeUser ? (
        <OwnerMembershipHubCard ownedGyms={ownedGyms} memberGymCount={memberGyms.length} />
      ) : null}

      {isOwnerModeUser && memberGyms.length > 0 ? (
        <Text className={`${layout.section} ${text.listTitle}`}>My gym membership</Text>
      ) : null}

      <Card title="Gym Invitations">
        {requestsQuery.isLoading ? <Text className={text.loading}>Loading invitations...</Text> : null}
        {requestsQuery.error ? <Text className={text.error}>Could not load invitations.</Text> : null}
        {(requestsQuery.data ?? []).map((request) => (
          <MemberRequestCard
            key={request.id}
            request={request}
            onAccept={(id) => void respond(id, 'accepted')}
            onReject={(id) => void respond(id, 'rejected')}
            busy={busyRequestId === request.id}
          />
        ))}
        {!requestsQuery.isLoading && !requestsQuery.error && (requestsQuery.data?.length ?? 0) === 0 ? (
          <Text className={text.caption}>No pending invitations.</Text>
        ) : null}
      </Card>

      {membershipQuery.isLoading ? <Text className={`${layout.stackLg} ${text.loading}`}>Loading...</Text> : null}

      {currentGymId ? (
        <Card title="Current Gym Membership">
          {gym || activeGymMembership?.gyms ? (
            <Card>
              <GymLogo
                logoUrl={gym?.logo_url ?? activeGymMembership?.gyms?.logo_url ?? null}
                gymName={gym?.name ?? activeGymMembership?.gyms?.name ?? 'Gym'}
                size="md"
              />
              <Text className={`${layout.stackSm} ${text.listTitle}`}>{gym?.name ?? activeGymMembership?.gyms?.name ?? 'Gym'}</Text>
              <Text className={text.caption}>Slug: {gym?.slug ?? activeGymMembership?.gyms?.slug ?? 'N/A'}</Text>
              {activeGymMembership?.joined_at ? (
                <Text className={text.caption}>Joined: {new Date(activeGymMembership.joined_at).toLocaleDateString()}</Text>
              ) : null}
            </Card>
          ) : null}

          {membership && !membershipCancelled ? (
            <>
              <MembershipStatusBadge
                status={membership.status}
                expiryDate={membership.expiry_date}
                endsAt={membership.ends_at}
              />
              <Text className={`${layout.stackLg} ${text.listTitle}`}>Plan: {membership.plan_type}</Text>
              <MembershipCountdown membership={membership} />
              {membershipValidThrough ? (
                <Text className={`${layout.stackSm} ${text.caption}`}>Valid through {membershipValidThrough}</Text>
              ) : null}
              <Text className={`${layout.stackLg} ${text.caption}`}>
                Renewal reminders are sent 3 days before expiry via push notifications once your gym enables automations.
              </Text>
            </>
          ) : membershipCancelled ? (
            <Text className={`${layout.stackMd} ${text.caption}`}>
              Your membership has been cancelled by the gym owner.
            </Text>
          ) : (
            <Text className={`${layout.stackMd} ${text.caption}`}>
              You are joined to this gym. Membership plan/status has not been assigned yet.
            </Text>
          )}

          <View className={`${layout.stackLg} ${layout.vstack}`} style={{ gap: spacing[3] }}>
            <Button title="Scan attendance" onPress={() => router.push('/attendance-scan')} />
            <Button title="Attendance history" variant="ghost" onPress={() => router.push('/attendance-history')} />
            <Button
              title="Leave Gym"
              variant="danger"
              onPress={() =>
                Alert.alert('Leave gym?', 'This gym will move to your history.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Leave', style: 'destructive', onPress: () => void leaveCurrentGym() },
                ])
              }
            />
          </View>
        </Card>
      ) : !membershipQuery.isLoading && !isOwnerModeUser ? (
        <Card title="No active record">
          <Text className={text.caption}>
            Ask your gym owner to connect your profile or refresh your membership.
          </Text>
        </Card>
      ) : !membershipQuery.isLoading && isOwnerModeUser && memberGyms.length === 0 ? (
        <Card title="No member gyms">
          <Text className={text.caption}>
            You have not joined any gym as a member. Use Gym management above to add and manage members at your gym.
          </Text>
        </Card>
      ) : null}

      <Card title="Gym History">
        {historyQuery.isLoading ? <Text className={text.loading}>Loading history...</Text> : null}
        {leftGymRows.map((row) => (
          <Card key={row.id}>
            <Text className={text.listTitle}>{row.gyms?.name ?? 'Gym'}</Text>
            <Text className={text.caption}>Joined: {new Date(row.joined_at).toLocaleDateString()}</Text>
            <Text className={text.caption}>Left: {row.left_at ? new Date(row.left_at).toLocaleDateString() : 'N/A'}</Text>
          </Card>
        ))}
        {!historyQuery.isLoading && leftGymRows.length === 0 ? <Text className={text.caption}>No gym history yet.</Text> : null}
      </Card>
    </Screen>
  );
}
