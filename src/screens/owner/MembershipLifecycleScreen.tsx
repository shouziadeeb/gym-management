import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { fetchGymMemberRows } from '@/api/members.api';
import type { MemberRow } from '@/api/members.api';
import { queryClient } from '@/api/queries/client';
import { queryKeys } from '@/api/queries/keys';
import { renewMembershipLifecycle } from '@/api/membership-lifecycle.api';
import { MembershipCountdown } from '@/components/membership/MembershipCountdown';
import { MembershipDashboardFilters } from '@/components/membership/MembershipDashboardFilters';
import { MembershipSummaryCards } from '@/components/membership/MembershipSummaryCards';
import { MembershipStatusBadge } from '@/components/MembershipStatusBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { getErrorMessage } from '@/lib/errors';
import { useMembershipDashboard } from '@/hooks/useMembershipDashboard';
import { useAppStore } from '@/store/app.store';
import { layout, text } from '@/theme/classes';

export function MembershipLifecycleScreen() {
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const [renewTarget, setRenewTarget] = useState<{ membershipId: string; memberId: string } | null>(null);
  const [renewPlanType, setRenewPlanType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [renewAmount, setRenewAmount] = useState('0');
  const [isRenewing, setIsRenewing] = useState(false);

  const dashboard = useMembershipDashboard(activeOwnerGymId ?? undefined);

  const membersQuery = useQuery({
    queryKey: queryKeys.members.list(activeOwnerGymId ?? undefined),
    queryFn: () => fetchGymMemberRows(activeOwnerGymId!),
    enabled: Boolean(activeOwnerGymId),
  });

  const rowsByMemberId = useMemo(() => {
    const map = new Map<string, MemberRow>();
    for (const row of membersQuery.data ?? []) {
      if (row.profile?.id) map.set(row.profile.id, row);
    }
    return map;
  }, [membersQuery.data]);

  async function renewNow() {
    if (!activeOwnerGymId || !renewTarget) return;

    setIsRenewing(true);
    try {
      await renewMembershipLifecycle({
        membershipId: renewTarget.membershipId,
        gymId: activeOwnerGymId,
        memberId: renewTarget.memberId,
        planType: renewPlanType,
        amountCents: Math.max(0, Math.round(Number(renewAmount || 0) * 100)),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.memberships.byGym(activeOwnerGymId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.members.list(activeOwnerGymId) }),
      ]);

      setRenewTarget(null);
      Alert.alert('Renewed', 'Membership has been renewed successfully.');
    } catch (error) {
      Alert.alert('Renewal failed', getErrorMessage(error));
    } finally {
      setIsRenewing(false);
    }
  }

  if (!activeOwnerGymId) {
    return (
      <Screen>
        <Text className={`${layout.screenTopMd} ${text.caption}`}>Select a gym to manage memberships.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>Membership Lifecycle</Text>
      <Text className={text.caption}>Track active, expiring, and expired subscriptions.</Text>

      <MembershipSummaryCards active={dashboard.summary.active} expiring={dashboard.summary.expiring} expired={dashboard.summary.expired} />

      <Card title="Filters & Sorting">
        <MembershipDashboardFilters
          filter={dashboard.filter}
          onFilterChange={dashboard.setFilter}
          sortBy={dashboard.sortBy}
          onSortByChange={dashboard.setSortBy}
        />
      </Card>

      {dashboard.isLoading ? <Text className={text.loading}>Loading memberships...</Text> : null}
      {dashboard.error ? <Text className={text.error}>Could not load memberships.</Text> : null}

      {!dashboard.isLoading && dashboard.visibleMemberships.length === 0 ? (
        <Card title="No memberships">
          <Text className={text.caption}>No rows found for selected filters.</Text>
        </Card>
      ) : null}

      {dashboard.visibleMemberships.map((membership) => {
        const row = rowsByMemberId.get(membership.member_id);
        const memberLabel = row?.profile?.full_name || row?.profile?.phone || membership.member_id.slice(0, 8);

        return (
          <Card key={membership.id}>
            <Text className={text.listTitle}>{memberLabel}</Text>
            <Text className={`${layout.stackSm} ${text.caption}`}>Plan: {membership.plan_type}</Text>
            <Text className={`${layout.stackSm} ${text.caption}`}>Payment: {membership.payment_status}</Text>
            <View className={layout.stack}>
              <MembershipStatusBadge
                status={membership.status}
                expiryDate={membership.expiry_date}
                endsAt={membership.ends_at}
              />
            </View>
            <View className={layout.stackSm}>
              <MembershipCountdown membership={membership} />
            </View>
            <Text className={`${layout.stackSm} ${text.caption}`}>
              Duration: {membership.start_date} to {membership.expiry_date}
            </Text>

            <View className={layout.stackMd}>
              <Button
                title="Renew"
                onPress={() => setRenewTarget({ membershipId: membership.id, memberId: membership.member_id })}
                variant="ghost"
              />
            </View>
          </Card>
        );
      })}

      {renewTarget ? (
        <Card title="Renew Membership">
          <Input
            label="Plan type (monthly/quarterly/yearly)"
            value={renewPlanType}
            onChangeText={(v) => setRenewPlanType((v as typeof renewPlanType) || 'monthly')}
          />
          <Input
            label="Amount (USD)"
            value={renewAmount}
            keyboardType="number-pad"
            onChangeText={setRenewAmount}
          />
          <View className={layout.row}>
            <View className={layout.flex1}>
              <Button title="Cancel" variant="ghost" onPress={() => setRenewTarget(null)} disabled={isRenewing} />
            </View>
            <View className={layout.flex1}>
              <Button title="Confirm renewal" onPress={renewNow} loading={isRenewing} />
            </View>
          </View>
        </Card>
      ) : null}

      <Card title="Notification Pipeline (Prepared)">
        <Text className={text.caption}>
          Architecture is ready for expiry, renewal, and payment reminders via `membership_notification_events`.
          Add an Edge Function or worker to poll queued events and fan out to push/WhatsApp/email channels.
        </Text>
      </Card>
    </Screen>
  );
}
