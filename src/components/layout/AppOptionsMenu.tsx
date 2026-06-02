import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import {
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
} from "lucide-react-native";

import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { MenuDivider, MenuGroup, MenuItem } from "@/components/ui/MenuItems";
import { Button } from "@/components/ui/Button";
import { ModalCard } from "@/components/ui/ModalCard";
import { useTheme } from "@/hooks/useTheme";
import { signOut } from "@/services/auth/auth.service";
import { useAppStore } from "@/store/app.store";
import { useAuthStore } from "@/store/auth.store";
import { useProfileMenuStore } from "@/store/profile-menu.store";
import { layout, text } from "@/theme/classes";

/** Theme, settings, and auth actions — available to guests and signed-in users. */
export function AppOptionsMenu() {
  const { preference, setPreference } = useTheme();
  const session = useAuthStore((state) => state.session);
  const resetGymContext = useAppStore((state) => state.resetGymContext);
  const showMenu = useProfileMenuStore((state) => state.isOpen);
  const menuAnchor = useProfileMenuStore((state) => state.anchor);
  const closeMenu = useProfileMenuStore((state) => state.close);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isAuthenticated = Boolean(session);

  async function handleSignOut() {
    await signOut();
    resetGymContext();
    closeMenu();
    setShowLogoutConfirm(false);
  }

  function closeAndRun(action: () => void) {
    closeMenu();
    action();
  }

  return (
    <>
      <DropdownMenu
        visible={showMenu}
        anchor={menuAnchor}
        onClose={closeMenu}
      >
        <MenuGroup>
          <MenuItem
            label="Settings"
            icon={Settings}
            onPress={() =>
              closeAndRun(() => {
                router.push("/settings");
              })
            }
          />
        </MenuGroup>

        <MenuDivider />

        <MenuGroup>
          <MenuItem
            label="Light"
            icon={Sun}
            selected={preference === "light"}
            onPress={() => {
              setPreference("light");
              closeMenu();
            }}
          />
          <MenuItem
            label="Dark"
            icon={Moon}
            selected={preference === "dark"}
            onPress={() => {
              setPreference("dark");
              closeMenu();
            }}
          />
          <MenuItem
            label="System"
            icon={Monitor}
            selected={preference === "system"}
            onPress={() => {
              setPreference("system");
              closeMenu();
            }}
          />
        </MenuGroup>

        <MenuDivider />

        <MenuGroup>
          {isAuthenticated ? (
            <MenuItem
              label="Logout"
              icon={LogOut}
              destructive
              onPress={() =>
                closeAndRun(() => {
                  setShowLogoutConfirm(true);
                })
              }
            />
          ) : (
            <MenuItem
              label="Login"
              icon={LogIn}
              onPress={() =>
                closeAndRun(() => {
                  router.push("/auth/login");
                })
              }
            />
          )}
        </MenuGroup>
      </DropdownMenu>

      <ModalCard
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        anchor="center"
      >
        <Text className={text.cardTitle}>Confirm logout</Text>
        <Text className={`${layout.stack} ${text.caption}`}>
          Are you sure you want to logout?
        </Text>

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1">
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setShowLogoutConfirm(false)}
            />
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
