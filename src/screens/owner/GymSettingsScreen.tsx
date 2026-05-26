import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useCallback, useEffect, useMemo } from 'react';
import { z } from 'zod';

import { queryClient } from '@/api/queries/client';
import { queryKeys } from '@/api/queries/keys';
import { updateGym } from '@/api/gyms.api';
import { addGymImage, getGymImages, removeGymImage, type GymImage } from '@/api/gym-images.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { GymImagePicker } from '@/components/gym/GymImagePicker';
import { useUserGyms } from '@/hooks/useUserGyms';
import { getErrorMessage } from '@/lib/errors';
import { deleteImageByUrl } from '@/lib/storage';
import { signOut } from '@/services/auth/auth.service';
import { useAppStore } from '@/store/app.store';
import { layout, text } from '@/theme/classes';

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

  const gymImages = useMemo(() => (currentGym ? getGymImages(currentGym) : []), [currentGym?.settings]);

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

  const handleAddImage = useCallback(
    async (uri: string) => {
      if (!currentGym) return;
      await addGymImage(currentGym.id, uri);
      await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
    },
    [currentGym],
  );

  const handleRemoveImage = useCallback(
    async (path: string) => {
      if (!currentGym) return;
      await removeGymImage(currentGym.id, path);
      await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
    },
    [currentGym],
  );

  const handleRemoveLogo = useCallback(async () => {
    if (!currentGym) return;
    if (currentGym.logo_url?.trim()) {
      await deleteImageByUrl(currentGym.logo_url.trim());
    }
    await updateGym(currentGym.id, { logo_url: null });
    await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
  }, [currentGym]);

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
      <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>Gym settings</Text>

      {ownedGyms.length > 1 ? (
        <Card title="Active gym">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className={layout.row}>
              {ownedGyms.map((gym) => (
                <Chip
                  key={gym.id}
                  label={gym.name}
                  active={gym.id === activeOwnerGymId}
                  onPress={() => setActiveOwnerGymId(gym.id)}
                />
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
      ) : null}

      {currentGym ? (
        <Card>
          <GymImagePicker images={gymImages} logoUrl={currentGym.logo_url} onAdd={handleAddImage} onRemove={handleRemoveImage} onRemoveLogo={handleRemoveLogo} />
        </Card>
      ) : (
        <Text className={text.loading}>No gym found.</Text>
      )}

      {memberGyms.length > 0 ? (
        <Card title="Switch view">
          <Text className={`mb-3 ${text.caption}`}>Open the member experience for gyms where you train.</Text>
          <Button title="Go to member app" variant="ghost" onPress={() => setAppMode('member')} />
        </Card>
      ) : null}

      <Button title="Sign out" variant="danger" onPress={handleSignOut} />
    </Screen>
  );
}
