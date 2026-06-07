import type { Session } from '@supabase/supabase-js';

import { completeSignIn, resetCompleteSignInState } from '@/services/auth/complete-sign-in';
import { logOAuthDebug } from '@/lib/oauth-debug';
import { consumeOAuthPending, type OAuthPending } from '@/lib/oauth-pending';
import { logger } from '@/lib/logger';
import { routes } from '@/routing/constants';
import type { AuthScreenMode } from '@/services/auth/auth.types';

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

/** Clears single-flight state when a new OAuth attempt starts. */
export function resetOAuthFinishState(): void {
  resetCompleteSignInState();
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
    const pending = await consumeOAuthPending();
    logOAuthDebug('oauth.finish.navigate', { userId: session.user?.id ?? null });
    logger.info('auth.oauth.complete.start', { userId: session.user?.id ?? null });

    await completeSignIn({
      session,
      authMethod: 'google',
      fromOAuth: true,
      oauthPending: pending,
    });

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
