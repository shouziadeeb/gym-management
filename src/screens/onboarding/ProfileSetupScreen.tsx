import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useMemo } from 'react';
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

const PROFILE_GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

function toDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

function buildDefaultName(phone: string | null | undefined): string {
  const digits = toDigits(phone);
  if (digits.length > 0) return `user${digits}`;
  return `user${Date.now().toString().slice(-6)}`;
}

const profileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required'),
    phone: z.string().trim().min(5, 'Phone is required'),
    gender: z.enum(PROFILE_GENDERS, { message: 'Select a valid gender' }),
    age: z
      .string()
      .transform((v) => (v ?? '').trim()),
    dateOfBirth: z
      .string()
      .transform((v) => (v ?? '').trim()),
    city: z
      .string()
      .transform((v) => (v ?? '').trim()),
    fitnessGoal: z
      .string()
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
  const session = useAuthStore((state) => state.session);
  const profileQuery = useMyProfile();
  const sessionPhone = session?.user.phone ?? null;

  const defaults = useMemo<ProfileForm>(() => {
    const profile = profileQuery.data;
    const resolvedPhone = profile?.phone ?? sessionPhone ?? '';
    const resolvedName = profile?.full_name?.trim() || buildDefaultName(resolvedPhone);

    return {
      fullName: resolvedName,
      phone: resolvedPhone,
      gender: (profile?.gender ?? 'prefer_not_to_say') as ProfileForm['gender'],
      age: profile?.age != null ? String(profile.age) : '',
      dateOfBirth: profile?.date_of_birth ?? '',
      city: profile?.city ?? '',
      fitnessGoal: profile?.fitness_goal ?? '',
    };
  }, [profileQuery.data, sessionPhone]);

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
        phone: values.phone.trim(),
        gender: values.gender,
        age: values.age ? Number(values.age) : null,
        date_of_birth: values.dateOfBirth ?? null,
        city: values.city ?? null,
        fitness_goal: values.fitnessGoal ?? null,
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

      <View className={layout.sectionXl}>
        <Controller
          control={form.control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input label="Phone" placeholder="+919876543210" value={value} onChangeText={onChange} keyboardType="phone-pad" />
          )}
        />
        <Controller
          control={form.control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <Input label="Full name" placeholder="user9876543210" value={value} onChangeText={onChange} autoCapitalize="none" />
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

        {form.formState.errors.phone?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.phone.message}</Text> : null}
        {form.formState.errors.fullName?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.fullName.message}</Text> : null}
        {form.formState.errors.gender?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.gender.message}</Text> : null}
        {form.formState.errors.age?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.age.message}</Text> : null}
        {form.formState.errors.dateOfBirth?.message ? (
          <Text className={`mb-2 ${text.error}`}>{form.formState.errors.dateOfBirth.message}</Text>
        ) : null}
        {form.formState.errors.root?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.root.message}</Text> : null}

        <Button title="Complete setup" onPress={submit} loading={form.formState.isSubmitting} />
      </View>
    </Screen>
  );
}
