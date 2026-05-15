import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useEffect } from 'react';
import { z } from 'zod';

import { queryClient } from '@/api/queries/client';
import { queryKeys } from '@/api/queries/keys';
import { updateGym } from '@/api/gyms.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useUserGyms } from '@/hooks/useUserGyms';
import { getErrorMessage } from '@/lib/errors';
import { signOut } from '@/services/auth/auth.service';
import { useAppStore } from '@/store/app.store';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export function GymSettingsScreen() {
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const setActiveOwnerGymId = useAppStore((state) => state.setActiveOwnerGymId);
  const setAppMode = useAppStore((state) => state.setAppMode);
  const resetGymContext = useAppStore((state) => state.resetGymContext);

  const { ownedGyms, memberGyms } = useUserGyms();

  const currentGym = ownedGyms.find((gym) => gym.id === activeOwnerGymId) ?? ownedGyms[0];

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (currentGym) {
      form.reset({ name: currentGym.name, description: currentGym.description ?? '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGym?.id]);

  const submit = form.handleSubmit(async (values) => {
    if (!currentGym) return;

    try {
      await updateGym(currentGym.id, {
        name: values.name.trim(),
        description: values.description?.trim() || null,
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
      Alert.alert('Saved');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  });

  async function handleSignOut() {
    await signOut();
    resetGymContext();
  }

  return (
    <Screen scroll>
      <Text className="pt-6 text-2xl font-bold text-slate-900 dark:text-white">Gym settings</Text>

      {ownedGyms.length > 1 ? (
        <Card title="Active gym">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {ownedGyms.map((gym) => (
                <Pressable
                  key={gym.id}
                  onPress={() => setActiveOwnerGymId(gym.id)}
                  className={`rounded-xl px-3 py-2 ${gym.id === activeOwnerGymId ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  <Text className={gym.id === activeOwnerGymId ? 'font-semibold text-white' : 'text-slate-900 dark:text-slate-100'}>
                    {gym.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Card>
      ) : null}

      {currentGym ? (
        <Card title="Profile">
          <Controller
            control={form.control}
            name="name"
            render={({ field: { onChange, value } }) => <Input label="Name" value={value} onChangeText={onChange} />}
          />

          <Controller
            control={form.control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input label="Description" value={value} onChangeText={onChange} autoCapitalize="sentences" />
            )}
          />

          <Button title="Save changes" onPress={submit} loading={form.formState.isSubmitting} />
        </Card>
      ) : (
        <Text className="text-slate-500">No gym found.</Text>
      )}

      {memberGyms.length > 0 ? (
        <Card title="Switch view">
          <Text className="mb-3 text-slate-600 dark:text-slate-400">Open the member experience for gyms where you train.</Text>
          <Button title="Go to member app" variant="ghost" onPress={() => setAppMode('member')} />
        </Card>
      ) : null}

      <Button title="Sign out" variant="danger" onPress={handleSignOut} />
    </Screen>
  );
}