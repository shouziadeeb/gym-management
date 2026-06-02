/**
 * @file ProfileHubHeader.tsx
 * Top bar: notification / app menu action only (no duplicate branding).
 */
import { Pressable, View } from "react-native";
import { Bell } from "lucide-react-native";

import { useOpenProfileMenu } from "@/hooks/useOpenProfileMenu";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/theme/spacing";

export function ProfileHubHeader() {
  const { colors } = useTheme();
  const { triggerRef, openMenu } = useOpenProfileMenu();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginBottom: spacing[4],
      }}
    >
      <Pressable
        ref={triggerRef}
        collapsable={false}
        onPress={openMenu}
        hitSlop={12}
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
        }}
        accessibilityRole="button"
        accessibilityLabel="Open app menu"
      >
        <Bell size={22} color={colors.foreground} strokeWidth={1.75} />
      </Pressable>
    </View>
  );
}
