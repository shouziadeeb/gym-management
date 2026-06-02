import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import type { PendingOAuthContext } from '@/lib/oauth-context';

const OAUTH_CALLBACK_PATH = 'auth/callback';

function readOAuthRedirectOverride(): string | null {
  const override = process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URL?.trim();
  return override && override.length > 0 ? override : null;
}

function readExpoHostUri(): string | null {
  const hostUri = Constants.expoConfig?.hostUri?.trim();
  return hostUri && hostUri.length > 0 ? hostUri : null;
}

export function isRunningInExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/** Expo Go deep link callback — Supabase accepts exp:// but often blocks private http:// IPs. */
function buildExpoGoOAuthRedirectUri(): string {
  return Linking.createURL(OAUTH_CALLBACK_PATH);
}

/**
 * Supabase redirect URL for the current runtime.
 * Expo Go uses exp:// deep links + in-app auth session (not LAN http in external Chrome).
 */
export function buildOAuthRedirectUri(): string {
  const override = readOAuthRedirectOverride();
  if (override && Platform.OS !== 'web') {
    return override;
  }

  if (Platform.OS === 'web') {
    return makeRedirectUri({ path: OAUTH_CALLBACK_PATH, preferLocalhost: true });
  }

  if (isRunningInExpoGo()) {
    return buildExpoGoOAuthRedirectUri();
  }

  return Linking.createURL(OAUTH_CALLBACK_PATH);
}

/** Deep link used to return the session from the phone browser back into Expo Go. */
export function buildExpoGoHandoffUrl(
  session: Session,
  pending?: PendingOAuthContext | null,
  expoHostOverride?: string,
): string {
  const hostUri =
    expoHostOverride ??
    readExpoHostUri() ??
    (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.host : null);

  if (!hostUri) {
    throw new Error('Cannot return to Expo Go. Restart the dev server and try again.');
  }

  const query = new URLSearchParams();
  if (pending?.mode) query.set('mode', pending.mode);
  if (pending?.redirect) query.set('redirect', pending.redirect);

  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  }).toString();

  const queryString = query.toString();
  return `exp://${hostUri}/--/${OAUTH_CALLBACK_PATH}${queryString ? `?${queryString}` : ''}#${hash}`;
}

/** True when OAuth finished in the phone browser and should jump back into Expo Go. */
export function shouldHandoffOAuthToExpoGo(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (!/Android|iPhone|iPad/i.test(navigator.userAgent)) return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get('expo_host')) return true;

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return false;
  }

  return window.location.pathname.includes(`/${OAUTH_CALLBACK_PATH}`);
}

export function readExpoHostFromCallbackSearch(search: string): string | undefined {
  const value = new URLSearchParams(search).get('expo_host')?.trim();
  return value && value.length > 0 ? value : undefined;
}

/** Lines to paste into Supabase → Authentication → Redirect URLs. */
export function getSupabaseOAuthSetupInstructions(redirectUri = buildOAuthRedirectUri()): string[] {
  return [
    redirectUri,
    'exp://*/--/auth/callback',
    'exp://**',
    'http://localhost:8081/auth/callback',
    'gymapp://auth/callback',
  ];
}

export function isLocalhostOAuthRedirect(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function buildLocalhostRedirectError(redirectUri = buildOAuthRedirectUri()): string {
  return `Supabase redirected to localhost instead of ${redirectUri}. Add the exp:// URLs from the yellow hint to Supabase Redirect URLs.`;
}

export function assertSupabaseOAuthRedirect(oauthUrl: string, expectedRedirect: string): void {
  try {
    const parsed = new URL(oauthUrl);
    const redirectParam = parsed.searchParams.get('redirect_to');
    if (!redirectParam) return;

    const decoded = decodeURIComponent(redirectParam);
    if (isLocalhostOAuthRedirect(decoded) && !isLocalhostOAuthRedirect(expectedRedirect)) {
      throw new Error(buildLocalhostRedirectError(expectedRedirect));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Supabase redirected')) {
      throw error;
    }
  }
}

export const SUPABASE_OAUTH_REDIRECT_PATTERNS = [
  'exp://*/--/auth/callback',
  'exp://**',
  'http://localhost:8081/auth/callback',
  'gymapp://auth/callback',
] as const;
