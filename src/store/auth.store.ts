import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

export type AuthPhase = 'booting' | 'anonymous' | 'signing_in' | 'ready' | 'error';

/** High-level auth status for UI guards and navigation. */
export type AuthStatus = 'initializing' | 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  session: Session | null;
  initialized: boolean;
  phase: AuthPhase;
  lastError: string | null;
  setSession: (session: Session | null) => void;
  setInitialized: (value: boolean) => void;
  setPhase: (phase: AuthPhase) => void;
  setLastError: (error: string | null) => void;
};

export function deriveAuthStatus(state: Pick<AuthState, 'session' | 'initialized' | 'phase' | 'lastError'>): AuthStatus {
  if (state.phase === 'signing_in') return 'loading';
  if (!state.initialized || state.phase === 'booting') return 'initializing';
  if (state.session) return 'authenticated';
  return 'unauthenticated';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  initialized: false,
  phase: 'booting',
  lastError: null,
  setSession: (session) => {
    const { phase } = get();
    if (phase === 'signing_in') {
      set({ session });
      return;
    }
    set({
      session,
      phase: session ? 'ready' : 'anonymous',
    });
  },
  setInitialized: (initialized) => set({ initialized }),
  setPhase: (phase) => set({ phase }),
  setLastError: (lastError) => set({ lastError }),
}));
