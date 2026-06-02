import type { ReactNode } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import { menuLayout } from "@/components/ui/menu-layout";
import { useTheme } from "@/hooks/useTheme";
import type { MenuAnchorRect } from "@/lib/measure-menu-anchor";
import { cardSurface } from "@/theme/styles";
import { spacing } from "@/theme/spacing";

type Props = {
  visible: boolean;
  anchor: MenuAnchorRect | null;
  onClose: () => void;
  children: ReactNode;
  width?: number;
};

function menuPanelPosition(
  anchor: MenuAnchorRect,
  screenWidth: number,
  panelWidth: number,
): ViewStyle {
  return {
    position: "absolute",
    top: anchor.y + anchor.height + spacing[2],
    right: Math.max(spacing[3], screenWidth - anchor.x - anchor.width),
    width: panelWidth,
  };
}

function menuElevation(isDark: boolean): ViewStyle {
  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.14,
    shadowRadius: 20,
    elevation: 16,
  };
}

/** Anchored popover menu — opens below the trigger, aligned to its trailing edge. */
export function DropdownMenu({
  visible,
  anchor,
  onClose,
  children,
  width = menuLayout.panelWidth,
}: Props) {
  const { colors, isDark } = useTheme();
  const screenWidth = Dimensions.get("window").width;

  if (!visible || !anchor) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, styles.overlay]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss menu"
        />

        <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
          <View
            accessibilityRole="menu"
            style={[
              menuPanelPosition(anchor, screenWidth, width),
              cardSurface(colors, true),
              menuElevation(isDark),
              styles.panel,
            ]}
          >
            <View style={styles.content}>{children}</View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
  panel: {
    borderRadius: menuLayout.borderRadius,
    overflow: "hidden",
  },
  content: {
    width: "100%",
    paddingVertical: menuLayout.panelPaddingVertical,
    paddingHorizontal: menuLayout.panelPaddingHorizontal,
  },
});
