import { router } from 'expo-router';
import { Platform } from 'react-native';

import { authNavigate } from '@/lib/auth-navigate';
import type { AuthScreenMode } from '@/services/auth/auth.types';

/** After auth success: signup → onboarding; login → redirect or home. */
export function postAuthNavigate(
  mode: AuthScreenMode,
  redirect?: string,
  authMethod?: 'phone' | 'email' | 'google' | null,
) {
  const targetRedirect = typeof redirect === 'string' && redirect.length > 0 ? redirect : '/';
  if (mode === 'signup') {
    if (authMethod === 'email') {
      const href = '/profile';
      if (Platform.OS === 'web') {
        authNavigate(href);
        return;
      }
      router.replace(href as never);
      return;
    }
    const href = `/profile-setup?redirect=${encodeURIComponent(targetRedirect)}`;
    if (Platform.OS === 'web') {
      authNavigate(href);
      return;
    }
    router.replace(href as never);
    return;
  }

  const loginHref = targetRedirect === '/' ? '/profile-hub' : targetRedirect;
  if (Platform.OS === 'web') {
    authNavigate(loginHref);
    return;
  }
  router.replace(loginHref as never);
}
