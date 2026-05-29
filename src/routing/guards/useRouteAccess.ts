import { useMemo } from 'react';

import { useRequireCompletedProfile } from '@/hooks/useRequireCompletedProfile';
import { useRequireOwner } from '@/hooks/useRequireOwner';
import { ownerUnauthorizedFallback } from '@/routing/constants';
import type { AuthIntent } from '@/store/auth-intent.store';
import { useAuthStore } from '@/store/auth.store';

export type RouteAccessOptions = {
  /** Path the user should return to after auth or profile setup. */
  redirectPath: string;
  authIntent: AuthIntent;
  requireProfile?: boolean;
  requireOwner?: boolean;
  /** Wait for auth bootstrap before evaluating session (tab routes). */
  waitForAuthInit?: boolean;
  /** Where to send users who fail the owner check. */
  unauthorizedFallback?: string;
};

export type RouteRedirect =
  | { kind: 'login'; redirectPath: string; intent: AuthIntent }
  | { kind: 'profile-setup'; redirectPath: string }
  | { kind: 'href'; href: string };

export type RouteAccessResult =
  | { status: 'loading' }
  | { status: 'redirect'; redirect: RouteRedirect }
  | { status: 'ready' };

export function useRouteAccess(options: RouteAccessOptions): RouteAccessResult {
  const {
    redirectPath,
    authIntent,
    requireProfile = false,
    requireOwner = false,
    waitForAuthInit = false,
    unauthorizedFallback = ownerUnauthorizedFallback,
  } = options;

  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);
  const profileGuard = useRequireCompletedProfile();
  const ownerGuard = useRequireOwner();

  return useMemo(() => {
    if (waitForAuthInit && !initialized) {
      return { status: 'loading' as const };
    }

    if (!session) {
      return {
        status: 'redirect' as const,
        redirect: { kind: 'login' as const, redirectPath, intent: authIntent },
      };
    }

    const isLoading = profileGuard.isLoading || (requireOwner && ownerGuard.isLoading);
    if (isLoading) {
      return { status: 'loading' as const };
    }

    if (requireProfile && !profileGuard.isProfileComplete) {
      return {
        status: 'redirect' as const,
        redirect: { kind: 'profile-setup' as const, redirectPath },
      };
    }

    if (requireOwner && !ownerGuard.isOwner) {
      return {
        status: 'redirect' as const,
        redirect: { kind: 'href' as const, href: unauthorizedFallback },
      };
    }

    return { status: 'ready' as const };
  }, [
    waitForAuthInit,
    initialized,
    session,
    profileGuard.isLoading,
    profileGuard.isProfileComplete,
    ownerGuard.isLoading,
    ownerGuard.isOwner,
    redirectPath,
    authIntent,
    requireProfile,
    requireOwner,
    unauthorizedFallback,
  ]);
}
