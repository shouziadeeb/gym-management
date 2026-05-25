import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { fetchPublicGyms } from '@/api/gyms.api';
import { queryKeys } from '@/api/queries/keys';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { layout, text } from '@/theme/classes';

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
          <Text className={text.listTitle}>{gym.name}</Text>
          {gym.description ? <Text className={`${layout.stackSm} ${text.caption}`}>{gym.description}</Text> : null}
          <View className={layout.stackMd}>
            <Button title="View details" variant="ghost" onPress={() => router.push(`/gym/${gym.id}`)} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
