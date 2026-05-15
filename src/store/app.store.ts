import { create } from 'zustand';

export type AppMode = 'owner' | 'member';

type AppState = {
  appMode: AppMode;
  activeOwnerGymId: string | null;
  activeMemberGymId: string | null;
  setAppMode: (mode: AppMode) => void;
  setActiveOwnerGymId: (id: string | null) => void;
  setActiveMemberGymId: (id: string | null) => void;
  resetGymContext: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  appMode: 'owner',
  activeOwnerGymId: null,
  activeMemberGymId: null,
  setAppMode: (appMode) => set({ appMode }),
  setActiveOwnerGymId: (activeOwnerGymId) => set({ activeOwnerGymId }),
  setActiveMemberGymId: (activeMemberGymId) => set({ activeMemberGymId }),
  resetGymContext: () => set({ activeOwnerGymId: null, activeMemberGymId: null }),
}));