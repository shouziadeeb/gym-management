import { Platform } from "react-native";

/** Shared layout tokens for anchored dropdown menus. */
const base = {
  panelWidth: 230,
  borderRadius: 14,
  panelPaddingVertical: 10,
  panelPaddingHorizontal: 4,
  itemPaddingHorizontal: 16,
  itemPaddingVertical: 12,
  itemMinHeight: 48,
  iconSize: 20,
  iconSlotWidth: 28,
  iconGap: 14,
  checkSlotWidth: 24,
  labelFontSize: 16,
  labelLineHeight: 22,
  dividerInset: 12,
} as const;

/** Extra vertical gap between rows — native Pressable padding is unreliable. */
// const nativeItemGap = 0;

export const menuLayout = {
  ...base,
  /** Gap between items inside a MenuGroup on iOS/Android only. */
  
} as const;
