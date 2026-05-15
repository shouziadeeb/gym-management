import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { queryClient } from '@/api/queries/client';
import { queryKeys } from '@/api/queries/keys';
import { createGym } from '@/api/gyms.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { getErrorMessage } from '@/lib/errors';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  name: z.string().min(2, 'Gym name is required'),
  description: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export function OnboardingScreen() {
  const session = useAuthStore((state) => state.session);
  const setActiveOwnerGymId = useAppStore((state) => state.setActiveOwnerGymId);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    if (!session?.user) {
      form.setError('root', { message: 'Session expired. Please sign in again.' });
      return;
    }

    try {
      const gym = await createGym({
        name: values.name.trim(),
        description: values.description?.trim(),
      });

      setActiveOwnerGymId(gym.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
    } catch (error) {
      form.setError('root', { message: getErrorMessage(error) });
    }
  });

  return (
    <Screen scroll>
      <Text className="pt-10 text-2xl font-bold text-slate-900 dark:text-white">Create your gym</Text>
      <Text className="mt-2 text-slate-600 dark:text-slate-400">
        You are not linked to a gym yet. Create one to start managing members, or ask a coach for an invite after they add
        your phone number.
      </Text>

      <View className="mt-8">
        <Controller
          control={form.control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input label="Gym name" placeholder="Iron Temple" value={value} onChangeText={onChange} />
          )}
        />

        <Controller
          control={form.control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Description (optional)"
              placeholder="Strength & conditioning"
              value={value}
              onChangeText={onChange}
              autoCapitalize="sentences"
            />
          )}
        />

        {form.formState.errors.root?.message ? (
          <Text className="mb-2 text-sm text-red-600">{form.formState.errors.root.message}</Text>
        ) : null}

        <Button title="Create gym" onPress={submit} loading={form.formState.isSubmitting} />
      </View>
    </Screen>
  );
}