import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { queryClient } from '@/api/queries/client';
import { queryKeys } from '@/api/queries/keys';
import { createGym } from '@/api/gyms.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { LocationPickerField } from '@/components/ui/LocationPickerField';
import { Screen } from '@/components/ui/Screen';
import { TimePickerField } from '@/components/ui/TimePickerField';
import { useImageDeletion, useImageUpload } from '@/hooks';
import {
  FACILITIES,
  GYM_TYPES,
  WORKING_DAYS,
  createGymDefaultValues,
  createGymStepFields,
  createGymSteps,
  createGymValidationSchema,
  isResolvedOwnerContactComplete,
  resolveGymOwnerFromAccount,
  toCreateGymInput,
  type CreateGymFormValues,
} from '@/features/create-gym';
import { getErrorMessage } from '@/lib/errors';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useAuthIntentStore } from '@/store/auth-intent.store';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { layout, text } from '@/theme/classes';

export function OnboardingScreen() {
  const session = useAuthStore((state) => state.session);
  const clearPendingIntent = useAuthIntentStore((state) => state.clearPendingIntent);
  const setAppMode = useAppStore((state) => state.setAppMode);
  const setActiveOwnerGymId = useAppStore((state) => state.setActiveOwnerGymId);
  const [stepIndex, setStepIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const { upload, isUploading, error: uploadError, resetError: clearUploadError } = useImageUpload();
  const { remove } = useImageDeletion();
  const profileQuery = useMyProfile();

  const resolvedOwner = useMemo(
    () => (session?.user ? resolveGymOwnerFromAccount(profileQuery.data, session.user) : null),
    [profileQuery.data, session?.user],
  );

  const form = useForm<CreateGymFormValues>({
    resolver: zodResolver(createGymValidationSchema),
    defaultValues: createGymDefaultValues,
    mode: 'onBlur',
  });

  const submit = form.handleSubmit(async (values) => {
    if (!session?.user) {
      form.setError('root', { message: 'Session expired. Please sign in again.' });
      return;
    }

    let uploadedLogoPath: string | undefined;

    try {
      if (!resolvedOwner || !isResolvedOwnerContactComplete(resolvedOwner)) {
        form.setError('root', {
          message:
            'Your profile needs a valid name and phone. Open Profile → My profile to update them before creating a gym.',
        });
        return;
      }

      const payload = toCreateGymInput(values, resolvedOwner);
      if (values.gymLogoUri?.trim()) {
        clearUploadError();
        const uploaded = await upload(
          {
            uri: values.gymLogoUri.trim(),
            fileName: `${values.gymName || 'gym'}-logo.jpg`,
          },
          'gyms',
        );
        if (!uploaded) {
          form.setError('root', { message: uploadError ?? 'Logo upload failed. Please retry.' });
          return;
        }

        payload.logoUrl = uploaded.publicUrl;
        uploadedLogoPath = uploaded.path;
      }

      const gym = await createGym(payload);

      setAppMode('owner');
      setActiveOwnerGymId(gym.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.publicList });
      clearPendingIntent();
      setToast('Gym created successfully');
      Alert.alert('Success', 'Gym created successfully.');
      router.replace('/dashboard');
    } catch (error) {
      if (uploadedLogoPath) {
        void remove(uploadedLogoPath);
      }
      form.setError('root', { message: getErrorMessage(error) });
    }
  });

  async function pickGymLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;
    clearUploadError();
    form.setValue('gymLogoUri', result.assets[0].uri, { shouldValidate: true });
  }

  const activeStep = createGymSteps[stepIndex];
  const selectedGymLogo = form.watch('gymLogoUri');

  async function goNextStep() {
    const fields = [...createGymStepFields[activeStep.id]];
    if (fields.length > 0) {
      const valid = await form.trigger(fields as Parameters<typeof form.trigger>[0], {
        shouldFocus: true,
      });
      if (!valid) return;
    }

    if (activeStep.id === 'ownerInformation') {
      if (profileQuery.isLoading) return;
      if (!resolvedOwner || !isResolvedOwnerContactComplete(resolvedOwner)) {
        form.setError('root', {
          message:
            'Complete your profile name and phone first (Profile → My profile), then continue here.',
        });
        return;
      }
      form.clearErrors('root');
    }

    setStepIndex((value) => Math.min(value + 1, createGymSteps.length - 1));
  }

  function goBackStep() {
    setStepIndex((value) => Math.max(value - 1, 0));
  }

  function toggleMultiValue(field: 'workingDays' | 'facilities', value: string) {
    const current = form.getValues(field) as string[];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    form.setValue(field, next as never, { shouldValidate: true });
  }

  return (
    <Screen scroll>
      <Text className={`${layout.screenTopLg} ${text.screenTitleLg}`}>Create your gym</Text>
      <Text className={`${layout.stack} ${text.screenSubtitle}`}>
        Simple onboarding to launch your gym account and start using the platform.
      </Text>
      <Text className={`${layout.stackSm} ${text.caption}`}>
        Step {stepIndex + 1} of {createGymSteps.length}: {activeStep.title}
      </Text>

      <View className="mt-8">
        {activeStep.id === 'gymInformation' ? (
          <Card title="Gym Information">
            <Controller
              control={form.control}
              name="gymName"
              render={({ field: { onChange, value } }) => (
                <Input label="Gym Name" placeholder="Iron Temple" value={value} onChangeText={onChange} />
              )}
            />
            {form.formState.errors.gymName?.message ? (
              <Text className={`mb-2 ${text.error}`}>{form.formState.errors.gymName.message}</Text>
            ) : null}

            <View className="mb-4">
              <Text className={`mb-2 ${text.label}`}>Gym Logo Upload</Text>
              <Button
                title={selectedGymLogo ? 'Change Logo' : 'Upload Logo'}
                variant="ghost"
                onPress={pickGymLogo}
                disabled={isUploading || form.formState.isSubmitting}
              />
              {selectedGymLogo ? (
                <Text className={`${layout.stackSm} ${text.caption}`}>
                  {selectedGymLogo.startsWith('http') ? 'Logo ready for publish' : 'Logo selected'}
                </Text>
              ) : null}
              {uploadError ? <Text className={`${layout.stackSm} ${text.error}`}>{uploadError}</Text> : null}
            </View>

            <Controller
              control={form.control}
              name="gymType"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Gym Type / Category"
                  placeholder={GYM_TYPES[0]}
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="sentences"
                />
              )}
            />
            <View className="mb-4 flex-row flex-wrap gap-2">
              {GYM_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  active={form.watch('gymType') === type}
                  onPress={() => form.setValue('gymType', type, { shouldValidate: true })}
                />
              ))}
            </View>
            {form.formState.errors.gymType?.message ? (
              <Text className={`mb-2 ${text.error}`}>{form.formState.errors.gymType.message}</Text>
            ) : null}

            <Controller
              control={form.control}
              name="gymDescription"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Gym Description"
                  placeholder="Briefly describe your gym and training style"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="sentences"
                />
              )}
            />
            {form.formState.errors.gymDescription?.message ? (
              <Text className={`mb-2 ${text.error}`}>{form.formState.errors.gymDescription.message}</Text>
            ) : null}
          </Card>
        ) : null}

        {activeStep.id === 'ownerInformation' ? (
          <Card title="Owner Information">
            {profileQuery.isLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator accessibilityLabel="Loading profile" />
                <Text className={`mt-4 ${text.caption}`}>Loading your account…</Text>
              </View>
            ) : (
              <>
                <Text className={`mb-4 ${text.caption}`}>
                  Name and phone are taken from your account (saved during onboarding). Use Profile → My profile if you need
                  to change them.
                </Text>
                <Text className={`mb-1 ${text.label}`}>Name</Text>
                <Text className={`mb-3 ${text.bodySm}`}>{resolvedOwner?.name?.trim() ? resolvedOwner.name : '—'}</Text>
                <Text className={`mb-1 ${text.label}`}>Phone</Text>
                <Text className={`mb-3 ${text.bodySm}`}>{resolvedOwner?.phone?.trim() ? resolvedOwner.phone : '—'}</Text>
                {resolvedOwner && !isResolvedOwnerContactComplete(resolvedOwner) ? (
                  <Text className={`${text.warning}`}>Add a valid name and phone in your profile before you continue.</Text>
                ) : null}
              </>
            )}
          </Card>
        ) : null}

        {activeStep.id === 'gymAddress' ? (
          <Card title="Gym Address">
            <Controller control={form.control} name="country" render={({ field: { onChange, value } }) => <Input label="Country" placeholder="India" value={value} onChangeText={onChange} autoCapitalize="sentences" />} />
            {form.formState.errors.country?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.country.message}</Text> : null}
            <Controller control={form.control} name="state" render={({ field: { onChange, value } }) => <Input label="State" placeholder="Maharashtra" value={value} onChangeText={onChange} autoCapitalize="sentences" />} />
            {form.formState.errors.state?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.state.message}</Text> : null}
            <Controller control={form.control} name="city" render={({ field: { onChange, value } }) => <Input label="City" placeholder="Pune" value={value} onChangeText={onChange} autoCapitalize="sentences" />} />
            {form.formState.errors.city?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.city.message}</Text> : null}
            <Controller control={form.control} name="fullAddress" render={({ field: { onChange, value } }) => <Input label="Full Address" placeholder="Street, Area" value={value} onChangeText={onChange} autoCapitalize="sentences" />} />
            {form.formState.errors.fullAddress?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.fullAddress.message}</Text> : null}
            <Controller control={form.control} name="pincode" render={({ field: { onChange, value } }) => <Input label="Pincode" placeholder="411001" value={value} onChangeText={onChange} keyboardType="number-pad" />} />
            {form.formState.errors.pincode?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.pincode.message}</Text> : null}
            <LocationPickerField
              label="Pin your gym on the map"
              description="Required for nearby search. Visit the entrance and tap GPS, or match the address lines above."
              buildAddressGeocodeQuery={() => {
                const fields = form.getValues();
                const joined = [fields.fullAddress, fields.city, fields.state, fields.country, fields.pincode]
                  .map((part) => (part ?? '').trim())
                  .filter(Boolean)
                  .join(', ')
                  .trim();
                return joined.length >= 6 ? joined : null;
              }}
              latitude={form.watch('gymLatitude')}
              longitude={form.watch('gymLongitude')}
              locationLabel={form.watch('gymLocationLabel')}
              disabled={form.formState.isSubmitting}
              errorMessage={
                typeof form.formState.errors.gymLatitude?.message === 'string'
                  ? form.formState.errors.gymLatitude.message
                  : undefined
              }
              onCoordinatesChange={(next) => {
                form.setValue('gymLatitude', next.latitude, { shouldValidate: true });
                form.setValue('gymLongitude', next.longitude, { shouldValidate: true });
                form.setValue('gymLocationLabel', next.label?.trim() ?? '', { shouldValidate: true });
              }}
              onClear={() => {
                form.setValue('gymLatitude', null, { shouldValidate: true });
                form.setValue('gymLongitude', null, { shouldValidate: true });
                form.setValue('gymLocationLabel', '', { shouldValidate: true });
              }}
            />
          </Card>
        ) : null}

        {activeStep.id === 'gymTiming' ? (
          <Card title="Gym Timing">
            <Controller
              control={form.control}
              name="openingTime"
              render={({ field: { onChange, value } }) => (
                <TimePickerField label="Opening Time" value={value} onChange={onChange} />
              )}
            />
            {form.formState.errors.openingTime?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.openingTime.message}</Text> : null}
            <Controller
              control={form.control}
              name="closingTime"
              render={({ field: { onChange, value } }) => (
                <TimePickerField label="Closing Time" value={value} onChange={onChange} />
              )}
            />
            {form.formState.errors.closingTime?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.closingTime.message}</Text> : null}
            <Text className={`mb-2 ${text.label}`}>Working Days</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {WORKING_DAYS.map((day) => (
                <Chip
                  key={day}
                  label={day.slice(0, 3)}
                  active={form.watch('workingDays').includes(day)}
                  onPress={() => toggleMultiValue('workingDays', day)}
                />
              ))}
            </View>
            {form.formState.errors.workingDays?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.workingDays.message}</Text> : null}
          </Card>
        ) : null}

        {activeStep.id === 'membershipSetup' ? (
          <Card title="Membership Setup">
            <Controller control={form.control} name="monthlyFee" render={({ field: { onChange, value } }) => <Input label="Monthly Fee" placeholder="2500" value={value} onChangeText={onChange} keyboardType="number-pad" />} />
            {form.formState.errors.monthlyFee?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.monthlyFee.message}</Text> : null}
            <Controller control={form.control} name="quarterlyFee" render={({ field: { onChange, value } }) => <Input label="Quarterly Fee" placeholder="6500" value={value} onChangeText={onChange} keyboardType="number-pad" />} />
            {form.formState.errors.quarterlyFee?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.quarterlyFee.message}</Text> : null}
            <Controller control={form.control} name="yearlyFee" render={({ field: { onChange, value } }) => <Input label="Yearly Fee" placeholder="22000" value={value} onChangeText={onChange} keyboardType="number-pad" />} />
            {form.formState.errors.yearlyFee?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.yearlyFee.message}</Text> : null}
          </Card>
        ) : null}

        {activeStep.id === 'facilities' ? (
          <Card title="Facilities">
            <Text className={`mb-2 ${text.label}`}>Select amenities</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {FACILITIES.map((facility) => (
                <Chip
                  key={facility}
                  label={facility}
                  active={form.watch('facilities').includes(facility)}
                  onPress={() => toggleMultiValue('facilities', facility)}
                />
              ))}
            </View>
            {form.formState.errors.facilities?.message ? <Text className={`mb-2 ${text.error}`}>{form.formState.errors.facilities.message}</Text> : null}
          </Card>
        ) : null}

        {form.formState.errors.root?.message ? (
          <Text className={`mb-2 ${text.error}`}>{form.formState.errors.root.message}</Text>
        ) : null}

        {toast ? <Text className={`mb-2 ${text.link}`}>{toast}</Text> : null}

        <View className="flex-row gap-2">
          {stepIndex > 0 ? (
            <View className="flex-1">
              <Button title="Back" variant="ghost" onPress={goBackStep} />
            </View>
          ) : null}

          {stepIndex < createGymSteps.length - 1 ? (
            <View className="flex-1">
              <Button
                title="Next"
                onPress={goNextStep}
                disabled={activeStep.id === 'ownerInformation' && profileQuery.isLoading}
              />
            </View>
          ) : (
            <View className="flex-1">
              <Button title="Create gym" onPress={submit} loading={form.formState.isSubmitting || isUploading} />
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
