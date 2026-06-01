import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import type { PendingOAuthContext } from '@/lib/oauth-context';

const OAUTH_CALLBACK_PATH = 'auth/callback';
const DEFAULT_PRODUCTION_OAUTH_CALLBACK = 'https://gym-management-green.vercel.app/auth/callback';

function readOAuthRedirectOverride(): string | null {
  const override = process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URL?.trim();
  return override && override.length > 0 ? override : null;
}

function readExpoHostUri(): string | null {
  const hostUri = Constants.expoConfig?.hostUri?.trim();
  return hostUri && hostUri.length > 0 ? hostUri : null;
}

function readProductionOAuthCallback(): string {
  return readOAuthRedirectOverride() ?? DEFAULT_PRODUCTION_OAUTH_CALLBACK;
}

export function isRunningInExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * Supabase redirect URL for the current runtime.
 * Expo Go uses the deployed HTTPS callback (already allowlisted) and passes the dev host for handoff.
 */
export function buildOAuthRedirectUri(): string {
  if (Platform.OS === 'web') {
    return makeRedirectUri({ path: OAUTH_CALLBACK_PATH, preferLocalhost: true });
  }

  const hostUri = readExpoHostUri();
  if (isRunningInExpoGo() && hostUri) {
    const url = new URL(readProductionOAuthCallback());
    url.searchParams.set('expo_host', hostUri);
    return url.toString();
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
    'https://gym-management-green.vercel.app/**',
    redirectUri.split('?')[0],
    'http://localhost:8081/auth/callback',
    'gymapp://auth/callback',
  ];
}

export function isLocalhostOAuthRedirect(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function buildLocalhostRedirectError(): string {
  return 'Supabase still redirected to localhost on your phone. In Redirect URLs keep https://gym-management-green.vercel.app/** and remove broken pasted entries. Site URL must be http://localhost:8081';
}

export const SUPABASE_OAUTH_REDIRECT_PATTERNS = [
  'https://gym-management-green.vercel.app/**',
  'http://localhost:8081/auth/callback',
  'gymapp://auth/callback',
] as const;
