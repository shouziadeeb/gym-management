/**
 * @file useAuthSession.ts
 * Bootstraps Supabase session on app start and subscribes to auth state → Zustand store.
 * Mount once in app/_layout.tsx.
 */
import { useEffect } from 'react';

import { getCurrentSession, onAuthStateChange } from '@/services/auth/auth.service';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/store/auth.store';

/** Loads initial session and subscribes to Supabase auth events → Zustand. */
export function useAuthSession() {
  const setSession = useAuthStore((state) => state.setSession);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const session = await getCurrentSession();
      if (!cancelled) {
        logger.info('auth.session.bootstrap', { hasSession: Boolean(session), userId: session?.user?.id ?? null });
        setSession(session);
        setInitialized(true);
      }
    })().catch(() => {
      if (!cancelled) {
        logger.warn('auth.session.bootstrap_failed');
        setInitialized(true);
      }
    });

    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      logger.info('auth.session.updated', { hasSession: Boolean(session), userId: session?.user?.id ?? null });
      setSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setInitialized, setSession]);
}