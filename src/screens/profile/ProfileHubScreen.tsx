/**
 * @file ProfileHubScreen.tsx
 * Profile tab: Silent Coach–style layout with GYM OS theme colors (tabs unchanged).
 */
import { router } from "expo-router";
import { View } from "react-native";
import { MapPin, Phone, User as UserIcon } from "lucide-react-native";

import { AppOptionsMenu } from "@/components/layout/AppOptionsMenu";
import { BecomeGymOwnerCard } from "@/components/profile/BecomeGymOwnerCard";
import { ProfileAccountCard } from "@/components/profile/ProfileAccountCard";
import { ProfileGuestCard } from "@/components/profile/ProfileGuestCard";
import { ProfileHeroSection } from "@/components/profile/ProfileHeroSection";
import { ProfileHubHeader } from "@/components/profile/ProfileHubHeader";
import { Screen } from "@/components/ui/Screen";
import { OwnerGymProfileCard } from "@/features/profile";
import {
  isProfileComplete,
  resolveDisplayName,
  resolveProfileAddress,
} from "@/domain/profiles";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useUserGyms } from "@/hooks/useUserGyms";
import { useAppStore } from "@/store/app.store";
import { useAuthStore } from "@/store/auth.store";
import { useProfileMenuStore } from "@/store/profile-menu.store";

export function ProfileHubScreen() {
  const session = useAuthStore((state) => state.session);
  const setAppMode = useAppStore((state) => state.setAppMode);
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const setActiveOwnerGymId = useAppStore((state) => state.setActiveOwnerGymId);
  const myProfileQuery = useMyProfile();
  const { ownedGyms } = useUserGyms();
  const openMenu = useProfileMenuStore((state) => state.open);

  const isAuthenticated = Boolean(session);
  const profile = myProfileQuery.data;
  const resolvedPhone = profile?.phone ?? session?.user.phone ?? null;
  const resolvedName = resolveDisplayName(
    profile?.full_name,
    resolvedPhone,
    session?.user.id ?? null,
  );
  const profileComplete = isProfileComplete(profile);
  const profileAddress = resolveProfileAddress(profile);
  const activeGym =
    ownedGyms.find((gym) => gym.id === activeOwnerGymId) ??
    ownedGyms[0] ??
    null;
  const avatarInitial =
    profile?.full_name?.trim()?.charAt(0) ??
    resolvedName.charAt(0) ??
    session?.user.id?.charAt(0) ??
    "U";

  const accountRows = [
    {
      icon: Phone,
      label: "Phone",
      value: resolvedPhone ?? "Not available",
    },
    {
      icon: UserIcon,
      label: "Gender",
      value: profile?.gender ?? "Not set",
    },
    {
      icon: MapPin,
      label: "Address",
      value: profileAddress ?? "Not set",
    },
  ];

  return (
    <Screen scroll>
      <ProfileHubHeader onOpenMenu={openMenu} />

      {!isAuthenticated ? (
        <>
          <ProfileHeroSection
            displayName="Guest"
            avatarInitial="G"
            profileComplete={false}
          />
          <ProfileGuestCard />
        </>
      ) : (
        <>
          <ProfileHeroSection
            displayName={resolvedName}
            avatarInitial={avatarInitial}
            profileComplete={profileComplete}
          />

          <ProfileAccountCard
            rows={accountRows}
            profileComplete={profileComplete}
            onOpenMenu={openMenu}
            onCompleteProfile={
              !profileComplete
                ? () =>
                    router.push("/profile-setup?redirect=/(tabs)/profile-hub")
                : undefined
            }
          />

          <OwnerGymProfileCard
            ownedGyms={ownedGyms}
            activeGym={activeGym}
            activeOwnerGymId={activeOwnerGymId}
            onSelectGym={setActiveOwnerGymId}
          />

          {ownedGyms.length === 0 && profileComplete ? (
            <BecomeGymOwnerCard
              onCreateGym={() => {
                setAppMode("owner");
                router.push("/create-gym");
              }}
            />
          ) : null}
        </>
      )}

      <View style={{ height: 8 }} />
      <AppOptionsMenu />
    </Screen>
  );
}
