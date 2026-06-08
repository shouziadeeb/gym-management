import { router } from 'expo-router';

import { type AuthIntent } from '@/store/auth-intent.store';

function getIntentRedirectPath(intent: AuthIntent, redirectOverride?: string): string {
  if (redirectOverride && redirectOverride.startsWith('/')) {
    return redirectOverride;
  }

  switch (intent) {
    case 'create_gym':
      return '/create-gym';
    case 'owner_dashboard':
      return '/dashboard';
    case 'join_gym':
      return redirectOverride ?? '/(tabs)/memberships';
    case 'buy_membership':
    case 'member_dashboard':
      return '/(tabs)/memberships';
    case 'profile':
      return '/profile-setup';
    default:
      return '/';
  }
}

export function navigateToAuthWithIntent(intent: AuthIntent, redirectOverride?: string): void {
  const redirect = getIntentRedirectPath(intent, redirectOverride);
  router.push({ pathname: '/auth/login', params: { redirect, intent } });
}

