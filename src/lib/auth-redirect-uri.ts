import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

import { logger } from '@/lib/logger';

export type OAuthRedirectDiagnostics = {
  platform: string;
  executionEnvironment: string | undefined;
  isExpoGo: boolean;
  linkingUri: string | null;
  hostUri: string | null | undefined;
  appScheme: string | string[] | undefined;
  /** URI sent to Supabase as `redirectTo` */
  redirectTo: string;
  /** What Expo Go / dev builds should use */
  expDeepLink: string;
  /** What standalone / dev-client builds should use */
  gymappDeepLink: string;
  /** Web-only — must NOT be used in Expo Go */
  webLocalhost: string | null;
  note: string;
};

function buildRedirectCandidates() {
  const expDeepLink = makeRedirectUri({ path: 'auth/callback' });
  const gymappDeepLink = makeRedirectUri({ scheme: 'gymapp', path: 'auth/callback' });

  const webLocalhost =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : null;

  return { expDeepLink, gymappDeepLink, webLocalhost };
}

/** Resolves the OAuth callback URI for the current runtime (web / Expo Go / native build). */
export function getOAuthRedirectUri(): string {
  const { expDeepLink, gymappDeepLink, webLocalhost } = buildRedirectCandidates();

  if (Platform.OS === 'web') {
    return webLocalhost ?? `${Linking.createURL('auth/callback')}`;
  }

  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  // Expo Go cannot handle gymapp:// — it must use exp:// (Metro deep link).
  if (isExpoGo) {
    return expDeepLink;
  }

  // Dev client / standalone: use the app scheme from app.json.
  return gymappDeepLink;
}

/** Logs redirect URI details to the Metro terminal when Google OAuth starts. */
export function logOAuthRedirectDiagnostics(context: string): OAuthRedirectDiagnostics {
  const { expDeepLink, gymappDeepLink, webLocalhost } = buildRedirectCandidates();
  const redirectTo = getOAuthRedirectUri();
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  const diagnostics: OAuthRedirectDiagnostics = {
    platform: Platform.OS,
    executionEnvironment: Constants.executionEnvironment,
    isExpoGo,
    linkingUri: Constants.linkingUri ?? null,
    hostUri: Constants.expoConfig?.hostUri,
    appScheme: Constants.expoConfig?.scheme,
    redirectTo,
    expDeepLink,
    gymappDeepLink,
    webLocalhost,
    note: isExpoGo
      ? 'Expo Go uses exp:// deep links (not gymapp://). Add redirectTo exactly to Supabase Redirect URLs. If the browser shows http://localhost:8081, Supabase rejected redirectTo and fell back to Site URL.'
      : Platform.OS === 'web'
        ? 'Web uses window.location.origin — localhost:8081 is expected for local web dev.'
        : 'Native build uses gymapp:// deep link. Add gymapp://auth/callback to Supabase Redirect URLs.',
  };

  logger.info(`auth.oauth.redirect.${context}`, diagnostics);
  console.log('\n========== OAuth Redirect Diagnostics ==========');
  console.log(JSON.stringify(diagnostics, null, 2));
  console.log('================================================\n');

  return diagnostics;
}
