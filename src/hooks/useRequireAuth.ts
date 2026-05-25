import { useCallback } from 'react';

import { navigateToAuthWithIntent } from '@/lib/auth-redirect';
import { useAuthIntentStore, type AuthIntent } from '@/store/auth-intent.store';
import { useAuthStore } from '@/store/auth.store';

export function useRequireAuth() {
  const session = useAuthStore((state) => state.session);
  const setPendingIntent = useAuthIntentStore((state) => state.setPendingIntent);

  return useCallback(
    (intent: AuthIntent): boolean => {
      if (session) return true;
      setPendingIntent(intent);
      navigateToAuthWithIntent(intent);
      return false;
    },
    [session, setPendingIntent],
  );
}

