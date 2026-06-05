import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { AuthScreenMode } from '@/services/auth/auth.types';

const STORAGE_KEY = 'gym_oauth_pending';

export type OAuthPending = {
  mode: AuthScreenMode;
  redirect?: string;
};

async function writePending(pending: OAuthPending): Promise<void> {
  const payload = JSON.stringify(pending);
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, payload);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, payload);
}

async function readPending(): Promise<OAuthPending | null> {
  const raw =
    Platform.OS === 'web' && typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY)
      : await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as OAuthPending;
  } catch {
    return null;
  }
}

async function clearPending(): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Persist login/signup context before a web OAuth redirect unloads the page. */
export async function saveOAuthPending(pending: OAuthPending): Promise<void> {
  await writePending(pending);
}

/** Read pending OAuth context without clearing (check before navigating). */
export async function peekOAuthPending(): Promise<OAuthPending | null> {
  return readPending();
}

/** Read and clear pending OAuth navigation context on the callback route. */
export async function consumeOAuthPending(): Promise<OAuthPending | null> {
  const pending = await readPending();
  await clearPending();
  return pending;
}
