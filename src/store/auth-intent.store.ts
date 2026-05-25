import { create } from 'zustand';

export type AuthIntent =
  | 'join_gym'
  | 'buy_membership'
  | 'create_gym'
  | 'owner_dashboard'
  | 'member_dashboard'
  | 'profile';

type AuthIntentState = {
  pendingIntent: AuthIntent | null;
  setPendingIntent: (intent: AuthIntent) => void;
  clearPendingIntent: () => void;
};

export const useAuthIntentStore = create<AuthIntentState>((set) => ({
  pendingIntent: null,
  setPendingIntent: (pendingIntent) => set({ pendingIntent }),
  clearPendingIntent: () => set({ pendingIntent: null }),
}));

