/**
 * @file ProfileAccountCard.tsx
 * "My Account" card with icon rows and outline "My profile" action.
 */
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { MapPin, MoreVertical, Pencil, Phone, User } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { useOpenProfileMenu } from "@/hooks/useOpenProfileMenu";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/theme/spacing";

type AccountRow = {
  icon: LucideIcon;
  label: string;
  value: string;
};

type ProfileAccountCardProps = {
  rows: AccountRow[];
  profileComplete: boolean;
  onCompleteProfile?: () => void;
};

function AccountInfoRow({ icon: Icon, label, value }: AccountRow) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        marginBottom: spacing[3],
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: colors.chipInactive,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={colors.primary} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>
          {label}
        </Text>
        <Text
          style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export function ProfileAccountCard({
  rows,
  profileComplete,
  onCompleteProfile,
}: ProfileAccountCardProps) {
  const { colors } = useTheme();
  const { triggerRef, openMenu } = useOpenProfileMenu();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[4],
        marginBottom: spacing[4],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: spacing[1],
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.foreground,
            }}
          >
            My Account
          </Text>
          <Text
            style={{ fontSize: 13, color: colors.muted, marginTop: spacing[1] }}
          >
            Manage your account and gym settings.
          </Text>
        </View>
        <Pressable
          ref={triggerRef}
          collapsable={false}
          onPress={openMenu}
          hitSlop={10}
          style={{ padding: spacing[1] }}
          accessibilityRole="button"
          accessibilityLabel="Account options"
        >
          <MoreVertical size={20} color={colors.muted} />
        </Pressable>
      </View>

      <View style={{ marginTop: spacing[4] }}>
        {rows.map((row) => (
          <AccountInfoRow key={row.label} {...row} />
        ))}
      </View>

      {!profileComplete && onCompleteProfile ? (
        <Pressable
          onPress={onCompleteProfile}
          style={{
            marginBottom: spacing[3],
            paddingVertical: spacing[2],
          }}
        >
          <Text style={{ fontSize: 13, color: colors.warning }}>
            Complete profile setup to access protected features.
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => router.push("/profile")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing[2],
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingVertical: spacing[3],
          marginTop: spacing[1],
        }}
        accessibilityRole="button"
        accessibilityLabel="Open my profile"
      >
        <Pencil size={16} color={colors.foreground} strokeWidth={2} />
        <Text
          style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}
        >
          My profile
        </Text>
      </Pressable>
    </View>
  );
}
