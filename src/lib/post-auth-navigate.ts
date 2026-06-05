import { router } from 'expo-router';
import { InteractionManager, Platform } from 'react-native';

import { authNavigate } from '@/lib/auth-navigate';
import { resolvePostAuthDestination } from '@/lib/oauth-finish';
import type { AuthScreenMode } from '@/services/auth/auth.types';

/** After auth success: signup → onboarding; login → redirect or home. */
export function postAuthNavigate(
  mode: AuthScreenMode,
  redirect?: string,
  authMethod?: 'phone' | 'email' | 'google' | null,
) {
  const href = resolvePostAuthDestination(mode, redirect, authMethod);

  if (Platform.OS === 'web') {
    authNavigate(href);
    return;
  }

  InteractionManager.runAfterInteractions(() => {
    router.replace(href as never);
  });
}
