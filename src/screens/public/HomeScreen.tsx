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

export function HomeScreen() {
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
      <View className={layout.screenTop}>
        <Text className={text.screenTitle}>Find your next gym</Text>
        <Text className={`${layout.stack} ${text.screenSubtitle}`}>
          Explore gyms, trainers, and plans before creating an account.
        </Text>
      </View>

      <View className={layout.sectionLg}>
        <Input label="Search gyms" placeholder="Search by name or keyword" value={query} onChangeText={setQuery} />
      </View>

      <Card title="Featured">
        <Text className={text.caption}>Top gyms from your area appear here. Use Explore for advanced browsing and filters.</Text>
      </Card>

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

      {!gymsQuery.isLoading && !gymsQuery.error && gyms.length === 0 ? (
        <Card>
          <Text className={text.caption}>No gyms found yet. Try changing your search.</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
