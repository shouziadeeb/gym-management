import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { fetchPublicGyms } from '@/api/gyms.api';
import { queryKeys } from '@/api/queries/keys';
import { GymLogo } from '@/components/gym/GymLogo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { layout, text } from '@/theme/classes';
import { compactList, formatInrFromCents, parseGymSettings } from '@/utils/gym-settings';

export function ExploreScreen() {
  const [query, setQuery] = useState('');

  const gymsQuery = useQuery({
    queryKey: queryKeys.gyms.publicList,
    queryFn: fetchPublicGyms,
  });

  const gyms = (gymsQuery.data ?? []).filter((gym) => {
    const value = query.trim().toLowerCase();
    if (!value) return true;
    return gym.name.toLowerCase().includes(value) || (gym.description ?? '').toLowerCase().includes(value);
  });

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitle}`}>Explore gyms</Text>
      <Text className={`${layout.stack} ${text.screenSubtitle}`}>
        Search and discover gyms by name, category, and location-ready metadata.
      </Text>

      <View className={layout.sectionLg}>
        <Input label="Search gyms" placeholder="Search by name or keyword" value={query} onChangeText={setQuery} />
      </View>

      {gymsQuery.isLoading ? <Text className={text.loading}>Loading gyms…</Text> : null}
      {gymsQuery.error ? (
        <Card>
          <Text className={text.error}>Could not load gyms. Check Supabase RLS/policies for public read access.</Text>
        </Card>
      ) : null}

      {gyms.map((gym) => (
        <Card key={gym.id}>
          <View className="mb-3">
            <GymLogo logoUrl={gym.logo_url} gymName={gym.name} size="md" />
          </View>
          <Text className={text.listTitle}>{gym.name}</Text>
          {gym.description ? <Text className={`${layout.stackSm} ${text.caption}`}>{gym.description}</Text> : null}

          {(() => {
            const settings = parseGymSettings(gym.settings);
            const monthly = formatInrFromCents(settings.membershipPlans?.monthlyFeeCents);
            const quarterly = formatInrFromCents(settings.membershipPlans?.quarterlyFeeCents);
            const yearly = formatInrFromCents(settings.membershipPlans?.yearlyFeeCents);
            const timings =
              settings.timings?.openingTime && settings.timings?.closingTime
                ? `${settings.timings.openingTime} - ${settings.timings.closingTime}`
                : 'N/A';
            const facilities = compactList(settings.facilities, 4);

            return (
              <View className={layout.stackMd}>
                <Text className={text.bodySm}>Timings: {timings}</Text>
                <Text className={`${layout.stackSm} ${text.bodySm}`}>Facilities: {facilities}</Text>
                <Text className={`${layout.stackSm} ${text.bodySm}`}>
                  Price: Monthly {monthly} • Quarterly {quarterly} • Yearly {yearly}
                </Text>
              </View>
            );
          })()}

          <View className={layout.stackMd}>
            <Button title="View details" variant="ghost" onPress={() => router.push(`/gym/${gym.id}`)} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
