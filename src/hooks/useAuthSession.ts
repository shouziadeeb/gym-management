/**
 * @file useAuthSession.ts
 * Bootstraps Supabase session on app start and subscribes to auth state → Zustand store.
 */
import { useEffect } from 'react';

import { completeWebOAuthCallbackIfNeeded } from '@/lib/auth-oauth-callback';
import { getAuthEnvSummary } from '@/lib/env';
import { isOAuthCallbackPath } from '@/lib/is-oauth-callback-path';
import { logOAuthDebug } from '@/lib/oauth-debug';
import { getCurrentSession, onAuthStateChange } from '@/services/auth/auth.service';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/store/auth.store';

const BOOTSTRAP_TIMEOUT_MS = 5000;

async function bootstrapSessionWithTimeout() {
  try {
    return await Promise.race([
      getCurrentSession(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), BOOTSTRAP_TIMEOUT_MS)),
    ]);
  } catch {
    return null;
  }
}

/** Loads initial session and subscribes to Supabase auth events → Zustand. */
export function useAuthSession() {
  const setSession = useAuthStore((state) => state.setSession);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    let cancelled = false;

    if (__DEV__) {
      logger.info('auth.env', getAuthEnvSummary());
    }

    if (isOAuthCallbackPath()) {
      setInitialized(true);
    }

    (async () => {
      try {
        if (isOAuthCallbackPath()) {
          logOAuthDebug('useAuthSession.callback.start', {
            href: typeof window !== 'undefined' ? window.location.href : null,
          });
          const handled = await completeWebOAuthCallbackIfNeeded();
          logOAuthDebug('useAuthSession.callback.done', { handled });
          if (handled || cancelled) {
            return;
          }
        }

        const session = await bootstrapSessionWithTimeout();
        if (!cancelled) {
          logger.info('auth.session.bootstrap', {
            hasSession: Boolean(session),
            userId: session?.user?.id ?? null,
          });
          setSession(session);
          setInitialized(true);
        }
      } catch (error) {
        if (!cancelled) {
          logger.warn('auth.session.bootstrap_failed', {
            error: error instanceof Error ? error.message : String(error),
          });
          setInitialized(true);
        }
      }
    })();

    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      logger.info('auth.session.updated', {
        hasSession: Boolean(session),
        userId: session?.user?.id ?? null,
      });
      setSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setInitialized, setSession]);
}
