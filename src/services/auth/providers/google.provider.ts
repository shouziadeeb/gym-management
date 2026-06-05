/**
 * @file google.provider.ts
 * Google OAuth via Supabase Auth + expo-web-browser auth session.
 */
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { getOAuthRedirectUri, logOAuthRedirectDiagnostics } from '@/lib/auth-redirect-uri';
import { clearOAuthPendingStorage } from '@/lib/auth-oauth-cleanup';
import { finishOAuthFlow, resetOAuthFinishState } from '@/lib/oauth-finish';
import { completeOAuthSessionFromUrl } from '@/lib/oauth-exchange';
import { logOAuthDebug, snapshotOAuthStorage } from '@/lib/oauth-debug';
import { saveOAuthPending } from '@/lib/oauth-pending';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type { AuthScreenMode } from '@/services/auth/auth.types';

WebBrowser.maybeCompleteAuthSession();

function googleQueryParams(mode: AuthScreenMode) {
  return {
    access_type: 'offline',
    prompt: mode === 'signup' ? 'consent' : 'select_account',
  };
}

async function beginGoogleOAuth(mode: AuthScreenMode, redirect?: string): Promise<string> {
  resetOAuthFinishState();
  clearOAuthPendingStorage();
  await saveOAuthPending({ mode, redirect });

  const redirectTo = getOAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
      queryParams: googleQueryParams(mode),
    },
  });

  if (error) {
    logger.warn('auth.google.signInWithOAuth failed', { mode, error: error.message });
    throw error;
  }

  if (!data.url) {
    throw new Error('Could not start Google sign-in. Check Supabase Google provider settings.');
  }

  return data.url;
}

async function signInWithGoogleWeb(
  mode: AuthScreenMode,
  redirect?: string,
): Promise<Session> {
  logOAuthRedirectDiagnostics('web.signInWithOAuth');

  logOAuthDebug('signInWithOAuth.before', {
    mode,
    redirectTo: getOAuthRedirectUri(),
    origin: typeof window !== 'undefined' ? window.location.origin : null,
  });
  snapshotOAuthStorage('signInWithOAuth.before');

  const url = await beginGoogleOAuth(mode, redirect);

  snapshotOAuthStorage('signInWithOAuth.after');
  logOAuthDebug('signInWithOAuth.after', {
    oauthUrl: url,
    codeVerifierKey: 'gym-auth-code-verifier',
  });

  if (typeof window !== 'undefined') {
    window.location.assign(url);
  }

  // Page navigates away — session is completed on /auth/callback.
  return new Promise<Session>(() => {});
}

async function signInWithGoogleNative(
  mode: AuthScreenMode,
  redirect?: string,
): Promise<Session> {
  const redirectTo = getOAuthRedirectUri();
  const diagnostics = logOAuthRedirectDiagnostics('native.signInWithOAuth');

  const url = await beginGoogleOAuth(mode, redirect);

  logger.info('auth.google.native.signInWithOAuth', {
    mode,
    redirectTo,
    platform: diagnostics.platform,
    isExpoGo: diagnostics.isExpoGo,
    supabaseAuthorizeUrl: url,
  });

  const result = await WebBrowser.openAuthSessionAsync(url, redirectTo, {
    showInRecents: true,
  });

  logger.info('auth.google.native.browserResult', {
    type: result.type,
    callbackUrl: result.type === 'success' ? result.url : null,
  });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google sign-in was cancelled');
  }

  if (result.type !== 'success') {
    throw new Error('Google sign-in failed. Please try again.');
  }

  const session = await completeOAuthSessionFromUrl(result.url);
  logger.info('auth.google.signIn success', { mode, userId: session.user.id });

  // finishOAuthFlow is single-flight — safe if /auth/callback deep link also runs.
  await finishOAuthFlow(session);

  return session;
}

/** Opens Google sign-in and returns a Supabase session (native) or redirects (web). */
export async function signInWithGoogle(
  mode: AuthScreenMode = 'login',
  redirect?: string,
): Promise<Session> {
  if (Platform.OS === 'web') {
    return signInWithGoogleWeb(mode, redirect);
  }
  return signInWithGoogleNative(mode, redirect);
}
