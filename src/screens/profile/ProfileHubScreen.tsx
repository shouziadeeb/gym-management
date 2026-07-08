/**
 * @file ProfileHubScreen.tsx
 * Profile tab: Silent Coach–style layout with GYM OS theme colors (tabs unchanged).
 */
import { router } from "expo-router";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { MapPin, Mail, Phone, User as UserIcon } from "lucide-react-native";

import { AppOptionsMenu } from "@/components/layout/AppOptionsMenu";
import { BecomeGymOwnerCard } from "@/components/profile/BecomeGymOwnerCard";
import { ProfileAccountCard } from "@/components/profile/ProfileAccountCard";
import { ProfileGuestCard } from "@/components/profile/ProfileGuestCard";
import { ProfileHeroSection } from "@/components/profile/ProfileHeroSection";
import { ProfileHubHeader } from "@/components/profile/ProfileHubHeader";
import { Screen } from "@/components/ui/Screen";
import { OwnerGymProfileCard } from "@/features/profile";
import {
  isEmailAuthUser,
  isProfileComplete,
  resolveDisplayName,
  resolveProfileAddress,
  resolveProfileEmail,
} from "@/domain/profiles";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useUserGyms } from "@/hooks/useUserGyms";
import { useAppStore } from "@/store/app.store";
import { useAuthStore } from "@/store/auth.store";

export function ProfileHubScreen() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 1120;
  const session = useAuthStore((state) => state.session);
  const setAppMode = useAppStore((state) => state.setAppMode);
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const setActiveOwnerGymId = useAppStore((state) => state.setActiveOwnerGymId);
  const myProfileQuery = useMyProfile();
  const { ownedGyms } = useUserGyms();

  const isAuthenticated = Boolean(session);
  const profile = myProfileQuery.data;
  const isEmailUser = isEmailAuthUser(profile, session?.user ?? null);
  const resolvedEmail = resolveProfileEmail(profile, session?.user ?? null);
  const resolvedPhone = profile?.phone ?? session?.user.phone ?? null;
  const resolvedName = resolveDisplayName(
    profile?.full_name,
    isEmailUser ? resolvedEmail : resolvedPhone,
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

  const accountRows = isEmailUser
    ? [
        {
          icon: Mail,
          label: "Email",
          value: resolvedEmail ?? "Not available",
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
      ]
    : [
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
      <View style={isDesktopWeb ? styles.desktopShell : null}>
        <ProfileHubHeader />

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

            {isDesktopWeb ? (
              <View style={styles.desktopCardsRow}>
                <View style={styles.desktopPrimaryCol}>
                  <ProfileAccountCard
                    rows={accountRows}
                    profileComplete={profileComplete}
                    onCompleteProfile={
                      !profileComplete
                        ? () =>
                            router.push(
                              isEmailUser
                                ? "/profile"
                                : "/profile-setup?redirect=/(tabs)/profile-hub",
                            )
                        : undefined
                    }
                  />

                  <OwnerGymProfileCard
                    ownedGyms={ownedGyms}
                    activeGym={activeGym}
                    activeOwnerGymId={activeOwnerGymId}
                    onSelectGym={setActiveOwnerGymId}
                  />
                </View>

                {ownedGyms.length === 0 && profileComplete ? (
                  <View style={styles.desktopSideCol}>
                    <BecomeGymOwnerCard
                      onCreateGym={() => {
                        setAppMode("owner");
                        router.push("/create-gym");
                      }}
                    />
                  </View>
                ) : null}
              </View>
            ) : (
              <>
                <ProfileAccountCard
                  rows={accountRows}
                  profileComplete={profileComplete}
                  onCompleteProfile={
                    !profileComplete
                      ? () =>
                          router.push(
                            isEmailUser
                              ? "/profile"
                              : "/profile-setup?redirect=/(tabs)/profile-hub",
                          )
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
          </>
        )}

        <View style={{ height: 8 }} />
        <AppOptionsMenu />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  desktopShell: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
  },
  desktopCardsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  desktopPrimaryCol: {
    flex: 1,
    minWidth: 0,
  },
  desktopSideCol: {
    width: 320,
    minWidth: 300,
  },
});
