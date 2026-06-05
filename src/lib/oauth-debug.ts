import { Platform } from 'react-native';

import { AUTH_STORAGE_KEY, createAuthStorage } from '@/lib/auth-storage';

const PREFIX = '[OAuth Debug]';

export type OAuthStorageSnapshot = {
  allKeys: string[];
  pkceRelatedKeys: string[];
  values: Record<string, string | null>;
  storageAdapter: 'localStorage' | 'asyncStorage' | 'unknown';
  authStorageKey: string;
  codeVerifierKey: string;
  hasCodeVerifier: boolean;
};

function isPkceRelatedKey(key: string): boolean {
  return (
    key.startsWith('sb-') ||
    key.includes('pkce') ||
    key.includes('code-verifier') ||
    key.includes('verifier') ||
    key === AUTH_STORAGE_KEY ||
    key.startsWith('gym')
  );
}

/** Temporary OAuth/PKCE diagnostics (dev only). */
export function logOAuthDebug(phase: string, meta?: Record<string, unknown>): void {
  if (!__DEV__) return;
  if (meta) {
    console.log(PREFIX, phase, meta);
  } else {
    console.log(PREFIX, phase);
  }
}

/** Snapshot localStorage keys relevant to Supabase PKCE (web only). */
export function snapshotOAuthStorage(label: string): OAuthStorageSnapshot | null {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
    logOAuthDebug(`${label}:storage`, { note: 'not web or no localStorage' });
    return null;
  }

  const allKeys = Object.keys(localStorage);
  const pkceRelatedKeys = allKeys.filter(isPkceRelatedKey);
  const values: Record<string, string | null> = {};

  for (const key of allKeys) {
    if (isPkceRelatedKey(key)) {
      values[key] = localStorage.getItem(key);
    }
  }

  const codeVerifierKey = `${AUTH_STORAGE_KEY}-code-verifier`;
  const snapshot: OAuthStorageSnapshot = {
    allKeys,
    pkceRelatedKeys,
    values,
    storageAdapter:
      createAuthStorage() === localStorage ? 'localStorage' : 'asyncStorage',
    authStorageKey: AUTH_STORAGE_KEY,
    codeVerifierKey,
    hasCodeVerifier: Boolean(localStorage.getItem(codeVerifierKey)),
  };

  logOAuthDebug(`${label}:storage`, snapshot);
  return snapshot;
}

export function logSupabaseAuthConfig(): void {
  const storage = createAuthStorage();
  logOAuthDebug('supabase.auth.config', {
    storageAdapter:
      Platform.OS === 'web' && typeof window !== 'undefined' && storage === window.localStorage
        ? 'localStorage (createAuthStorage)'
        : 'AsyncStorage (createAuthStorage)',
    storageKey: AUTH_STORAGE_KEY,
    codeVerifierKey: `${AUTH_STORAGE_KEY}-code-verifier`,
    detectSessionInUrl: false,
    flowType: 'pkce',
    note: 'detectSessionInUrl must stay false while we exchange manually on /auth/callback',
  });
}
