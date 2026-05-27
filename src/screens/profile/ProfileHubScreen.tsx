import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { AppOptionsMenu } from '@/components/layout/AppOptionsMenu';
import { OwnerGymProfileCard } from '@/features/profile';
import { isProfileComplete, resolveDisplayName, resolveProfileAddress } from '@/domain/profiles';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useTheme } from '@/hooks/useTheme';
import { useUserGyms } from '@/hooks/useUserGyms';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { useProfileMenuStore } from '@/store/profile-menu.store';
import { layout, text } from '@/theme/classes';

export function ProfileHubScreen() {
  const { colors } = useTheme();
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
  const resolvedName = resolveDisplayName(profile?.full_name, resolvedPhone, session?.user.id ?? null);
  const profileComplete = isProfileComplete(profile);
  const profileAddress = resolveProfileAddress(profile);
  const activeGym = ownedGyms.find((gym) => gym.id === activeOwnerGymId) ?? ownedGyms[0] ?? null;

  const profileHeader = (
    <View className={`${layout.screenTop} ${layout.rowBetween}`}>
      <View className={layout.flex1}>
        <Text className={text.screenTitle}>Profile</Text>
        <Text className={`${layout.stack} ${text.screenSubtitle}`}>
          {isAuthenticated
            ? 'Manage your account and gym settings.'
            : 'Sign in to unlock memberships, bookings, and owner tools.'}
        </Text>
      </View>
      <Pressable
        onPress={openMenu}
        hitSlop={12}
        style={{
          flexShrink: 0,
          minWidth: 44,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 4,
        }}
        accessibilityRole="button"
        accessibilityLabel="Open app menu"
      >
        <Text style={{ color: colors.foreground, fontSize: 26, lineHeight: 28, fontWeight: '600' }}>⋮</Text>
      </Pressable>
    </View>
  );

  return (
    <Screen scroll>
      {!isAuthenticated ? (
        <>
          {profileHeader}
          <Card title="Account" className={layout.section}>
            <Button title="Login" onPress={() => router.push('/auth/login')} />
            <View className={layout.buttonSpacing} />
            <Button title="Signup" variant="ghost" onPress={() => router.push('/auth/signup')} />
          </Card>
        </>
      ) : (
        <>
          {profileHeader}

          <Card title="My account" className={layout.section}>
            <Text className={`mb-1 ${text.caption}`}>
              Profile: {profileComplete ? 'Complete' : 'Incomplete'}
            </Text>
            <Text className={`mb-1 ${text.caption}`}>Phone: {resolvedPhone ?? 'Not available'}</Text>
            <Text className={`mb-1 ${text.caption}`}>Name: {resolvedName}</Text>
            <Text className={`mb-1 ${text.caption}`}>Gender: {profile?.gender ?? 'Not set'}</Text>
            <Text className={`mb-1 ${text.caption}`}>Address: {profileAddress ?? 'Not set'}</Text>
            <Text className={`mb-3 ${text.caption}`}>
              Avatar:{' '}
              {profile?.full_name?.trim() ? profile.full_name.trim().charAt(0).toUpperCase() : 'N/A'}
            </Text>
            {!profileComplete ? (
              <Text className={`mb-3 ${text.warning}`}>
                Complete profile setup to access protected features.
              </Text>
            ) : null}
            {!profileComplete ? (
              <Button
                title="Complete profile setup"
                onPress={() => router.push('/profile-setup?redirect=/(tabs)/profile-hub')}
              />
            ) : null}
            <View className={layout.buttonSpacing} />
            <Button title="My profile" variant="ghost" onPress={() => router.push('/profile')} />
          </Card>

          <OwnerGymProfileCard
            ownedGyms={ownedGyms}
            activeGym={activeGym}
            activeOwnerGymId={activeOwnerGymId}
            onSelectGym={setActiveOwnerGymId}
          />

          {ownedGyms.length === 0 && profileComplete ? (
            <Card title="Become Gym Owner" highlighted>
              <Text className={`mb-3 ${text.caption}`}>
                If you own a gym or want to manage your fitness business, create your gym and access
                owner tools.
              </Text>
              <Button
                title="Create Gym"
                onPress={() => {
                  setAppMode('owner');
                  router.push('/create-gym');
                }}
              />
            </Card>
          ) : null}
        </>
      )}

      <AppOptionsMenu />
    </Screen>
  );
}
