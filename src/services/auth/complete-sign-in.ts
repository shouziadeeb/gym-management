/**
 * @file complete-sign-in.ts
 * Single post-auth pipeline: sync store → ensure profile → warm cache → navigate once.
 */
import type { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { InteractionManager, Platform } from 'react-native';

import { ensureProfileForUser, fetchMyProfile, type EnsureProfileOptions } from '@/api/profiles.api';
import { queryClient } from '@/api/queries/client';
import { queryKeys } from '@/api/queries/keys';
import { authLog } from '@/lib/auth-log';
import { authNavigate } from '@/lib/auth-navigate';
import { cleanOAuthCallbackUrl, clearLegacyWebAuthStorage } from '@/lib/auth-oauth-cleanup';
import { resolveOAuthDestination, resolvePostAuthDestination } from '@/lib/oauth-finish';
import { consumeOAuthPending, type OAuthPending } from '@/lib/oauth-pending';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import { useAuthStore } from '@/store/auth.store';

export type CompleteSignInParams = {
  session: Session;
  mode?: AuthScreenMode;
  redirect?: string;
  authMethod?: 'phone' | 'email' | 'google' | null;
  profileOptions?: EnsureProfileOptions;
  /** When true, reads OAuth pending context and cleans up web callback URL. */
  fromOAuth?: boolean;
  /** Pre-read pending OAuth context (optional — consumed when omitted and fromOAuth). */
  oauthPending?: OAuthPending | null;
};

let inflightCompleteSignIn: Promise<void> | null = null;

function deferNavigate(destination: string): Promise<void> {
  return new Promise((resolve) => {
    const run = () => {
      if (Platform.OS === 'web') {
        authNavigate(destination);
      } else {
        router.replace(destination as never);
      }
      resolve();
    };

    if (Platform.OS === 'web') {
      run();
      return;
    }

    InteractionManager.runAfterInteractions(run);
  });
}

/** Clears single-flight guard when a new sign-in attempt starts. */
export function resetCompleteSignInState(): void {
  inflightCompleteSignIn = null;
}

/**
 * Ensures profile, warms React Query cache, syncs Zustand, and navigates once.
 * Safe to call from OTP verify, native Google Sign-In, and web OAuth callback.
 */
export async function completeSignIn(params: CompleteSignInParams): Promise<void> {
  if (inflightCompleteSignIn) {
    authLog.auth('complete_sign_in.join_inflight');
    return inflightCompleteSignIn;
  }

  inflightCompleteSignIn = (async () => {
    const {
      session,
      mode = 'login',
      redirect,
      authMethod,
      profileOptions,
      fromOAuth = false,
      oauthPending: pendingOverride,
    } = params;
    const userId = session.user?.id ?? null;
    const store = useAuthStore.getState();

    authLog.auth('sign_in.started', { userId, authMethod, mode, fromOAuth });

    store.setPhase('signing_in');
    store.setLastError(null);
    store.setSession(session);
    authLog.session('store_synced', { userId });

    if (session.user) {
      await ensureProfileForUser(session.user, profileOptions);
      authLog.profile('ensured', { userId });
    }

    if (userId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.me(userId) });
      try {
        await queryClient.fetchQuery({
          queryKey: queryKeys.profile.me(userId),
          queryFn: () => fetchMyProfile(userId),
        });
        authLog.profile('fetched', { userId });
      } catch (profileError) {
        authLog.profileWarn('fetch_failed', {
          userId,
          error: profileError instanceof Error ? profileError.message : String(profileError),
        });
      }
    }

    let destination: string;
    if (fromOAuth) {
      const pending = pendingOverride !== undefined ? pendingOverride : await consumeOAuthPending();
      if (Platform.OS === 'web') {
        cleanOAuthCallbackUrl();
        clearLegacyWebAuthStorage();
      }
      destination = resolveOAuthDestination(pending);
    } else {
      destination = resolvePostAuthDestination(mode, redirect, authMethod);
    }

    authLog.navigation('started', { destination, userId });
    store.setPhase('ready');
    await deferNavigate(destination);
    authLog.navigation('completed', { destination, userId });
  })().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    authLog.authWarn('complete_sign_in.failed', { error: message });
    const hasSession = Boolean(useAuthStore.getState().session);
    useAuthStore.getState().setPhase(hasSession ? 'ready' : 'anonymous');
    useAuthStore.getState().setLastError(message);
    throw error;
  }).finally(() => {
    inflightCompleteSignIn = null;
  });

  return inflightCompleteSignIn;
}
