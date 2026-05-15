import { format, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Text } from 'react-native';

import { queryKeys } from '@/api/queries/keys';
import { fetchMembershipForUser } from '@/api/memberships.api';
import { MembershipStatusBadge } from '@/components/MembershipStatusBadge';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { DATE_FORMAT } from '@/constants/date';
import { useUserGyms } from '@/hooks/useUserGyms';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { daysUntil } from '@/utils/membership';

export function MemberHomeScreen() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const activeMemberGymId = useAppStore((state) => state.activeMemberGymId);
  const { memberGyms } = useUserGyms();

  const gym = memberGyms.find((item) => item.id === activeMemberGymId) ?? memberGyms[0];

  const membershipQuery = useQuery({
    queryKey: queryKeys.memberships.byUser(activeMemberGymId ?? undefined, userId),
    queryFn: () => fetchMembershipForUser(activeMemberGymId!, userId!),
    enabled: !!activeMemberGymId && !!userId,
  });

  const membership = membershipQuery.data;

  return (
    <Screen scroll>
      <Text className="pt-6 text-2xl font-bold text-slate-900 dark:text-white">My membership</Text>
      {gym ? <Text className="text-slate-600 dark:text-slate-400">{gym.name}</Text> : null}

      {membershipQuery.isLoading ? <Text className="mt-4 text-slate-500">Loading…</Text> : null}

      {membership ? (
        <Card title="Status">
          <MembershipStatusBadge status={membership.status} endsAt={membership.ends_at} />
          <Text className="mt-4 text-lg text-slate-900 dark:text-white">
            {daysUntil(membership.ends_at) < 0
              ? 'Expired — renew with your gym'
              : `${daysUntil(membership.ends_at)} days left`}
          </Text>
          <Text className="mt-1 text-slate-600 dark:text-slate-400">
            Valid through {format(parseISO(membership.ends_at), DATE_FORMAT.long)}
          </Text>
          <Text className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Renewal reminders are sent 3 days before expiry via push notifications once your gym enables automations.
          </Text>
        </Card>
      ) : !membershipQuery.isLoading ? (
        <Card title="No active record">
          <Text className="text-slate-600 dark:text-slate-400">
            Ask your gym owner to connect your profile or refresh your membership.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}