/**
 * @file useSession.ts
 * Read-only hook for Zustand auth session state (synced by AuthProvider).
 */
import { deriveAuthStatus, useAuthStore } from '@/store/auth.store';
import { getUserFromSession } from '@/services/auth/session.service';

/** Read-only session state synchronized by `AuthProvider`. */
export function useSession() {
  const session = useAuthStore((state) => state.session);
  const initialized = useAuthStore((state) => state.initialized);
  const phase = useAuthStore((state) => state.phase);
  const lastError = useAuthStore((state) => state.lastError);

  const status = deriveAuthStatus({ session, initialized, phase, lastError });

  return {
    session,
    user: getUserFromSession(session),
    initialized,
    status,
    lastError,
    isAuthenticated: Boolean(session),
    isInitializing: status === 'initializing',
    isLoading: status === 'loading',
  };
}
