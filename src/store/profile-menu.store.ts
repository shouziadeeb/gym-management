import { create } from 'zustand';

import type { MenuAnchorRect } from '@/lib/measure-menu-anchor';

type ProfileMenuState = {
  isOpen: boolean;
  anchor: MenuAnchorRect | null;
  open: (anchor: MenuAnchorRect) => void;
  close: () => void;
};

export const useProfileMenuStore = create<ProfileMenuState>((set) => ({
  isOpen: false,
  anchor: null,
  open: (anchor) => set({ isOpen: true, anchor }),
  close: () => set({ isOpen: false, anchor: null }),
}));

