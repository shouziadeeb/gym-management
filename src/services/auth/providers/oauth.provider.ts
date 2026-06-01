/**
 * @file oauth.provider.ts
 * Supabase Google OAuth via signInWithOAuth (native auth session + web redirect).
 */
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { ensureProfileForUser } from '@/api/profiles.api';
import { popPendingOAuthContext, stashPendingOAuthContext } from '@/lib/oauth-context';
import {
  buildLocalhostRedirectError,
  buildOAuthRedirectUri,
  isLocalhostOAuthRedirect,
  isRunningInExpoGo,
} from '@/lib/oauth-redirect';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type { AuthScreenMode } from '@/services/auth/auth.types';

WebBrowser.maybeCompleteAuthSession();

export type GoogleOAuthOptions = {
  mode?: AuthScreenMode;
  redirect?: string;
};

async function finalizeOAuthSession(
  session: Session | null,
  user: Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>['data']['user'],
): Promise<Session> {
  if (!session) {
    throw new Error('Google sign-in succeeded but no session was returned.');
  }

  if (user) {
    await ensureProfileForUser(user);
  }

  return session;
}

async function exchangeOAuthCode(code: string): Promise<Session> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    logger.warn('auth.google.exchangeCodeForSession failed', { error: error.message });
    throw error;
  }

  logger.info('auth.google.exchangeCodeForSession success', { userId: data.user?.id });
  return finalizeOAuthSession(data.session, data.user);
}

function extractOAuthCode(url: string, params: Record<string, string>): string | null {
  if (params.code) return params.code;

  try {
    const parsed = new URL(url);
    const queryCode = parsed.searchParams.get('code');
    if (queryCode) return queryCode;
  } catch {
    // Some native deep links may not parse as standard URLs.
  }

  return null;
}

/** Completes OAuth when Supabase returns tokens directly (hash/query implicit flow). */
async function completeOAuthFromTokens(
  accessToken: string,
  refreshToken: string,
): Promise<Session> {
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    logger.warn('auth.google.setSession failed', { error: error.message });
    throw error;
  }

  logger.info('auth.google.setSession success', { userId: data.user?.id });
  return finalizeOAuthSession(data.session, data.user);
}

/** Completes OAuth from an authorization code returned by Supabase. */
export async function completeOAuthFromCode(code: string): Promise<Session> {
  return exchangeOAuthCode(code);
}

/** Completes OAuth when the browser returns with an authorization code or tokens. */
export async function completeOAuthFromUrl(url: string): Promise<Session> {
  if (Platform.OS !== 'web' && isLocalhostOAuthRedirect(url)) {
    logger.warn('auth.google.localhost_redirect', { url: url.split('#')[0] });
    throw new Error(buildLocalhostRedirectError());
  }

  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(params.error_description ?? errorCode);
  }

  if (params.access_token && params.refresh_token) {
    return completeOAuthFromTokens(params.access_token, params.refresh_token);
  }

  const code = extractOAuthCode(url, params);
  if (!code) {
    logger.warn('auth.google.missing_code', { url: url.split('#')[0] });
    throw new Error('Google sign-in did not return an authorization code.');
  }

  return exchangeOAuthCode(code);
}

function logOAuthStartUrl(oauthUrl: string, redirectTo: string): void {
  try {
    const parsed = new URL(oauthUrl);
    logger.info('auth.google.oauth_url', {
      redirectTo,
      supabaseRedirectTo: parsed.searchParams.get('redirect_to'),
      host: parsed.host,
    });
  } catch {
    logger.info('auth.google.oauth_url', { redirectTo });
  }
}

function shouldUseExternalBrowserForOAuth(): boolean {
  return isRunningInExpoGo();
}

async function openOAuthInExternalBrowser(oauthUrl: string, redirectTo: string): Promise<null> {
  logOAuthStartUrl(oauthUrl, redirectTo);

  const canOpen = await Linking.canOpenURL(oauthUrl);
  if (!canOpen) {
    throw new Error('Could not open a browser for Google sign-in.');
  }

  await Linking.openURL(oauthUrl);
  logger.info('auth.google.opened_external_browser', { redirectTo });
  return null;
}

async function openOAuthInAuthSession(oauthUrl: string, redirectTo: string): Promise<Session> {
  logOAuthStartUrl(oauthUrl, redirectTo);

  try {
    await WebBrowser.warmUpAsync();
  } catch {
    // Optional on some platforms.
  }

  let result: WebBrowser.WebBrowserAuthSessionResult;
  try {
    result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectTo, {
      showInRecents: true,
    });
  } catch (browserError) {
    logger.warn('auth.google.openAuthSession failed', {
      error: browserError instanceof Error ? browserError.message : String(browserError),
      redirectTo,
    });
    throw new Error('Could not open Google sign-in. Please try again.');
  } finally {
    try {
      await WebBrowser.coolDownAsync();
    } catch {
      // Optional on some platforms.
    }
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google sign-in was cancelled.');
  }

  if (result.type !== 'success') {
    throw new Error('Google sign-in failed. Please try again.');
  }

  if (!result.url.startsWith(redirectTo.split('?')[0])) {
    logger.warn('auth.google.redirect_mismatch', {
      expected: redirectTo,
      received: result.url.split('#')[0],
    });
  }

  return completeOAuthFromUrl(result.url);
}

/** Starts Google OAuth and returns a Supabase session on native; web redirects away. */
export async function signInWithGoogle(options: GoogleOAuthOptions = {}): Promise<Session | null> {
  await stashPendingOAuthContext({
    mode: options.mode ?? 'login',
    redirect: options.redirect,
  });

  const redirectTo = buildOAuthRedirectUri();
  logger.info('auth.google.start', { redirectTo, platform: Platform.OS });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });

  if (error) {
    logger.warn('auth.google.signInWithOAuth failed', { error: error.message });
    throw error;
  }

  if (Platform.OS === 'web') {
    if (!data.url) {
      throw new Error('Could not start Google sign-in. Please try again.');
    }
    window.location.assign(data.url);
    return null;
  }

  if (!data.url) {
    throw new Error('Could not start Google sign-in. Please try again.');
  }

  if (shouldUseExternalBrowserForOAuth()) {
    return openOAuthInExternalBrowser(data.url, redirectTo);
  }

  return openOAuthInAuthSession(data.url, redirectTo);
}

/** Reads stashed login/signup context after OAuth completes on web. */
export async function resolvePendingOAuthContext() {
  return popPendingOAuthContext();
}
