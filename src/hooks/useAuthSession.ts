import { useEffect } from 'react';

import { getCurrentSession, onAuthStateChange } from '@/services/auth/auth.service';
import { useAuthStore } from '@/store/auth.store';

export function useAuthSession() {
  const setSession = useAuthStore((state) => state.setSession);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const session = await getCurrentSession();
      if (!cancelled) {
        setSession(session);
        setInitialized(true);
      }
    })().catch(() => {
      if (!cancelled) {
        setInitialized(true);
      }
    });

    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setInitialized, setSession]);
}