import { create } from 'zustand';

type ProfileMenuState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useProfileMenuStore = create<ProfileMenuState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

