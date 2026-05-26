import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { queryClient } from '@/api/queries/client';
import { queryKeys } from '@/api/queries/keys';
import { updateGym, updateGymProfile } from '@/api/gyms.api';
import {
  addGymImage,
  getAllGymImageUrls,
  getGymImages,
  removeGymImage,
  type GymImage,
} from '@/api/gym-images.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { TimePickerField } from '@/components/ui/TimePickerField';
import { GymImageGallery } from '@/components/gym/GymImageGallery';
import { GymImagePicker } from '@/components/gym/GymImagePicker';
import {
  FACILITIES,
  GYM_TYPES,
  WORKING_DAYS,
  gymProfileEditSchema,
  type GymProfileEditFormValues,
} from '@/features/create-gym';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/errors';
import { deleteImageByUrl } from '@/lib/storage';
import { useAuthStore } from '@/store/auth.store';
import { layout, text } from '@/theme/classes';
import type { Gym } from '@/types/models';
import { parseAddressString } from '@/utils/address';
import {
  centsToInputAmount,
  formatMoneyFromCents,
  formatTime12h,
  formatWorkingDays,
  parseGymSettings,
} from '@/utils/gym-settings';

type OwnerGymProfileCardProps = {
  ownedGyms: Gym[];
  activeGym: Gym | null;
  activeOwnerGymId: string | null;
  onSelectGym: (gymId: string) => void;
};

export function OwnerGymProfileCard({
  ownedGyms,
  activeGym,
  activeOwnerGymId,
  onSelectGym,
}: OwnerGymProfileCardProps) {
  const { colors } = useTheme();
  const session = useAuthStore((state) => state.session);
  const [isEditingGym, setIsEditingGym] = useState(false);

  const activeGymSettings = useMemo(
    () => parseGymSettings(activeGym?.settings),
    [activeGym?.settings],
  );
  const parsedAddress = useMemo(
    () => parseAddressString(activeGym?.address ?? ''),
    [activeGym?.address],
  );

  const gymDefaults = useMemo<GymProfileEditFormValues>(
    () => ({
      gymName: activeGym?.name ?? '',
      gymDescription: activeGym?.description ?? '',
      gymType: activeGymSettings.gymType ?? '',
      country: parsedAddress.country ?? '',
      state: parsedAddress.state ?? '',
      city: parsedAddress.city ?? '',
      fullAddress: parsedAddress.fullAddress ?? '',
      pincode: parsedAddress.pincode ?? '',
      openingTime: activeGymSettings.timings?.openingTime ?? '',
      closingTime: activeGymSettings.timings?.closingTime ?? '',
      monthlyFee: centsToInputAmount(activeGymSettings.membershipPlans?.monthlyFeeCents),
      quarterlyFee: centsToInputAmount(activeGymSettings.membershipPlans?.quarterlyFeeCents),
      yearlyFee: centsToInputAmount(activeGymSettings.membershipPlans?.yearlyFeeCents),
      workingDays: (activeGymSettings.timings?.workingDays ?? []) as GymProfileEditFormValues['workingDays'],
      facilities: (activeGymSettings.facilities ?? []) as GymProfileEditFormValues['facilities'],
    }),
    [activeGym?.id, activeGym?.name, activeGym?.description, activeGymSettings, parsedAddress],
  );

  const gymForm = useForm<GymProfileEditFormValues>({
    resolver: zodResolver(gymProfileEditSchema),
    defaultValues: gymDefaults,
  });

  useEffect(() => {
    gymForm.reset(gymDefaults);
  }, [gymDefaults, gymForm]);

  const gymImages = useMemo(
    (): GymImage[] => (activeGym ? getGymImages(activeGym) : []),
    [activeGym?.settings],
  );
  const allImageUrls = useMemo(
    () => (activeGym ? getAllGymImageUrls(activeGym) : []),
    [activeGym?.settings, activeGym?.logo_url],
  );

  const invalidateGymCaches = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.owned(session?.user.id) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.publicList });
    if (activeGym?.id?.trim()) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.byId(activeGym.id) });
    }
  }, [activeGym?.id, session?.user.id]);

  const handleAddImage = useCallback(
    async (uri: string) => {
      if (!activeGym) return;
      await addGymImage(activeGym.id, uri);
      await invalidateGymCaches();
    },
    [activeGym, invalidateGymCaches],
  );

  const handleRemoveImage = useCallback(
    async (path: string) => {
      if (!activeGym) return;
      await removeGymImage(activeGym.id, path);
      await invalidateGymCaches();
    },
    [activeGym, invalidateGymCaches],
  );

  const handleRemoveLogo = useCallback(async () => {
    if (!activeGym) return;
    if (activeGym.logo_url?.trim()) {
      await deleteImageByUrl(activeGym.logo_url.trim());
    }
    await updateGym(activeGym.id, { logo_url: null });
    await invalidateGymCaches();
  }, [activeGym, invalidateGymCaches]);

  function toggleWorkingDay(day: (typeof WORKING_DAYS)[number]) {
    const current = gymForm.getValues('workingDays');
    const next = current.includes(day) ? current.filter((item) => item !== day) : [...current, day];
    gymForm.setValue('workingDays', next, { shouldValidate: true });
  }

  function toggleFacility(facility: (typeof FACILITIES)[number]) {
    const current = gymForm.getValues('facilities');
    const next = current.includes(facility)
      ? current.filter((item) => item !== facility)
      : [...current, facility];
    gymForm.setValue('facilities', next, { shouldValidate: true });
  }

  const saveGymProfile = gymForm.handleSubmit(async (values) => {
    if (!activeGym) return;

    try {
      await updateGymProfile(activeGym.id, {
        name: values.gymName,
        description: values.gymDescription,
        gymType: values.gymType,
        address: {
          country: values.country,
          state: values.state,
          city: values.city,
          fullAddress: values.fullAddress,
          pincode: values.pincode,
        },
        timings: {
          openingTime: values.openingTime,
          closingTime: values.closingTime,
          workingDays: values.workingDays,
        },
        membershipPlans: {
          monthlyFeeCents: Math.round(Number(values.monthlyFee) * 100),
          quarterlyFeeCents: Math.round(Number(values.quarterlyFee) * 100),
          yearlyFeeCents: Math.round(Number(values.yearlyFee) * 100),
        },
        facilities: values.facilities,
      });

      await invalidateGymCaches();
      setIsEditingGym(false);
      Alert.alert('Saved', 'Gym profile updated successfully.');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  });

  if (ownedGyms.length === 0) return null;

  return (
    <Card title="My Gym Profile" highlighted>
      {ownedGyms.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="mb-3 flex-row gap-2">
            {ownedGyms.map((gym) => (
              <Chip
                key={gym.id}
                label={gym.name}
                active={gym.id === (activeOwnerGymId ?? activeGym?.id)}
                onPress={() => onSelectGym(gym.id)}
              />
            ))}
          </View>
        </ScrollView>
      ) : null}

      {!isEditingGym ? (
        <>
          <Text className={`mb-1 ${text.caption}`}>Name: {activeGym?.name ?? 'N/A'}</Text>
          <Text className={`mb-1 ${text.caption}`}>Type: {activeGymSettings.gymType ?? 'N/A'}</Text>
          <Text className={`mb-1 ${text.caption}`}>Description: {activeGym?.description ?? 'N/A'}</Text>
          <Text className={`mb-1 ${text.caption}`}>
            Timings: {formatTime12h(activeGymSettings.timings?.openingTime)} -{' '}
            {formatTime12h(activeGymSettings.timings?.closingTime)}
          </Text>
          <Text className={`mb-1 ${text.caption}`}>
            Working Days: {formatWorkingDays(activeGymSettings.timings?.workingDays)}
          </Text>
          <Text className={`mb-1 ${text.caption}`}>
            Facilities: {(activeGymSettings.facilities ?? []).join(', ') || 'N/A'}
          </Text>
          <Text className={`mb-1 ${text.caption}`}>
            Monthly/Quarterly/Yearly:{' '}
            {formatMoneyFromCents(activeGymSettings.membershipPlans?.monthlyFeeCents)} /{' '}
            {formatMoneyFromCents(activeGymSettings.membershipPlans?.quarterlyFeeCents)} /{' '}
            {formatMoneyFromCents(activeGymSettings.membershipPlans?.yearlyFeeCents)}
          </Text>
          <Text className={`mb-3 ${text.caption}`}>Address: {activeGym?.address ?? 'N/A'}</Text>

          {allImageUrls.length > 0 && (
            <View className="mb-3">
              <Text className={`mb-2 ${text.label}`}>Photos ({allImageUrls.length})</Text>
              <GymImageGallery imageUrls={allImageUrls} />
            </View>
          )}

          <Button title="Edit Gym Profile" onPress={() => setIsEditingGym(true)} />
        </>
      ) : (
        <>
          <Controller
            control={gymForm.control}
            name="gymName"
            render={({ field: { onChange, value } }) => (
              <Input label="Gym Name" value={value} onChangeText={onChange} />
            )}
          />
          {gymForm.formState.errors.gymName?.message ? (
            <Text className={`mb-2 ${text.error}`}>{gymForm.formState.errors.gymName.message}</Text>
          ) : null}

          <Controller
            control={gymForm.control}
            name="gymDescription"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Gym Description"
                value={value}
                onChangeText={onChange}
                autoCapitalize="sentences"
              />
            )}
          />
          {gymForm.formState.errors.gymDescription?.message ? (
            <Text className={`mb-2 ${text.error}`}>{gymForm.formState.errors.gymDescription.message}</Text>
          ) : null}

          <Controller
            control={gymForm.control}
            name="gymType"
            render={({ field: { onChange, value } }) => (
              <Input label="Gym Type" value={value} onChangeText={onChange} autoCapitalize="sentences" />
            )}
          />
          <View className="mb-3 flex-row flex-wrap gap-2">
            {GYM_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                active={gymForm.watch('gymType') === type}
                onPress={() => gymForm.setValue('gymType', type, { shouldValidate: true })}
              />
            ))}
          </View>

          <Controller
            control={gymForm.control}
            name="country"
            render={({ field: { onChange, value } }) => (
              <Input label="Country" value={value} onChangeText={onChange} autoCapitalize="sentences" />
            )}
          />
          <Controller
            control={gymForm.control}
            name="state"
            render={({ field: { onChange, value } }) => (
              <Input label="State" value={value} onChangeText={onChange} autoCapitalize="sentences" />
            )}
          />
          <Controller
            control={gymForm.control}
            name="city"
            render={({ field: { onChange, value } }) => (
              <Input label="City" value={value} onChangeText={onChange} autoCapitalize="sentences" />
            )}
          />
          <Controller
            control={gymForm.control}
            name="fullAddress"
            render={({ field: { onChange, value } }) => (
              <Input label="Full Address" value={value} onChangeText={onChange} autoCapitalize="sentences" />
            )}
          />
          <Controller
            control={gymForm.control}
            name="pincode"
            render={({ field: { onChange, value } }) => (
              <Input label="Pincode" value={value} onChangeText={onChange} keyboardType="number-pad" />
            )}
          />

          <Controller
            control={gymForm.control}
            name="openingTime"
            render={({ field: { onChange, value } }) => (
              <TimePickerField label="Opening Time" value={value} onChange={onChange} />
            )}
          />
          <Controller
            control={gymForm.control}
            name="closingTime"
            render={({ field: { onChange, value } }) => (
              <TimePickerField label="Closing Time" value={value} onChange={onChange} />
            )}
          />

          <View className="mb-2 flex-row items-center justify-between">
            <Text className={text.label}>Working Days</Text>
            <Pressable
              onPress={() => {
                const current = gymForm.getValues('workingDays');
                const allSelected = current.length === WORKING_DAYS.length;
                gymForm.setValue('workingDays', allSelected ? [] : [...WORKING_DAYS], {
                  shouldValidate: true,
                });
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                {gymForm.watch('workingDays').length === WORKING_DAYS.length ? 'Deselect All' : 'Select All'}
              </Text>
            </Pressable>
          </View>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {WORKING_DAYS.map((day) => (
              <Chip
                key={day}
                label={day}
                active={gymForm.watch('workingDays').includes(day)}
                onPress={() => toggleWorkingDay(day)}
              />
            ))}
          </View>

          <Controller
            control={gymForm.control}
            name="monthlyFee"
            render={({ field: { onChange, value } }) => (
              <Input label="Monthly Fee" value={value} onChangeText={onChange} keyboardType="number-pad" />
            )}
          />
          <Controller
            control={gymForm.control}
            name="quarterlyFee"
            render={({ field: { onChange, value } }) => (
              <Input label="Quarterly Fee" value={value} onChangeText={onChange} keyboardType="number-pad" />
            )}
          />
          <Controller
            control={gymForm.control}
            name="yearlyFee"
            render={({ field: { onChange, value } }) => (
              <Input label="Yearly Fee" value={value} onChangeText={onChange} keyboardType="number-pad" />
            )}
          />

          <Text className={`mb-2 ${text.label}`}>Facilities</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {FACILITIES.map((facility) => (
              <Chip
                key={facility}
                label={facility}
                active={gymForm.watch('facilities').includes(facility)}
                onPress={() => toggleFacility(facility)}
              />
            ))}
          </View>

          <View className="mb-4">
            <GymImagePicker
              images={gymImages}
              logoUrl={activeGym?.logo_url}
              onAdd={handleAddImage}
              onRemove={handleRemoveImage}
              onRemoveLogo={handleRemoveLogo}
            />
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button title="Cancel" variant="ghost" onPress={() => setIsEditingGym(false)} />
            </View>
            <View className="flex-1">
              <Button
                title="Save Changes"
                onPress={saveGymProfile}
                loading={gymForm.formState.isSubmitting}
              />
            </View>
          </View>
        </>
      )}
    </Card>
  );
}
