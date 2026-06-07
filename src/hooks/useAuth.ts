/**
 * @file useAuth.ts
 * React hook: current session, user, auth status, method detection, and signOut.
 */
import { useCallback } from 'react';

import { useSession } from '@/hooks/useSession';
import { detectAuthMethodFromUser, detectAuthProviderFromUser } from '@/services/auth/auth.utils';
import { signOut } from '@/services/auth/session.service';

/** Primary auth hook: session, user, status, method detection, and sign-out. */
export function useAuth() {
  const { session, user, initialized, status, isAuthenticated, lastError } = useSession();

  const signOutUser = useCallback(async () => {
    await signOut();
  }, []);

  return {
    session,
    user,
    initialized,
    status,
    lastError,
    isAuthenticated,
    isInitializing: status === 'initializing',
    isLoading: status === 'loading',
    authMethod: user ? detectAuthMethodFromUser(user) : null,
    authProvider: user ? detectAuthProviderFromUser(user) : null,
    signOut: signOutUser,
  };
}
