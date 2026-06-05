import type { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { ensureProfileForUser } from '@/api/profiles.api';
import { AUTH_STORAGE_KEY } from '@/lib/auth-storage';
import { cleanOAuthCallbackUrl, clearLegacyWebAuthStorage } from '@/lib/auth-oauth-cleanup';
import { authNavigate } from '@/lib/auth-navigate';
import { isOAuthCallbackPath } from '@/lib/is-oauth-callback-path';
import { logger } from '@/lib/logger';
import { logOAuthDebug, snapshotOAuthStorage } from '@/lib/oauth-debug';
import { parseOAuthCallbackUrl } from '@/lib/oauth-callback-url';
import { completeOAuthSessionFromUrl } from '@/lib/oauth-exchange';
import { consumeOAuthPending, type OAuthPending } from '@/lib/oauth-pending';
import { supabase } from '@/lib/supabase';

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function readPersistedWebSession(): Session | null {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Session;
    return parsed?.access_token ? parsed : null;
  } catch {
    return null;
  }
}

async function recoverSessionFromStorage(): Promise<Session | null> {
  const fromClient = await withTimeout(
    supabase.auth.getSession().then(({ data }) => data.session),
    3000,
    null,
  );
  if (fromClient) return fromClient;

  const persisted = readPersistedWebSession();
  if (!persisted?.access_token) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token: persisted.access_token,
    refresh_token: persisted.refresh_token ?? '',
  });

  if (error) {
    logger.warn('auth.oauth.setSession_from_storage failed', { error: error.message });
    return persisted;
  }

  return data.session ?? persisted;
}

function resolveOAuthDestination(pending: OAuthPending | null): string {
  const fallbackRedirect = '/profile-hub';

  if (!pending) {
    return fallbackRedirect;
  }

  const targetRedirect =
    typeof pending.redirect === 'string' && pending.redirect.length > 0
      ? pending.redirect
      : '/';

  if (pending.mode === 'signup') {
    return `/profile-setup?redirect=${encodeURIComponent(targetRedirect)}`;
  }

  if (targetRedirect === '/') {
    return fallbackRedirect;
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

async function finishOAuthSession(session: Session): Promise<boolean> {
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
  logOAuthDebug('callback.navigate', { destination, userId: session.user?.id ?? null });
  logger.info('auth.oauth.complete', { destination, userId: session.user?.id ?? null });
  navigateAfterOAuth(destination);
  return true;
}

/** Single-flight guard for callback completion (web + native). */
let oauthCallbackCompletion: Promise<boolean> | null = null;

async function exchangeAndFinish(authCode: string | null, callbackUrl?: string): Promise<boolean> {
  let session: Session | null = null;

  if (authCode) {
    try {
      session = await withTimeout(
        completeOAuthSessionFromUrl(callbackUrl ?? `?code=${authCode}`),
        12000,
        null,
      );
    } catch (error) {
      logOAuthDebug('callback.exchange.error', {
        error: error instanceof Error ? error.message : String(error),
      });
      logger.warn('auth.oauth.exchange_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (!session) {
    session = await recoverSessionFromStorage();
    logOAuthDebug('callback.recover', { hasSession: Boolean(session) });
  }

  if (!session) {
    return false;
  }

  return finishOAuthSession(session);
}

async function runWebOAuthCallback(): Promise<boolean> {
  if (!isOAuthCallbackPath() || Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  const callbackUrl = window.location.href;
  const parsed = parseOAuthCallbackUrl(callbackUrl);

  logOAuthDebug('callback.web.load', {
    ...parsed,
    authCodePresent: Boolean(parsed.code),
  });
  snapshotOAuthStorage('callback.web.load');

  if (parsed.error || parsed.error_description) {
    throw new Error(parsed.error_description ?? parsed.error ?? 'OAuth sign-in failed.');
  }

  return exchangeAndFinish(parsed.code, callbackUrl);
}

export type NativeOAuthCallbackParams = {
  code?: string | string[];
  error?: string | string[];
  error_description?: string | string[];
};

function firstParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Handles Expo Go / native deep link: exp://…/--/auth/callback?code=… */
async function runNativeOAuthCallback(params: NativeOAuthCallbackParams): Promise<boolean> {
  const code = firstParam(params.code);
  const oauthError = firstParam(params.error_description) ?? firstParam(params.error);

  logOAuthDebug('callback.native.load', {
    codePresent: Boolean(code),
    codePreview: code ? `${code.slice(0, 8)}…` : null,
    oauthError: oauthError ?? null,
  });

  if (oauthError) {
    throw new Error(oauthError);
  }

  // WebBrowser may have already exchanged — treat existing session as success.
  const existing = await recoverSessionFromStorage();
  if (existing) {
    logOAuthDebug('callback.native.session_already_exists', {
      userId: existing.user?.id ?? null,
    });
    return finishOAuthSession(existing);
  }

  return exchangeAndFinish(code ?? null);
}

/** Finishes a web OAuth redirect: exchange code (if present), restore session, navigate away. */
export async function completeWebOAuthCallbackIfNeeded(): Promise<boolean> {
  if (!isOAuthCallbackPath() || Platform.OS !== 'web') {
    return false;
  }

  if (!oauthCallbackCompletion) {
    oauthCallbackCompletion = runWebOAuthCallback().finally(() => {
      oauthCallbackCompletion = null;
    });
  }

  return oauthCallbackCompletion;
}

/** Finishes a native OAuth deep link opened at /auth/callback. */
export async function completeNativeOAuthCallback(
  params: NativeOAuthCallbackParams,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  if (!oauthCallbackCompletion) {
    oauthCallbackCompletion = runNativeOAuthCallback(params).finally(() => {
      oauthCallbackCompletion = null;
    });
  }

  return oauthCallbackCompletion;
}
