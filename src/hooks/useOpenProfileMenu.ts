import { useCallback, useRef } from "react";
import type { View } from "react-native";

import { measureMenuAnchor } from "@/lib/measure-menu-anchor";
import { useProfileMenuStore } from "@/store/profile-menu.store";

/** Measure a trigger ref and open the global profile menu anchored to it. */
export function useOpenProfileMenu() {
  const triggerRef = useRef<View>(null);
  const open = useProfileMenuStore((state) => state.open);

  const openMenu = useCallback(async () => {
    const anchor = await measureMenuAnchor(triggerRef);
    if (anchor) {
      open(anchor);
    }
  }, [open]);

  return { triggerRef, openMenu };
}
