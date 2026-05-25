import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useUserGyms } from "@/hooks/useUserGyms";
import { z } from "zod";

import { queryClient } from "@/api/queries/client";
import { queryKeys } from "@/api/queries/keys";
import { updateGymProfile } from "@/api/gyms.api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { FACILITIES, GYM_TYPES, WORKING_DAYS } from "@/features/create-gym";
import { useTheme } from "@/hooks/useTheme";
import { getErrorMessage } from "@/lib/errors";
import { signOut } from "@/services/auth/auth.service";
import { useAppStore } from "@/store/app.store";
import { useAuthStore } from "@/store/auth.store";
import { useProfileMenuStore } from "@/store/profile-menu.store";
import { layout, text } from "@/theme/classes";
import { cardSurface, modalOverlay } from "@/theme/styles";
import type { GymSettings } from "@/types/models";

const gymEditSchema = z.object({
  gymName: z.string().trim().min(2, "Gym name is required"),
  gymDescription: z.string().trim().min(5, "Description is required"),
  gymType: z.string().trim().min(2, "Gym type is required"),
  country: z.string().trim().min(2, "Country is required"),
  state: z.string().trim().min(2, "State is required"),
  city: z.string().trim().min(2, "City is required"),
  fullAddress: z.string().trim().min(5, "Address is required"),
  pincode: z.string().trim().regex(/^\d{4,10}$/, "Enter valid pincode"),
  openingTime: z.string().trim().min(1, "Opening time is required"),
  closingTime: z.string().trim().min(1, "Closing time is required"),
  monthlyFee: z.string().trim().min(1, "Monthly fee required"),
  quarterlyFee: z.string().trim().min(1, "Quarterly fee required"),
  yearlyFee: z.string().trim().min(1, "Yearly fee required"),
  workingDays: z.array(z.string()).min(1, "Select at least one working day"),
  facilities: z.array(z.string()).min(1, "Select at least one facility"),
});

type GymEditForm = z.infer<typeof gymEditSchema>;

export function ProfileHubScreen() {
  const { colors, preference, setPreference } = useTheme();
  const session = useAuthStore((state) => state.session);
  const setAppMode = useAppStore((state) => state.setAppMode);
  const resetGymContext = useAppStore((state) => state.resetGymContext);
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const setActiveOwnerGymId = useAppStore((state) => state.setActiveOwnerGymId);
  const myProfileQuery = useMyProfile();
  const { memberGyms, ownedGyms } = useUserGyms();
  const [isEditingGym, setIsEditingGym] = useState(false);
  const showMenu = useProfileMenuStore((state) => state.isOpen);
  const closeMenu = useProfileMenuStore((state) => state.close);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isAuthenticated = Boolean(session);

  async function handleSignOut() {
    await signOut();
    resetGymContext();
    router.replace("/");
  }

  if (!isAuthenticated) {
    return (
      <Screen scroll>
        <Text className={`${layout.screenTop} ${text.screenTitle}`}>Profile</Text>
        <Text className={`${layout.stack} ${text.screenSubtitle}`}>
          Sign in to unlock memberships, bookings, and owner tools.
        </Text>

        <Card title="Account" className={layout.section}>
          <Button title="Login" onPress={() => router.push("/auth/login")} />
          <View className={layout.buttonSpacing} />
          <Button
            title="Signup"
            variant="ghost"
            onPress={() => router.push("/auth/signup")}
          />
        </Card>
      </Screen>
    );
  }

  const profile = myProfileQuery.data;
  const profileComplete = Boolean(
    profile?.onboarding_completed && profile?.full_name?.trim(),
  );
  const activeGym = ownedGyms.find((gym) => gym.id === activeOwnerGymId) ?? ownedGyms[0] ?? null;
  const activeGymSettings = useMemo(() => parseGymSettings(activeGym?.settings), [activeGym?.settings]);
  const parsedAddress = useMemo(() => parseAddressString(activeGym?.address ?? ""), [activeGym?.address]);

  const gymDefaults = useMemo<GymEditForm>(() => ({
    gymName: activeGym?.name ?? "",
    gymDescription: activeGym?.description ?? "",
    gymType: activeGymSettings.gymType ?? "",
    country: parsedAddress.country ?? "",
    state: parsedAddress.state ?? "",
    city: parsedAddress.city ?? "",
    fullAddress: parsedAddress.fullAddress ?? "",
    pincode: parsedAddress.pincode ?? "",
    openingTime: activeGymSettings.timings?.openingTime ?? "",
    closingTime: activeGymSettings.timings?.closingTime ?? "",
    monthlyFee: centsToInputAmount(activeGymSettings.membershipPlans?.monthlyFeeCents),
    quarterlyFee: centsToInputAmount(activeGymSettings.membershipPlans?.quarterlyFeeCents),
    yearlyFee: centsToInputAmount(activeGymSettings.membershipPlans?.yearlyFeeCents),
    workingDays: activeGymSettings.timings?.workingDays ?? [],
    facilities: activeGymSettings.facilities ?? [],
  }), [activeGym?.id, activeGym?.name, activeGym?.description, activeGymSettings, parsedAddress]);

  const gymForm = useForm<GymEditForm>({
    resolver: zodResolver(gymEditSchema),
    defaultValues: gymDefaults,
  });

  useEffect(() => {
    gymForm.reset(gymDefaults);
  }, [gymDefaults, gymForm]);

  function toggleMulti(field: "workingDays" | "facilities", value: string) {
    const current = gymForm.getValues(field);
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    gymForm.setValue(field, next, { shouldValidate: true });
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

      await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.owned(session?.user.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.publicList });
      if (activeGymIdString(activeGym.id)) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.byId(activeGym.id) });
      }

      setIsEditingGym(false);
      Alert.alert("Saved", "Gym profile updated successfully.");
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    }
  });

  return (
    <Screen scroll>
      <View className={layout.screenTop}>
        <Text className={text.screenTitle}>Profile</Text>
        <Text className={`${layout.stack} ${text.screenSubtitle}`}>
          Manage account, memberships, and owner actions.
        </Text>
      </View>

      <Card title="My account" className={layout.section}>
        <Text className={`mb-1 ${text.caption}`}>
          Profile: {profileComplete ? "Complete" : "Incomplete"}
        </Text>
        <Text className={`mb-1 ${text.caption}`}>
          Phone: {profile?.phone ?? session?.user.phone ?? "Not available"}
        </Text>
        <Text className={`mb-1 ${text.caption}`}>
          Name: {profile?.full_name ?? "Not set"}
        </Text>
        <Text className={`mb-1 ${text.caption}`}>
          Gender: {profile?.gender ?? "Not set"}
        </Text>
        <Text className={`mb-1 ${text.caption}`}>
          City: {profile?.city ?? "Not set"}
        </Text>
        <Text className={`mb-3 ${text.caption}`}>
          Avatar:{" "}
          {profile?.full_name?.trim()
            ? profile.full_name.trim().charAt(0).toUpperCase()
            : "N/A"}
        </Text>
        {!profileComplete ? (
          <Text className={`mb-3 ${text.warning}`}>
            Complete profile setup to access protected features.
          </Text>
        ) : null}
        {!profileComplete ? (
          <Button
            title="Complete profile setup"
            onPress={() =>
              router.push("/profile-setup?redirect=/(tabs)/profile-hub")
            }
          />
        ) : null}
        <View className={layout.buttonSpacing} />
        <Button
          title="My profile"
          variant="ghost"
          onPress={() => router.push("/profile")}
        />
      </Card>

      <Card title="Membership overview">
        <Text className={text.caption}>Joined gyms: {memberGyms.length}</Text>
        <Text className={`${layout.stackSm} ${text.caption}`}>
          Owned gyms: {ownedGyms.length}
        </Text>
        <View className={layout.stackMd}>
          <Button
            title="Memberships"
            onPress={() => {
              setAppMode("member");
              router.push("/memberships");
            }}
          />
        </View>
      </Card>

     

      {ownedGyms.length === 0 ? (
        <Card title="Become Gym Owner" highlighted>
          <Text className={`mb-3 ${text.caption}`}>
            If you own a gym or want to manage your fitness business, create your
            gym and access owner tools.
          </Text>
          <Button
            title="Create Gym"
            onPress={() => {
              setAppMode("owner");
              router.push("/create-gym");
            }}
          />
          <View className={layout.buttonSpacing} />
       
        </Card>
      ) : (
        <Card title="My Gym Profile" highlighted>
          {ownedGyms.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="mb-3 flex-row gap-2">
                {ownedGyms.map((gym) => (
                  <Chip
                    key={gym.id}
                    label={gym.name}
                    active={gym.id === activeGym?.id}
                    onPress={() => setActiveOwnerGymId(gym.id)}
                  />
                ))}
              </View>
            </ScrollView>
          ) : null}

          {!isEditingGym ? (
            <>
              <Text className={`mb-1 ${text.caption}`}>Name: {activeGym?.name ?? "N/A"}</Text>
              <Text className={`mb-1 ${text.caption}`}>Type: {activeGymSettings.gymType ?? "N/A"}</Text>
              <Text className={`mb-1 ${text.caption}`}>Description: {activeGym?.description ?? "N/A"}</Text>
              <Text className={`mb-1 ${text.caption}`}>
                Timings: {activeGymSettings.timings?.openingTime ?? "--"} - {activeGymSettings.timings?.closingTime ?? "--"}
              </Text>
              <Text className={`mb-1 ${text.caption}`}>
                Working Days: {(activeGymSettings.timings?.workingDays ?? []).join(", ") || "N/A"}
              </Text>
              <Text className={`mb-1 ${text.caption}`}>
                Facilities: {(activeGymSettings.facilities ?? []).join(", ") || "N/A"}
              </Text>
              <Text className={`mb-1 ${text.caption}`}>
                Monthly/Quarterly/Yearly: {formatMoneyFromCents(activeGymSettings.membershipPlans?.monthlyFeeCents)} / {formatMoneyFromCents(activeGymSettings.membershipPlans?.quarterlyFeeCents)} / {formatMoneyFromCents(activeGymSettings.membershipPlans?.yearlyFeeCents)}
              </Text>
              <Text className={`mb-3 ${text.caption}`}>Address: {activeGym?.address ?? "N/A"}</Text>

              <Button title="Edit Gym Profile" onPress={() => setIsEditingGym(true)} />
              <View className={layout.buttonSpacing} />
            
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
              {gymForm.formState.errors.gymName?.message ? <Text className={`mb-2 ${text.error}`}>{gymForm.formState.errors.gymName.message}</Text> : null}

              <Controller
                control={gymForm.control}
                name="gymDescription"
                render={({ field: { onChange, value } }) => (
                  <Input label="Gym Description" value={value} onChangeText={onChange} autoCapitalize="sentences" />
                )}
              />
              {gymForm.formState.errors.gymDescription?.message ? <Text className={`mb-2 ${text.error}`}>{gymForm.formState.errors.gymDescription.message}</Text> : null}

              <Controller
                control={gymForm.control}
                name="gymType"
                render={({ field: { onChange, value } }) => (
                  <Input label="Gym Type" value={value} onChangeText={onChange} autoCapitalize="sentences" />
                )}
              />
              <View className="mb-3 flex-row flex-wrap gap-2">
                {GYM_TYPES.map((type) => (
                  <Chip key={type} label={type} active={gymForm.watch("gymType") === type} onPress={() => gymForm.setValue("gymType", type, { shouldValidate: true })} />
                ))}
              </View>

              <Controller control={gymForm.control} name="country" render={({ field: { onChange, value } }) => <Input label="Country" value={value} onChangeText={onChange} autoCapitalize="sentences" />} />
              <Controller control={gymForm.control} name="state" render={({ field: { onChange, value } }) => <Input label="State" value={value} onChangeText={onChange} autoCapitalize="sentences" />} />
              <Controller control={gymForm.control} name="city" render={({ field: { onChange, value } }) => <Input label="City" value={value} onChangeText={onChange} autoCapitalize="sentences" />} />
              <Controller control={gymForm.control} name="fullAddress" render={({ field: { onChange, value } }) => <Input label="Full Address" value={value} onChangeText={onChange} autoCapitalize="sentences" />} />
              <Controller control={gymForm.control} name="pincode" render={({ field: { onChange, value } }) => <Input label="Pincode" value={value} onChangeText={onChange} keyboardType="number-pad" />} />

              <Controller control={gymForm.control} name="openingTime" render={({ field: { onChange, value } }) => <Input label="Opening Time" value={value} onChangeText={onChange} />} />
              <Controller control={gymForm.control} name="closingTime" render={({ field: { onChange, value } }) => <Input label="Closing Time" value={value} onChangeText={onChange} />} />

              <Text className={`mb-2 ${text.label}`}>Working Days</Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {WORKING_DAYS.map((day) => (
                  <Chip key={day} label={day.slice(0, 3)} active={gymForm.watch("workingDays").includes(day)} onPress={() => toggleMulti("workingDays", day)} />
                ))}
              </View>

              <Controller control={gymForm.control} name="monthlyFee" render={({ field: { onChange, value } }) => <Input label="Monthly Fee" value={value} onChangeText={onChange} keyboardType="number-pad" />} />
              <Controller control={gymForm.control} name="quarterlyFee" render={({ field: { onChange, value } }) => <Input label="Quarterly Fee" value={value} onChangeText={onChange} keyboardType="number-pad" />} />
              <Controller control={gymForm.control} name="yearlyFee" render={({ field: { onChange, value } }) => <Input label="Yearly Fee" value={value} onChangeText={onChange} keyboardType="number-pad" />} />

              <Text className={`mb-2 ${text.label}`}>Facilities</Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {FACILITIES.map((facility) => (
                  <Chip key={facility} label={facility} active={gymForm.watch("facilities").includes(facility)} onPress={() => toggleMulti("facilities", facility)} />
                ))}
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button title="Cancel" variant="ghost" onPress={() => setIsEditingGym(false)} />
                </View>
                <View className="flex-1">
                  <Button title="Save Changes" onPress={saveGymProfile} loading={gymForm.formState.isSubmitting} />
                </View>
              </View>
            </>
          )}
        </Card>
      )}

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable className="flex-1" style={modalOverlay(colors)} onPress={closeMenu}>
          <Pressable
            className="mx-4 mt-24 rounded-2xl p-4"
            style={cardSurface(colors, true)}
            onPress={(event) => event.stopPropagation()}
          >
            <Text className={text.cardTitle}>Profile Menu</Text>

            <Text className={`mt-3 ${text.label}`}>Theme</Text>
            <View className="mt-2 flex-row gap-2">
              <Chip label="System" active={preference === "system"} onPress={() => setPreference("system")} />
              <Chip label="Light" active={preference === "light"} onPress={() => setPreference("light")} />
              <Chip label="Dark" active={preference === "dark"} onPress={() => setPreference("dark")} />
            </View>

            <View className="mt-4">
              <Button
                title="Open settings"
                variant="ghost"
                onPress={() => {
                  closeMenu();
                  router.push("/settings");
                }}
              />
            </View>

            <View className="mt-2">
              <Button
                title="Logout"
                variant="danger"
                onPress={() => {
                  closeMenu();
                  setShowLogoutConfirm(true);
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <Pressable className="flex-1" style={modalOverlay(colors)} onPress={() => setShowLogoutConfirm(false)}>
          <Pressable
            className="mx-4 mt-40 rounded-2xl p-4"
            style={cardSurface(colors, true)}
            onPress={(event) => event.stopPropagation()}
          >
            <Text className={text.cardTitle}>Confirm logout</Text>
            <Text className={`${layout.stack} ${text.caption}`}>
              Are you sure you want to logout?
            </Text>

            <View className="mt-4 flex-row gap-2">
              <View className="flex-1">
                <Button title="Cancel" variant="ghost" onPress={() => setShowLogoutConfirm(false)} />
              </View>
              <View className="flex-1">
                <Button
                  title="Yes, Logout"
                  variant="danger"
                  onPress={async () => {
                    setShowLogoutConfirm(false);
                    await handleSignOut();
                  }}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function parseGymSettings(raw: unknown): GymSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as GymSettings;
}

function formatMoneyFromCents(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `$${(value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function centsToInputAmount(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return String(value / 100);
}

function parseAddressString(raw: string): {
  fullAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
} {
  if (!raw.trim()) return {};

  const [fullAddress = "", city = "", state = "", countryAndPin = ""] = raw.split(",").map((part) => part.trim());
  const [country = "", pincode = ""] = countryAndPin.split("-").map((part) => part.trim());

  return {
    fullAddress,
    city,
    state,
    country,
    pincode,
  };
}

function activeGymIdString(id: string | null | undefined): id is string {
  return Boolean(id && id.trim());
}
