import type { RefObject } from "react";
import type { View } from "react-native";

export type MenuAnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function measureMenuAnchor(
  ref: RefObject<View | null>,
): Promise<MenuAnchorRect | null> {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node) {
      resolve(null);
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      resolve({ x, y, width, height });
    });
  });
}
