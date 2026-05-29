/**
 * @file useSession.ts
 * Read-only hook for Zustand auth session state (synced by useAuthSession in root layout).
 */
import { useAuthStore } from '@/store/auth.store';
import { getUserFromSession } from '@/services/auth/session.service';

/** Read-only session state synchronized by `useAuthSession`. */
export function useSession() {
  const session = useAuthStore((state) => state.session);
  const initialized = useAuthStore((state) => state.initialized);

  return {
    session,
    user: getUserFromSession(session),
    initialized,
    isAuthenticated: Boolean(session),
  };
}
