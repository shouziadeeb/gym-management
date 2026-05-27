import { router } from 'expo-router';

import { type AuthIntent } from '@/store/auth-intent.store';

function getIntentRedirectPath(intent: AuthIntent): string {
  switch (intent) {
    case 'create_gym':
      return '/create-gym';
    case 'owner_dashboard':
      return '/dashboard';
    case 'join_gym':
    case 'buy_membership':
    case 'member_dashboard':
      return '/(tabs)/memberships';
    case 'profile':
      return '/profile-setup';
    default:
      return '/';
  }
}

export function navigateToAuthWithIntent(intent: AuthIntent): void {
  const redirect = getIntentRedirectPath(intent);
  router.push({ pathname: '/auth/login', params: { redirect, intent } });
}

