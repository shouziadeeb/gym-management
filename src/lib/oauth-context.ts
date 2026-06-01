import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthScreenMode } from '@/services/auth/auth.types';

const STORAGE_KEY = 'gym.oauth.pending';

export type PendingOAuthContext = {
  mode: AuthScreenMode;
  redirect?: string;
};

export async function stashPendingOAuthContext(context: PendingOAuthContext): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export async function popPendingOAuthContext(): Promise<PendingOAuthContext | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  await AsyncStorage.removeItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingOAuthContext;
  } catch {
    return null;
  }
}
