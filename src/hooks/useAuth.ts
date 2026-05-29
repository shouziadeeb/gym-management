/**
 * @file useAuth.ts
 * React hook: current session, user, auth method/provider detection, and signOut.
 */
import { useCallback } from 'react';

import { useSession } from '@/hooks/useSession';
import { detectAuthMethodFromUser, detectAuthProviderFromUser } from '@/services/auth/auth.utils';
import { signOut } from '@/services/auth/session.service';

/** Primary auth hook: session, user, method detection, and sign-out. */
export function useAuth() {
  const { session, user, initialized, isAuthenticated } = useSession();

  const signOutUser = useCallback(async () => {
    await signOut();
  }, []);

  return {
    session,
    user,
    initialized,
    isAuthenticated,
    authMethod: user ? detectAuthMethodFromUser(user) : null,
    authProvider: user ? detectAuthProviderFromUser(user) : null,
    signOut: signOutUser,
  };
}
