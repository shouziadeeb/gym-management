/**
 * @file google.provider.ts
 * Google OAuth via Supabase Auth + expo-web-browser auth session.
 */
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { getOAuthRedirectUri, logOAuthRedirectDiagnostics } from '@/lib/auth-redirect-uri';
import { clearOAuthPendingStorage } from '@/lib/auth-oauth-cleanup';
import { completeOAuthSessionFromUrl } from '@/lib/oauth-exchange';
import { logOAuthDebug, snapshotOAuthStorage } from '@/lib/oauth-debug';
import { consumeOAuthPending, peekOAuthPending, saveOAuthPending } from '@/lib/oauth-pending';
import { postAuthNavigate } from '@/lib/post-auth-navigate';
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

async function signInWithGoogleWeb(
  mode: AuthScreenMode,
  redirect?: string,
): Promise<Session> {
  const redirectTo = getOAuthRedirectUri();
  logOAuthRedirectDiagnostics('web.signInWithOAuth');

  logOAuthDebug('signInWithOAuth.before', {
    mode,
    redirectTo,
    getOAuthRedirectUri: redirectTo,
    origin: typeof window !== 'undefined' ? window.location.origin : null,
  });
  snapshotOAuthStorage('signInWithOAuth.before');

  clearOAuthPendingStorage();
  await saveOAuthPending({ mode, redirect });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: false,
      queryParams: googleQueryParams(mode),
    },
  });

  snapshotOAuthStorage('signInWithOAuth.after');
  logOAuthDebug('signInWithOAuth.after', {
    error: error?.message ?? null,
    provider: data?.provider ?? null,
    oauthUrl: data?.url ?? null,
    codeVerifierKey: 'gym-auth-code-verifier',
  });

  if (error) {
    logger.warn('auth.google.signInWithOAuth failed', { mode, error: error.message });
    throw error;
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

  clearOAuthPendingStorage();
  await saveOAuthPending({ mode, redirect });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: googleQueryParams(mode),
    },
  });

  logger.info('auth.google.native.signInWithOAuth', {
    mode,
    redirectTo,
    platform: diagnostics.platform,
    isExpoGo: diagnostics.isExpoGo,
    supabaseAuthorizeUrl: data?.url ?? null,
    error: error?.message ?? null,
  });
  console.log('\n========== Supabase OAuth authorize URL ==========');
  console.log(data?.url ?? '(no url returned)');
  console.log('Expected return URL (redirectTo):', redirectTo);
  console.log('==================================================\n');

  if (error) {
    logger.warn('auth.google.signInWithOAuth failed', { mode, error: error.message });
    throw error;
  }

  if (!data.url) {
    throw new Error('Could not start Google sign-in. Check Supabase Google provider settings.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    showInRecents: true,
  });

  logger.info('auth.google.native.browserResult', {
    type: result.type,
    callbackUrl: result.type === 'success' ? result.url : null,
  });
  console.log('\n========== OAuth browser callback ==========');
  console.log('result.type:', result.type);
  if (result.type === 'success') {
    console.log('result.url:', result.url);
  }
  console.log('============================================\n');

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google sign-in was cancelled');
  }

  if (result.type !== 'success') {
    throw new Error('Google sign-in failed. Please try again.');
  }

  const session = await completeOAuthSessionFromUrl(result.url);
  logger.info('auth.google.signIn success', { mode, userId: session.user.id });

  // Callback deep link may have already consumed pending and navigated.
  const pending = await peekOAuthPending();
  if (pending) {
    postAuthNavigate(pending.mode, pending.redirect ?? redirect, 'google');
    await consumeOAuthPending();
  }

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
