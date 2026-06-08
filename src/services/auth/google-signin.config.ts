import { Platform } from 'react-native';

import { authLog } from '@/lib/auth-log';
import { getGoogleSignInEnv } from '@/lib/env';
import { isNativeGoogleSignInSupported } from '@/services/auth/google-signin.availability';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let configured = false;
let googleSignInModule: GoogleSignInModule | null | undefined;

function loadGoogleSignInModule(): GoogleSignInModule | null {
  if (googleSignInModule !== undefined) {
    return googleSignInModule;
  }

  if (!isNativeGoogleSignInSupported()) {
    googleSignInModule = null;
    return null;
  }

  try {
    // Lazy require — avoids TurboModule crash in Expo Go at import time.
    googleSignInModule = require('@react-native-google-signin/google-signin') as GoogleSignInModule;
  } catch (error) {
    authLog.googleWarn('module.load_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    googleSignInModule = null;
  }

  return googleSignInModule;
}

/** Validates Google Sign-In env for native dev/EAS builds. */
export function assertGoogleSignInConfigured(): void {
  const { webClientId } = getGoogleSignInEnv();
  if (!webClientId) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Add your Google Cloud Web OAuth client ID to .env.',
    );
  }
}

/** One-time native Google Sign-In SDK configuration (dev client + EAS builds only). */
export function ensureGoogleSignInConfigured(): boolean {
  if (configured || Platform.OS === 'web' || !isNativeGoogleSignInSupported()) {
    return false;
  }

  const module = loadGoogleSignInModule();
  if (!module) return false;

  const { webClientId, iosClientId } = getGoogleSignInEnv();
  assertGoogleSignInConfigured();

  module.GoogleSignin.configure({
    webClientId: webClientId!,
    offlineAccess: false,
    ...(iosClientId ? { iosClientId } : {}),
  });
  configured = true;

  authLog.google('configure.completed', {
    platform: Platform.OS,
    hasIosClientId: Boolean(iosClientId),
  });

  return true;
}

/** Returns lazily loaded Google Sign-In module, or null in Expo Go / web. */
export function getGoogleSignInModule(): GoogleSignInModule | null {
  return loadGoogleSignInModule();
}

/** Clears Google Sign-In cached account (safe no-op when unavailable). */
export async function signOutGoogleNative(): Promise<void> {
  if (Platform.OS === 'web' || !isNativeGoogleSignInSupported()) return;

  const module = loadGoogleSignInModule();
  if (!module) return;

  try {
    ensureGoogleSignInConfigured();
    await module.GoogleSignin.signOut();
    authLog.google('sign_out.completed');
  } catch {
    // User may not have used Google — ignore.
  }
}
