import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { updateMyProfile } from '@/api/profiles.api';
import { queryClient } from '@/api/queries/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { getErrorMessage } from '@/lib/errors';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useAuthStore } from '@/store/auth.store';
import { layout, text } from '@/theme/classes';

const profileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required'),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
      errorMap: () => ({ message: 'Select a valid gender' }),
    }),
    age: z
      .string()
      .optional()
      .transform((v) => (v ?? '').trim()),
    dateOfBirth: z
      .string()
      .optional()
      .transform((v) => (v ?? '').trim()),
    city: z
      .string()
      .optional()
      .transform((v) => (v ?? '').trim()),
    fitnessGoal: z
      .string()
      .optional()
      .transform((v) => (v ?? '').trim()),
  })
  .superRefine((values, ctx) => {
    if (values.age && !/^\d+$/.test(values.age)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['age'], message: 'Age must be a number' });
    }
    if (values.age) {
      const n = Number(values.age);
      if (n < 13 || n > 100) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['age'], message: 'Age must be between 13 and 100' });
      }
    }
    if (values.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(values.dateOfBirth)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dateOfBirth'], message: 'Use YYYY-MM-DD format' });
    }
  });

type ProfileForm = z.infer<typeof profileSchema>;

export function ProfileSetupScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [step, setStep] = useState<1 | 2>(1);
  const session = useAuthStore((state) => state.session);
  const profileQuery = useMyProfile();

  const defaults = useMemo(() => {
    const profile = profileQuery.data;
    return {
      fullName: profile?.full_name ?? '',
      gender: (profile?.gender ?? 'prefer_not_to_say') as ProfileForm['gender'],
      age: profile?.age != null ? String(profile.age) : '',
      dateOfBirth: profile?.date_of_birth ?? '',
      city: profile?.city ?? '',
      fitnessGoal: profile?.fitness_goal ?? '',
    };
  }, [profileQuery.data]);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: defaults,
  });

  const submit = form.handleSubmit(async (values) => {
    const userId = session?.user.id;
    if (!userId) return;

    try {
      await updateMyProfile(userId, {
        full_name: values.fullName.trim(),
        gender: values.gender,
        age: values.age ? Number(values.age) : null,
        date_of_birth: values.dateOfBirth || null,
        city: values.city || null,
        fitness_goal: values.fitnessGoal || null,
        onboarding_completed: true,
      });

      await queryClient.invalidateQueries({ queryKey: ['profile', userId] });

      if (typeof redirect === 'string' && redirect.length > 0) {
        router.replace(redirect as never);
      } else {
        router.replace('/(tabs)/profile-hub');
      }
    } catch (error) {
      form.setError('root', { message: getErrorMessage(error) });
    }
  });

  if (!session) {
    router.replace('/auth/login');
    return null;
  }

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitle}`}>Set up your profile</Text>
      <Text className={`${layout.stack} ${text.screenSubtitle}`}>
        Complete your profile once to personalize memberships, onboarding, and gym actions.
      </Text>
      <Text className={`${layout.stack} ${text.caption}`}>Phone: {session.user.phone ?? 'Not available'}</Text>

      {step === 1 ? (
        <View className={layout.sectionXl}>
          <Controller
            control={form.control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <Input label="Full name" placeholder="Your name" value={value} onChangeText={onChange} autoCapitalize="sentences" />
            )}
          />
          <Controller
            control={form.control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Gender (male/female/other/prefer_not_to_say)"
                placeholder="prefer_not_to_say"
                value={value}
                onChangeText={(v) => onChange(v as ProfileForm['gender'])}
              />
            )}
          />
          <Controller
            control={form.control}
            name="age"
            render={({ field: { onChange, value } }) => (
              <Input label="Age (optional)" placeholder="24" value={value} onChangeText={onChange} keyboardType="number-pad" />
            )}
          />
          {form.formState.errors.fullName?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.fullName.message}</Text> : null}
          {form.formState.errors.gender?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.gender.message}</Text> : null}
          {form.formState.errors.age?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.age.message}</Text> : null}
          <Button title="Next" onPress={() => setStep(2)} />
        </View>
      ) : (
        <View className={layout.sectionXl}>
          <Controller
            control={form.control}
            name="dateOfBirth"
            render={({ field: { onChange, value } }) => (
              <Input label="Date of birth (optional)" placeholder="1999-12-31" value={value} onChangeText={onChange} />
            )}
          />
          <Controller
            control={form.control}
            name="city"
            render={({ field: { onChange, value } }) => (
              <Input label="City (optional)" placeholder="Delhi" value={value} onChangeText={onChange} autoCapitalize="sentences" />
            )}
          />
          <Controller
            control={form.control}
            name="fitnessGoal"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Fitness goal (optional)"
                placeholder="Strength and fat loss"
                value={value}
                onChangeText={onChange}
                autoCapitalize="sentences"
              />
            )}
          />
          {form.formState.errors.dateOfBirth?.message ? (
            <Text className={`mb-2 ${text.error}`}>{form.formState.errors.dateOfBirth.message}</Text>
          ) : null}
          {form.formState.errors.root?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.root.message}</Text> : null}
          <View className={layout.row}>
            <View className={layout.flex1}>
              <Button title="Back" variant="ghost" onPress={() => setStep(1)} />
            </View>
            <View className={layout.flex1}>
              <Button title="Complete setup" onPress={submit} loading={form.formState.isSubmitting} />
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}
