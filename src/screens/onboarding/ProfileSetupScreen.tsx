import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { updateMyProfile } from '@/api/profiles.api';
import { queryClient } from '@/api/queries/client';
import { queryKeys } from '@/api/queries/keys';
import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Input } from '@/components/ui/Input';
import { LocationPickerField } from '@/components/ui/LocationPickerField';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { buildDefaultDisplayName } from '@/domain/profiles';
import { PROFILE_GENDER_OPTIONS, ageFromDateOfBirth } from '@/features/profile/labels';
import { getErrorMessage } from '@/lib/errors';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useAuthStore } from '@/store/auth.store';
import { layout, text } from '@/theme/classes';

const ONBOARDING_GENDERS = ['male', 'female', 'prefer_not_to_say'] as const;

const profileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required'),
    phone: z.string().trim().min(5, 'Phone is required'),
    gender: z.enum(ONBOARDING_GENDERS, { message: 'Select a valid gender' }),
    dateOfBirth: z.string().transform((v) => (v ?? '').trim()),
    city: z.string().transform((v) => (v ?? '').trim()),
    fitnessGoal: z.string().transform((v) => (v ?? '').trim()),
    homeLatitude: z.union([z.number(), z.null()]),
    homeLongitude: z.union([z.number(), z.null()]),
    homeLocationLabel: z.string().transform((v) => (v ?? '').trim()),
  })
  .superRefine((values, ctx) => {
    if (!values.dateOfBirth) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dateOfBirth)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dateOfBirth'], message: 'Select a valid date' });
      return;
    }
    const age = ageFromDateOfBirth(values.dateOfBirth);
    if (age == null || age < 13 || age > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dateOfBirth'], message: 'Age must be between 13 and 100' });
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
    const resolvedName = profile?.full_name?.trim() || buildDefaultDisplayName(resolvedPhone, session?.user.id);

    const rawGender = profile?.gender;
    const gender: ProfileForm['gender'] =
      rawGender === 'male' || rawGender === 'female' || rawGender === 'prefer_not_to_say'
        ? rawGender
        : 'prefer_not_to_say';

    return {
      fullName: resolvedName,
      phone: resolvedPhone,
      gender,
      dateOfBirth: profile?.date_of_birth ?? '',
      city: profile?.city ?? '',
      fitnessGoal: profile?.fitness_goal ?? '',
      homeLatitude: typeof profile?.home_latitude === 'number' ? profile.home_latitude : null,
      homeLongitude: typeof profile?.home_longitude === 'number' ? profile.home_longitude : null,
      homeLocationLabel: profile?.home_location_label ?? '',
    };
  }, [profileQuery.data, sessionPhone, session?.user.id]);

  const birthDateBounds = useMemo(() => {
    const maximumDate = new Date();
    maximumDate.setFullYear(maximumDate.getFullYear() - 13);
    const minimumDate = new Date();
    minimumDate.setFullYear(minimumDate.getFullYear() - 100);
    return { maximumDate, minimumDate };
  }, []);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: defaults,
  });

  const submit = form.handleSubmit(async (values) => {
    const userId = session?.user.id;
    if (!userId) return;

    try {
      const computedAge = values.dateOfBirth ? ageFromDateOfBirth(values.dateOfBirth) : null;

      await updateMyProfile(userId, {
        full_name: values.fullName.trim(),
        phone: values.phone.trim(),
        gender: values.gender,
        age: computedAge,
        date_of_birth: values.dateOfBirth || null,
        city: values.city ?? null,
        fitness_goal: values.fitnessGoal ?? null,
        home_latitude: values.homeLatitude,
        home_longitude: values.homeLongitude,
        home_location_label: values.homeLocationLabel.trim() || null,
        onboarding_completed: true,
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.me(userId) });

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
            <SelectField label="Gender" value={value} options={PROFILE_GENDER_OPTIONS} onChange={onChange} />
          )}
        />
        <Controller
          control={form.control}
          name="dateOfBirth"
          render={({ field: { onChange, value } }) => (
            <DatePickerField
              label="Date of birth (optional)"
              value={value}
              onChange={onChange}
              placeholder="Select date of birth"
              maximumDate={birthDateBounds.maximumDate}
              minimumDate={birthDateBounds.minimumDate}
            />
          )}
        />
        <Controller
          control={form.control}
          name="city"
          render={({ field: { onChange, value } }) => (
            <Input label="City (optional)" placeholder="Delhi" value={value} onChangeText={onChange} autoCapitalize="sentences" />
          )}
        />
        <LocationPickerField
          label="Home area (optional)"
          description="Saves a privacy-safe pin so we can rank nearby gyms even if live GPS is disabled later."
          latitude={form.watch('homeLatitude')}
          longitude={form.watch('homeLongitude')}
          locationLabel={form.watch('homeLocationLabel')}
          disabled={form.formState.isSubmitting}
          onCoordinatesChange={(next) => {
            form.setValue('homeLatitude', next.latitude, { shouldValidate: true });
            form.setValue('homeLongitude', next.longitude, { shouldValidate: true });
            form.setValue('homeLocationLabel', next.label?.trim() ?? '', { shouldValidate: true });
          }}
          onClear={() => {
            form.setValue('homeLatitude', null, { shouldValidate: true });
            form.setValue('homeLongitude', null, { shouldValidate: true });
            form.setValue('homeLocationLabel', '', { shouldValidate: true });
          }}
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
        {form.formState.errors.dateOfBirth?.message ? (
          <Text className={`mb-2 ${text.error}`}>{form.formState.errors.dateOfBirth.message}</Text>
        ) : null}
        {form.formState.errors.root?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.root.message}</Text> : null}

        <Button title="Complete setup" onPress={submit} loading={form.formState.isSubmitting} />
      </View>
    </Screen>
  );
}
