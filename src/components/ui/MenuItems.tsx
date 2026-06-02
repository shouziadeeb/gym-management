import { Children, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Check } from "lucide-react-native";

import { menuLayout } from "@/components/ui/menu-layout";
import { useTheme } from "@/hooks/useTheme";

type MenuItemProps = {
  label: string;
  icon?: LucideIcon;
  onPress: () => void;
  destructive?: boolean;
  selected?: boolean;
};

export function MenuDivider() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: colors.border },
      ]}
    />
  );
}

export function MenuItem({
  label,
  icon: Icon,
  onPress,
  destructive = false,
  selected = false,
}: MenuItemProps) {
  const { colors } = useTheme();
  const labelColor = destructive ? colors.danger : colors.foreground;
  const iconColor = destructive ? colors.danger : colors.foregroundSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      style={styles.itemPressable}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.itemInner,
            {
              backgroundColor: pressed ? colors.chipInactive : "transparent",
            },
          ]}
        >
          <View style={styles.row}>
            <View style={styles.iconSlot}>
              {Icon ? (
                <Icon
                  size={menuLayout.iconSize}
                  color={iconColor}
                  strokeWidth={2}
                />
              ) : null}
            </View>

            <Text
              style={[styles.label, { color: labelColor }]}
              numberOfLines={1}
            >
              {label}
            </Text>

            <View style={styles.checkSlot}>
              {selected ? (
                <Check size={18} color={colors.primary} strokeWidth={2.5} />
              ) : null}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

type MenuGroupProps = {
  children: ReactNode;
};

export function MenuGroup({ children }: MenuGroupProps) {
  const items = Children.toArray(children);

  return (
    <View style={styles.group}>
      {items.map((child, index) => (
        <View
          key={index}
          style={
            menuLayout.itemGap > 0 && index < items.length - 1
              ? { marginBottom: menuLayout.itemGap }
              : undefined
          }
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    width: "100%",
  },
  itemPressable: {
    width: "100%",
  },
  itemInner: {
    width: "100%",
    minHeight: menuLayout.itemMinHeight,
    paddingHorizontal: menuLayout.itemPaddingHorizontal,
    paddingVertical: menuLayout.itemPaddingVertical,
    justifyContent: "center",
    borderRadius: 8,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  iconSlot: {
    width: menuLayout.iconSlotWidth,
    marginRight: menuLayout.iconGap,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    flexShrink: 1,
    fontSize: menuLayout.labelFontSize,
    lineHeight: menuLayout.labelLineHeight,
    fontWeight: "500",
  },
  checkSlot: {
    width: menuLayout.checkSlotWidth,
    marginLeft: menuLayout.iconGap,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    marginHorizontal: menuLayout.dividerInset,
    marginVertical: menuLayout.dividerSpacing,
  },
});
