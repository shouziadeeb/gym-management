import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ModalCard } from '@/components/ui/ModalCard';
import { useTheme } from '@/hooks/useTheme';
import { signOut } from '@/services/auth/auth.service';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { useProfileMenuStore } from '@/store/profile-menu.store';
import { layout, text } from '@/theme/classes';

/** Theme, settings, and auth actions — available to guests and signed-in users. */
export function AppOptionsMenu() {
  const { preference, setPreference } = useTheme();
  const session = useAuthStore((state) => state.session);
  const resetGymContext = useAppStore((state) => state.resetGymContext);
  const showMenu = useProfileMenuStore((state) => state.isOpen);
  const closeMenu = useProfileMenuStore((state) => state.close);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isAuthenticated = Boolean(session);

  async function handleSignOut() {
    await signOut();
    resetGymContext();
    closeMenu();
    setShowLogoutConfirm(false);
  }

  return (
    <>
      <ModalCard visible={showMenu} onClose={closeMenu} anchor="top">
        <Text className={text.cardTitle}>App menu</Text>
        <Text className={`${layout.stackSm} ${text.caption}`}>Appearance and account shortcuts.</Text>

        <Text className={`mt-3 ${text.label}`}>Theme</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          <Chip label="System" active={preference === 'system'} onPress={() => setPreference('system')} />
          <Chip label="Light" active={preference === 'light'} onPress={() => setPreference('light')} />
          <Chip label="Dark" active={preference === 'dark'} onPress={() => setPreference('dark')} />
        </View>

        <View className="mt-4">
          <Button
            title="Open settings"
            variant="ghost"
            onPress={() => {
              closeMenu();
              router.push('/settings');
            }}
          />
        </View>

        {isAuthenticated ? (
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
        ) : (
          <View className="mt-2">
            <Button
              title="Login"
              onPress={() => {
                closeMenu();
                router.push('/auth/login');
              }}
            />
          </View>
        )}
      </ModalCard>

      <ModalCard visible={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} anchor="center">
        <Text className={text.cardTitle}>Confirm logout</Text>
        <Text className={`${layout.stack} ${text.caption}`}>Are you sure you want to logout?</Text>

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
      </ModalCard>
    </>
  );
}
