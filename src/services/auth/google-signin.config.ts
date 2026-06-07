import {
  GoogleSignin,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { authLog } from '@/lib/auth-log';
import { getGoogleSignInEnv } from '@/lib/env';

let configured = false;

/** Validates and returns Google Sign-In env for native builds. */
export function assertGoogleSignInConfigured(): void {
  const { webClientId } = getGoogleSignInEnv();
  if (!webClientId) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Add your Google Cloud Web OAuth client ID to .env.',
    );
  }
}

/** One-time native Google Sign-In SDK configuration (Android + iOS). */
export function ensureGoogleSignInConfigured(): void {
  if (configured || Platform.OS === 'web') return;

  const { webClientId, iosClientId } = getGoogleSignInEnv();
  assertGoogleSignInConfigured();

  GoogleSignin.configure({
    webClientId: webClientId!,
    offlineAccess: false,
    ...(iosClientId ? { iosClientId } : {}),
  });
  configured = true;

  authLog.google('configure.completed', {
    platform: Platform.OS,
    hasIosClientId: Boolean(iosClientId),
  });
}

/** Clears Google Sign-In cached account (safe no-op when not signed in). */
export async function signOutGoogleNative(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    ensureGoogleSignInConfigured();
    await GoogleSignin.signOut();
    authLog.google('sign_out.completed');
  } catch {
    // User may not have used Google — ignore.
  }
}
