import { Platform } from 'react-native';

import { AUTH_STORAGE_KEY } from '@/lib/auth-storage';

const OAUTH_PENDING_KEY = 'gym_oauth_pending';

/**
 * Removes legacy Supabase auth keys that can conflict with `gym-auth`.
 * Skips during OAuth callbacks to avoid disrupting PKCE session exchange.
 */
export function clearLegacyWebAuthStorage(): void {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
    return;
  }

  // Skip clearing during OAuth callback - these keys are needed for session exchange
  if (typeof window !== 'undefined' && window.location.pathname.includes('/auth/callback')) {
    return;
  }

  // Remove old sb-* session keys from previous/abandoned auth flows
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key !== AUTH_STORAGE_KEY) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Silently fail if key is protected or quota exceeded
      }
    }
  }
}

export function clearOAuthPendingStorage(): void {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(OAUTH_PENDING_KEY);
  }
}

/** Strip OAuth query params so refresh does not re-trigger exchange. */
export function cleanOAuthCallbackUrl(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  window.history.replaceState({}, document.title, window.location.pathname);
}
