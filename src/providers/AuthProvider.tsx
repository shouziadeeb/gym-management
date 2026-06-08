/**
 * @file AuthProvider.tsx
 * Single source of truth for Supabase session bootstrap, auth state subscription, and status.
 */
import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { completeWebOAuthCallbackIfNeeded } from '@/lib/auth-oauth-callback';
import { authLog } from '@/lib/auth-log';
import { getAuthEnvSummary } from '@/lib/env';
import { isOAuthCallbackPath } from '@/lib/is-oauth-callback-path';
import { ensureGoogleSignInConfigured } from '@/services/auth/google-signin.config';
import { isNativeGoogleSignInSupported } from '@/services/auth/google-signin.availability';
import { getCurrentSession, onAuthStateChange } from '@/services/auth/auth.service';
import { getUserFromSession } from '@/services/auth/session.service';
import {
  deriveAuthStatus,
  type AuthStatus,
  useAuthStore,
} from '@/store/auth.store';

const BOOTSTRAP_TIMEOUT_MS = 5000;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  status: AuthStatus;
  lastError: string | null;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function bootstrapSessionWithTimeout(): Promise<Session | null> {
  try {
    return await Promise.race([
      getCurrentSession(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), BOOTSTRAP_TIMEOUT_MS)),
    ]);
  } catch {
    return null;
  }
}

function syncStoreFromBootstrap(session: Session | null): void {
  const store = useAuthStore.getState();
  store.setSession(session);
  store.setPhase(session ? 'ready' : 'anonymous');
  store.setInitialized(true);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useAuthStore((state) => state.session);
  const initialized = useAuthStore((state) => state.initialized);
  const phase = useAuthStore((state) => state.phase);
  const lastError = useAuthStore((state) => state.lastError);
  const setSession = useAuthStore((state) => state.setSession);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const setPhase = useAuthStore((state) => state.setPhase);

  useEffect(() => {
    if (Platform.OS !== 'web' && isNativeGoogleSignInSupported()) {
      try {
        ensureGoogleSignInConfigured();
      } catch (error) {
        authLog.googleWarn('configure.skipped', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (__DEV__) {
      authLog.auth('env.summary', getAuthEnvSummary());
    }

    if (isOAuthCallbackPath()) {
      setInitialized(true);
    }

    (async () => {
      try {
        authLog.auth('bootstrap.started');

        if (isOAuthCallbackPath()) {
          const handled = await completeWebOAuthCallbackIfNeeded();
          authLog.auth('bootstrap.web_oauth_callback', { handled });
          if (handled || cancelled) {
            return;
          }
        }

        const bootstrapped = await bootstrapSessionWithTimeout();
        if (cancelled) return;

        authLog.session('bootstrap.completed', {
          hasSession: Boolean(bootstrapped),
          userId: bootstrapped?.user?.id ?? null,
        });

        syncStoreFromBootstrap(bootstrapped);
      } catch (error) {
        if (!cancelled) {
          authLog.sessionWarn('bootstrap.failed', {
            error: error instanceof Error ? error.message : String(error),
          });
          setPhase('anonymous');
          setInitialized(true);
        }
      }
    })();

    const {
      data: { subscription },
    } = onAuthStateChange((_event, nextSession) => {
      authLog.session('state_changed', {
        hasSession: Boolean(nextSession),
        userId: nextSession?.user?.id ?? null,
      });

      const currentPhase = useAuthStore.getState().phase;
      if (currentPhase === 'signing_in') {
        useAuthStore.setState({ session: nextSession });
        return;
      }
      setSession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setInitialized, setPhase, setSession]);

  const value = useMemo<AuthContextValue>(() => {
    const status = deriveAuthStatus({ session, initialized, phase, lastError });
    const user = getUserFromSession(session);

    return {
      session,
      user,
      initialized,
      status,
      lastError,
      isAuthenticated: Boolean(session),
    };
  }, [session, initialized, phase, lastError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
