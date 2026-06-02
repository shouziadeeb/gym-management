import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import type { PendingOAuthContext } from '@/lib/oauth-context';

const OAUTH_CALLBACK_PATH = 'auth/callback';
const APP_SCHEME = 'gymapp';

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

/** Expo Go / dev client deep link — must match Supabase Redirect URLs (exp://…/--/auth/callback). */
function buildExpoGoOAuthRedirectUri(): string {
  return makeRedirectUri({
    path: OAUTH_CALLBACK_PATH,
    preferLocalhost: false,
  });
}

/** Standalone / EAS build deep link (gymapp://auth/callback). */
function buildProductionNativeOAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: APP_SCHEME,
    path: OAUTH_CALLBACK_PATH,
  });
}

/**
 * Supabase redirect URL for the current runtime.
 * Web → https://host/auth/callback; Expo Go → exp://; production native → gymapp://.
 */
export function buildOAuthRedirectUri(): string {
  const override = readOAuthRedirectOverride();
  if (override) {
    return override;
  }

  if (Platform.OS === 'web') {
    return makeRedirectUri({
      path: OAUTH_CALLBACK_PATH,
      preferLocalhost: true,
    });
  }

  if (isRunningInExpoGo()) {
    return buildExpoGoOAuthRedirectUri();
  }

  return buildProductionNativeOAuthRedirectUri();
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
  const lines = [
    redirectUri,
    'exp://*/--/auth/callback',
    'exp://**',
    'http://localhost:8081/auth/callback',
    'gymapp://auth/callback',
  ];

  const override = readOAuthRedirectOverride();
  if (override && !lines.includes(override)) {
    lines.push(override);
  }

  return lines;
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

/** Wildcard patterns safe to add in Supabase Redirect URLs. */
export const SUPABASE_OAUTH_REDIRECT_PATTERNS = [
  'exp://*/--/auth/callback',
  'exp://**',
  'http://localhost:8081/auth/callback',
  'gymapp://auth/callback',
] as const;

/** True when a deep-link callback URL matches the configured OAuth redirect prefix. */
export function isOAuthCallbackUrl(url: string, redirectUri = buildOAuthRedirectUri()): boolean {
  const callbackPrefix = redirectUri.split('?')[0];
  if (url.startsWith(callbackPrefix)) return true;

  try {
    const parsed = Linking.parse(url);
    return parsed.path === OAUTH_CALLBACK_PATH || parsed.path === `/${OAUTH_CALLBACK_PATH}`;
  } catch {
    return url.includes(OAUTH_CALLBACK_PATH);
  }
}
