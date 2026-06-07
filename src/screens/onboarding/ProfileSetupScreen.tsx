import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";

import { updateMyProfile } from "@/api/profiles.api";
import { queryClient } from "@/api/queries/client";
import { queryKeys } from "@/api/queries/keys";
import { Button } from "@/components/ui/Button";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { Input } from "@/components/ui/Input";
import { LocationPickerField } from "@/components/ui/LocationPickerField";
import { OnboardingFormPanel } from "@/components/onboarding/OnboardingFormPanel";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { SelectField } from "@/components/ui/SelectField";
import {
  buildDefaultDisplayName,
  isEmailAuthUser,
  resolveProfileEmail,
} from "@/domain/profiles";
import {
  PROFILE_GENDER_OPTIONS,
  ageFromDateOfBirth,
} from "@/features/profile/labels";
import {
  createProfileFormSchema,
  type ProfileFormValues,
} from "@/features/profile/schema";
import { getErrorMessage } from "@/lib/errors";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useAuthStore } from "@/store/auth.store";
import { layout, text } from "@/theme/classes";

export function ProfileSetupScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const session = useAuthStore((state) => state.session);
  const profileQuery = useMyProfile();
  const sessionPhone = session?.user.phone ?? null;
  const isEmailUser = isEmailAuthUser(profileQuery.data, session?.user ?? null);
  const resolvedEmail = resolveProfileEmail(
    profileQuery.data,
    session?.user ?? null,
  );

  const defaults = useMemo<ProfileFormValues>(() => {
    const profile = profileQuery.data;
    const resolvedPhone = profile?.phone ?? sessionPhone ?? "";
    const resolvedName =
      profile?.full_name?.trim() ||
      buildDefaultDisplayName(
        isEmailUser ? resolvedEmail : resolvedPhone,
        session?.user.id,
      );

    const rawGender = profile?.gender;
    const gender: ProfileFormValues["gender"] =
      rawGender === "male" ||
      rawGender === "female" ||
      rawGender === "prefer_not_to_say"
        ? rawGender
        : "prefer_not_to_say";

    return {
      fullName: resolvedName,
      phone: resolvedPhone,
      gender,
      dateOfBirth: profile?.date_of_birth ?? "",
      city: profile?.city ?? "",
      fitnessGoal: profile?.fitness_goal ?? "",
      homeLatitude:
        typeof profile?.home_latitude === "number"
          ? profile.home_latitude
          : null,
      homeLongitude:
        typeof profile?.home_longitude === "number"
          ? profile.home_longitude
          : null,
      homeLocationLabel: profile?.home_location_label ?? "",
    };
  }, [
    profileQuery.data,
    sessionPhone,
    session?.user.id,
    isEmailUser,
    resolvedEmail,
  ]);

  const profileSchema = useMemo(
    () => createProfileFormSchema({ phoneRequired: !isEmailUser }),
    [isEmailUser],
  );

  const birthDateBounds = useMemo(() => {
    const maximumDate = new Date();
    maximumDate.setFullYear(maximumDate.getFullYear() - 13);
    const minimumDate = new Date();
    minimumDate.setFullYear(minimumDate.getFullYear() - 100);
    return { maximumDate, minimumDate };
  }, []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: defaults,
  });

  const submit = form.handleSubmit(async (values) => {
    const userId = session?.user.id;
    if (!userId) return;

    try {
      const computedAge = values.dateOfBirth
        ? ageFromDateOfBirth(values.dateOfBirth)
        : null;
      const trimmedPhone = values.phone.trim();

      await updateMyProfile(userId, {
        full_name: values.fullName.trim(),
        phone: trimmedPhone || null,
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

      await queryClient.invalidateQueries({
        queryKey: queryKeys.profile.me(userId),
      });

      if (typeof redirect === "string" && redirect.length > 0) {
        router.replace(redirect as never);
      } else {
        router.replace("/(tabs)/profile-hub");
      }
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
    }
  });

  useEffect(() => {
    if (!session) {
      router.replace("/auth/login");
    }
  }, [session]);

  if (!session) {
    return null;
  }

  return (
    <OnboardingScreen scroll>
      <OnboardingFormPanel>
        <Text className={text.screenTitle}>Set up your profile</Text>
        <Text className={`${layout.stack} ${text.screenSubtitle}`}>
          Complete your profile once to personalize memberships, onboarding, and
          gym actions.
        </Text>

        <View className={layout.sectionXl}>
          {isEmailUser ? (
            <Input
              label="Email"
              value={resolvedEmail ?? ""}
              editable={false}
              autoCapitalize="none"
            />
          ) : (
            <Controller
              control={form.control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Phone"
                  placeholder="+919876543210"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                />
              )}
            />
          )}
          {isEmailUser ? (
            <Controller
              control={form.control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Phone (optional)"
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
              <Input
                label="Full name"
                placeholder="user9876543210"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
              />
            )}
          />
          <Controller
            control={form.control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <SelectField
                label="Gender"
                value={value}
                options={PROFILE_GENDER_OPTIONS}
                onChange={onChange}
              />
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
              <Input
                label="Address (optional)"
                placeholder="Street, area, city"
                value={value}
                onChangeText={onChange}
                autoCapitalize="sentences"
              />
            )}
          />
          <LocationPickerField
            label="Home location (optional)"
            description="Preferred — this address is shown on your profile when set."
            latitude={form.watch("homeLatitude")}
            longitude={form.watch("homeLongitude")}
            locationLabel={form.watch("homeLocationLabel")}
            disabled={form.formState.isSubmitting}
            onCoordinatesChange={(next) => {
              form.setValue("homeLatitude", next.latitude, {
                shouldValidate: true,
              });
              form.setValue("homeLongitude", next.longitude, {
                shouldValidate: true,
              });
              form.setValue("homeLocationLabel", next.label?.trim() ?? "", {
                shouldValidate: true,
              });
            }}
            onClear={() => {
              form.setValue("homeLatitude", null, { shouldValidate: true });
              form.setValue("homeLongitude", null, { shouldValidate: true });
              form.setValue("homeLocationLabel", "", { shouldValidate: true });
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

          {form.formState.errors.phone?.message ? (
            <Text className={`mb-2 ${text.error}`}>
              {form.formState.errors.phone.message}
            </Text>
          ) : null}
          {form.formState.errors.fullName?.message ? (
            <Text className={`mb-2 ${text.error}`}>
              {form.formState.errors.fullName.message}
            </Text>
          ) : null}
          {form.formState.errors.gender?.message ? (
            <Text className={`mb-2 ${text.error}`}>
              {form.formState.errors.gender.message}
            </Text>
          ) : null}
          {form.formState.errors.dateOfBirth?.message ? (
            <Text className={`mb-2 ${text.error}`}>
              {form.formState.errors.dateOfBirth.message}
            </Text>
          ) : null}
          {form.formState.errors.root?.message ? (
            <Text className={`mb-2 ${text.error}`}>
              {form.formState.errors.root.message}
            </Text>
          ) : null}

          <Button
            title="Complete setup"
            onPress={submit}
            loading={form.formState.isSubmitting}
          />
        </View>
      </OnboardingFormPanel>
    </OnboardingScreen>
  );
}
