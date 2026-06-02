import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { updateMyProfile } from '@/api/profiles.api';
import { queryClient } from '@/api/queries/client';
import { queryKeys } from '@/api/queries/keys';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Input } from '@/components/ui/Input';
import { LocationPickerField } from '@/components/ui/LocationPickerField';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import {
  isEmailAuthUser,
  resolveDisplayName,
  resolveProfileAddress,
  resolveProfileEmail,
} from '@/domain/profiles';
import {
  PROFILE_GENDER_OPTIONS,
  ageFromDateOfBirth,
  formatDateLabel,
  formatGenderLabel,
  type ProfileGenderValue,
} from '@/features/profile/labels';
import { createProfileFormSchema, type ProfileFormValues } from '@/features/profile/schema';
import { useMyProfile } from '@/hooks/useMyProfile';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';
import { layout, text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';
import { useTheme } from '@/hooks/useTheme';

function resolveGender(gender: string | null | undefined): ProfileGenderValue {
  if (gender === 'male' || gender === 'female' || gender === 'prefer_not_to_say') return gender;
  return 'prefer_not_to_say';
}

function ProfileDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-2">
      <Text className={text.label}>{label}</Text>
      <Text className={text.caption}>{value}</Text>
    </View>
  );
}

export function UserProfileScreen() {
  const { colors } = useTheme();
  const session = useAuthStore((state) => state.session);
  const profileQuery = useMyProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isOpeningEdit, setIsOpeningEdit] = useState(false);

  const profile = profileQuery.data;
  const isEmailUser = isEmailAuthUser(profile, session?.user ?? null);
  const resolvedEmail = resolveProfileEmail(profile, session?.user ?? null);
  const resolvedPhone = profile?.phone ?? session?.user.phone ?? null;
  const isOnboarding = !profile?.onboarding_completed;
  const phoneRequired = !isEmailUser;
  const resolvedName = resolveDisplayName(
    profile?.full_name,
    isEmailUser ? resolvedEmail : resolvedPhone,
    session?.user.id ?? null,
  );
  const resolvedAge =
    profile?.age != null
      ? String(profile.age)
      : profile?.date_of_birth
        ? String(ageFromDateOfBirth(profile.date_of_birth) ?? '')
        : '';

  const profileAddress = resolveProfileAddress(profile);

  const profileSchema = useMemo(
    () => createProfileFormSchema({ phoneRequired }),
    [phoneRequired],
  );

  const birthDateBounds = useMemo(() => {
    const maximumDate = new Date();
    maximumDate.setFullYear(maximumDate.getFullYear() - 13);

    const minimumDate = new Date();
    minimumDate.setFullYear(minimumDate.getFullYear() - 100);
    return { maximumDate, minimumDate };
  }, []);

  const defaults = useMemo<ProfileFormValues>(
    () => ({
      fullName: resolvedName,
      phone: resolvedPhone ?? '',
      gender: resolveGender(profile?.gender),
      dateOfBirth: profile?.date_of_birth ?? '',
      city: profile?.city ?? '',
      fitnessGoal: profile?.fitness_goal ?? '',
      homeLatitude: typeof profile?.home_latitude === 'number' ? profile.home_latitude : null,
      homeLongitude: typeof profile?.home_longitude === 'number' ? profile.home_longitude : null,
      homeLocationLabel: profile?.home_location_label ?? '',
    }),
    [profile, resolvedName, resolvedPhone],
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: defaults,
  });

  function buildFormValues(source = profile): ProfileFormValues {
    const phone = source?.phone ?? session?.user.phone ?? '';
    const name = resolveDisplayName(
      source?.full_name,
      isEmailUser ? resolvedEmail : phone,
      session?.user.id ?? null,
    );

    return {
      fullName: name,
      phone,
      gender: resolveGender(source?.gender),
      dateOfBirth: source?.date_of_birth ?? '',
      city: source?.city ?? '',
      fitnessGoal: source?.fitness_goal ?? '',
      homeLatitude: typeof source?.home_latitude === 'number' ? source.home_latitude : null,
      homeLongitude: typeof source?.home_longitude === 'number' ? source.home_longitude : null,
      homeLocationLabel: source?.home_location_label ?? '',
    };
  }

  async function openEditMode() {
    setIsOpeningEdit(true);
    try {
      const result = await profileQuery.refetch();
      form.reset(buildFormValues(result.data ?? profile));
      setIsEditing(true);
    } finally {
      setIsOpeningEdit(false);
    }
  }

  useEffect(() => {
    if (profileQuery.isLoading || profileQuery.isError || isEditing) return;
    if (isOnboarding) {
      form.reset(buildFormValues());
      setIsEditing(true);
    }
  }, [profileQuery.isLoading, profileQuery.isError, isOnboarding, isEditing]);

  const saveProfile = form.handleSubmit(async (values) => {
    const userId = session?.user.id;
    if (!userId) return;

    const computedAge = values.dateOfBirth ? ageFromDateOfBirth(values.dateOfBirth) : profile?.age ?? null;
    const trimmedPhone = values.phone.trim();

    try {
      await updateMyProfile(userId, {
        full_name: values.fullName.trim(),
        phone: trimmedPhone || null,
        gender: values.gender,
        age: computedAge,
        date_of_birth: values.dateOfBirth || (profile?.date_of_birth ?? null),
        city: values.city || null,
        fitness_goal: values.fitnessGoal || null,
        home_latitude: values.homeLatitude,
        home_longitude: values.homeLongitude,
        home_location_label: values.homeLocationLabel.trim() || null,
        onboarding_completed: true,
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.me(userId) });
      setIsEditing(false);

      if (isOnboarding) {
        router.replace('/(tabs)/profile-hub');
        return;
      }

      Alert.alert('Saved', 'Your profile was updated.');
    } catch (error) {
      form.setError('root', { message: getErrorMessage(error) });
    }
  });

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className={`${layout.stack} ${text.caption}`}>Loading your profile…</Text>
        </View>
      </Screen>
    );
  }

  if (profileQuery.isError) {
    return (
      <Screen scroll>
        <Text className={text.screenTitle}>My profile</Text>
        <Card title="Unable to load profile" className={layout.section}>
          <Text className={`mb-3 ${text.error}`}>{getErrorMessage(profileQuery.error)}</Text>
          <Button title="Try again" onPress={() => profileQuery.refetch()} loading={profileQuery.isFetching} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text className={text.screenTitle}>My profile</Text>
      <Text className={`${layout.stack} ${text.screenSubtitle}`}>
        Your account details from onboarding.
      </Text>

      {!isEditing ? (
        <Card title="Account details" className={layout.section}>
          {isEmailUser ? (
            <ProfileDetailRow label="Email" value={resolvedEmail ?? 'Not set'} />
          ) : (
            <ProfileDetailRow label="Phone" value={resolvedPhone ?? 'Not set'} />
          )}
          <ProfileDetailRow label="Full name" value={resolvedName} />
          <ProfileDetailRow label="Gender" value={formatGenderLabel(profile?.gender ?? null)} />
          <ProfileDetailRow
            label="Age"
            value={resolvedAge ? `${resolvedAge} years` : 'Not set'}
          />
          <ProfileDetailRow
            label="Date of birth"
            value={formatDateLabel(profile?.date_of_birth)}
          />
          <ProfileDetailRow label="Address" value={profileAddress ?? 'Not set'} />
          <ProfileDetailRow label="Fitness goal" value={profile?.fitness_goal?.trim() || 'Not set'} />

          <View className={layout.stackMd}>
            <Button title="Edit profile" onPress={openEditMode} loading={isOpeningEdit} />
          </View>
        </Card>
      ) : (
        <Card title="Edit profile" className={layout.section}>
          {isEmailUser ? (
            <Input
              label="Email"
              value={resolvedEmail ?? ''}
              editable={false}
              autoCapitalize="none"
            />
          ) : (
            <Controller
              control={form.control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input label="Phone" placeholder="+919876543210" value={value} onChangeText={onChange} keyboardType="phone-pad" />
              )}
            />
          )}
          {isEmailUser ? (
            <Controller
              control={form.control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={isOnboarding ? 'Phone (optional)' : 'Phone'}
                  placeholder="+919876543210"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                />
              )}
            />
          ) : null}
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
              <SelectField label="Gender" value={value} options={PROFILE_GENDER_OPTIONS} onChange={onChange} />
            )}
          />
          <Controller
            control={form.control}
            name="dateOfBirth"
            render={({ field: { onChange, value } }) => (
              <DatePickerField
                label="Age (date of birth)"
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
              <Input
                label="Address (manual)"
                placeholder="Street, area, city"
                value={value}
                onChangeText={onChange}
                autoCapitalize="sentences"
              />
            )}
          />
          <LocationPickerField
            label="Home location"
            description="Preferred — this address is shown on your profile when set."
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
                label="Fitness goal"
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

          <View className="flex-row" style={{ gap: spacing[2] }}>
            {!isOnboarding ? (
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => {
                    form.reset(buildFormValues());
                    setIsEditing(false);
                  }}
                  disabled={form.formState.isSubmitting}
                />
              </View>
            ) : null}
            <View className="flex-1">
              <Button
                title={isOnboarding ? 'Complete setup' : 'Save changes'}
                onPress={saveProfile}
                loading={form.formState.isSubmitting}
              />
            </View>
          </View>
        </Card>
      )}


    </Screen>
  );
}
