import { useQuery } from '@tanstack/react-query';
import { Text } from 'react-native';

import { fetchGymById } from '@/api/gyms.api';
import { queryKeys } from '@/api/queries/keys';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { layout, text } from '@/theme/classes';
import type { GymSettings } from '@/types/models';

type Props = {
  gymId?: string;
};

export function GymDetailScreen({ gymId }: Props) {
  const gymQuery = useQuery({
    queryKey: queryKeys.gyms.byId(gymId),
    queryFn: () => fetchGymById(gymId!),
    enabled: Boolean(gymId),
  });

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

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitle}`}>{gym.name}</Text>
      <Text className={`${layout.stack} ${text.caption}`}>{gym.description ?? 'No description available yet.'}</Text>

      <Card title="Overview">
        <Text className={text.bodySm}>Timezone: {gym.timezone}</Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>Slug: {gym.slug}</Text>
        {gym.address ? <Text className={`${layout.stackSm} ${text.bodySm}`}>Address: {gym.address}</Text> : null}
      </Card>

      <Card title="Gym Information">
        <Text className={text.bodySm}>Gym Type: {settings.gymType ?? 'Not provided'}</Text>
        {gym.logo_url ? <Text className={`${layout.stackSm} ${text.bodySm}`}>Logo URL: {gym.logo_url}</Text> : null}
      </Card>

      <Card title="Gym Timing">
        <Text className={text.bodySm}>Opening: {settings.timings?.openingTime ?? 'Not set'}</Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>Closing: {settings.timings?.closingTime ?? 'Not set'}</Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>
          Working Days: {workingDays.length ? workingDays.join(', ') : 'Not set'}
        </Text>
      </Card>

      <Card title="Membership Setup">
        <Text className={text.bodySm}>
          Monthly Fee: {formatCents(membershipPlans?.monthlyFeeCents)}
        </Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>
          Quarterly Fee: {formatCents(membershipPlans?.quarterlyFeeCents)}
        </Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>
          Yearly Fee: {formatCents(membershipPlans?.yearlyFeeCents)}
        </Text>
      </Card>

      <Card title="Facilities">
        <Text className={text.bodySm}>{facilities.length ? facilities.join(', ') : 'Not provided'}</Text>
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

function formatCents(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Not set';
  return `$${(value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
