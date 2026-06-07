import { useCallback } from 'react';

import { navigateToAuthWithIntent } from '@/lib/auth-redirect';
import { useAuthIntentStore, type AuthIntent } from '@/store/auth-intent.store';
import { deriveAuthStatus, useAuthStore } from '@/store/auth.store';

export function useRequireAuth() {
  const session = useAuthStore((state) => state.session);
  const initialized = useAuthStore((state) => state.initialized);
  const phase = useAuthStore((state) => state.phase);
  const lastError = useAuthStore((state) => state.lastError);
  const status = deriveAuthStatus({ session, initialized, phase, lastError });
  const setPendingIntent = useAuthIntentStore((state) => state.setPendingIntent);

  return useCallback(
    (intent: AuthIntent): boolean | 'loading' => {
      if (status === 'initializing' || status === 'loading') return 'loading';
      if (session) return true;
      setPendingIntent(intent);
      navigateToAuthWithIntent(intent);
      return false;
    },
    [session, setPendingIntent, status],
  );
}

