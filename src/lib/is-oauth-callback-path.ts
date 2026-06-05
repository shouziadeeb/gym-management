import { Platform } from 'react-native';

/** True when the browser URL is the OAuth callback route (works before Expo Router segments resolve). */
export function isOAuthCallbackPath(): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.pathname.includes('/auth/callback');
  }
  return false;
}
