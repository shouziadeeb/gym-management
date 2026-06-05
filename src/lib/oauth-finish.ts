import type { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { InteractionManager, Platform } from 'react-native';

import { ensureProfileForUser } from '@/api/profiles.api';
import { cleanOAuthCallbackUrl, clearLegacyWebAuthStorage } from '@/lib/auth-oauth-cleanup';
import { authNavigate } from '@/lib/auth-navigate';
import { logOAuthDebug } from '@/lib/oauth-debug';
import { consumeOAuthPending, type OAuthPending } from '@/lib/oauth-pending';
import { logger } from '@/lib/logger';
import { routes } from '@/routing/constants';
import type { AuthScreenMode } from '@/services/auth/auth.types';

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/** Resolves where to send the user after OAuth completes. */
export function resolveOAuthDestination(pending: OAuthPending | null): string {
  if (!pending) {
    return routes.profileHub;
  }

  const targetRedirect =
    typeof pending.redirect === 'string' && pending.redirect.length > 0
      ? pending.redirect
      : routes.home;

  if (pending.mode === 'signup') {
    return `${routes.profileSetup}?redirect=${encodeURIComponent(targetRedirect)}`;
  }

  if (targetRedirect === '/' || targetRedirect === routes.home) {
    return routes.profileHub;
  }

  return targetRedirect;
}

function navigateAfterOAuth(destination: string): void {
  if (Platform.OS === 'web') {
    authNavigate(destination);
    return;
  }

  router.replace(destination as never);
}

function deferNavigate(destination: string): Promise<void> {
  return new Promise((resolve) => {
    const run = () => {
      navigateAfterOAuth(destination);
      resolve();
    };

    if (Platform.OS === 'web') {
      run();
      return;
    }

    InteractionManager.runAfterInteractions(run);
  });
}

/** Clears single-flight state when a new OAuth attempt starts. */
export function resetOAuthFinishState(): void {
  finishOAuthFlowPromise = null;
}

let finishOAuthFlowPromise: Promise<boolean> | null = null;

/**
 * Ensures profile, consumes pending context, and navigates once.
 * Safe to call from WebBrowser return and /auth/callback — second callers await the same result.
 */
export async function finishOAuthFlow(session: Session): Promise<boolean> {
  if (finishOAuthFlowPromise) {
    logOAuthDebug('finishOAuthFlow.join_inflight');
    return finishOAuthFlowPromise;
  }

  finishOAuthFlowPromise = (async () => {
    try {
      if (session.user) {
        await withTimeout(ensureProfileForUser(session.user), 8000, undefined);
      }
    } catch (error) {
      logger.warn('auth.oauth.ensure_profile_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const pending = await consumeOAuthPending();

    if (Platform.OS === 'web') {
      cleanOAuthCallbackUrl();
      clearLegacyWebAuthStorage();
    }

    const destination = resolveOAuthDestination(pending);
    logOAuthDebug('oauth.finish.navigate', { destination, userId: session.user?.id ?? null });
    logger.info('auth.oauth.complete', { destination, userId: session.user?.id ?? null });

    await deferNavigate(destination);
    return true;
  })().catch((error) => {
    finishOAuthFlowPromise = null;
    throw error;
  });

  return finishOAuthFlowPromise;
}

/** Maps OTP / hybrid auth success to the same destinations as OAuth. */
export function resolvePostAuthDestination(
  mode: AuthScreenMode,
  redirect?: string,
  authMethod?: 'phone' | 'email' | 'google' | null,
): string {
  const targetRedirect = typeof redirect === 'string' && redirect.length > 0 ? redirect : routes.home;

  if (mode === 'signup') {
    if (authMethod === 'email') {
      return routes.profile;
    }
    return `${routes.profileSetup}?redirect=${encodeURIComponent(targetRedirect)}`;
  }

  if (targetRedirect === '/' || targetRedirect === routes.home) {
    return routes.profileHub;
  }

  return targetRedirect;
}
