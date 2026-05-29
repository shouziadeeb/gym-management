import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import {
  useRouteAccess,
  type RouteAccessOptions,
  type RouteRedirect,
} from '@/routing/guards/useRouteAccess';

type ProtectedRouteProps = RouteAccessOptions & {
  children: ReactNode;
  /** How to display guard loading state. */
  loadingVariant?: 'none' | 'spinner' | 'fullscreen';
};

/** Imperative navigation — Redirect from tabs crashes on native Android release builds. */
function navigateForRedirect(redirect: RouteRedirect): void {
  switch (redirect.kind) {
    case 'login':
      router.replace({
        pathname: '/auth/login',
        params: { redirect: redirect.redirectPath, intent: redirect.intent },
      } as never);
      break;
    case 'profile-setup':
      router.replace({
        pathname: '/profile-setup',
        params: { redirect: redirect.redirectPath },
      } as never);
      break;
    case 'href':
      router.replace(redirect.href as never);
      break;
  }
}

export function ProtectedRoute({
  children,
  loadingVariant = 'none',
  ...accessOptions
}: ProtectedRouteProps) {
  const access = useRouteAccess(accessOptions);
  const lastRedirectKey = useRef<string | null>(null);

  useEffect(() => {
    if (access.status !== 'redirect') {
      lastRedirectKey.current = null;
      return;
    }

    const key = JSON.stringify(access.redirect);
    if (lastRedirectKey.current === key) return;
    lastRedirectKey.current = key;

    navigateForRedirect(access.redirect);
  }, [access]);

  if (access.status === 'loading') {
    if (loadingVariant === 'fullscreen') {
      return <LoadingScreen />;
    }
    if (loadingVariant === 'spinner') {
      return (
        <View className="flex-1 items-center justify-center bg-transparent">
          <ActivityIndicator accessibilityLabel="Loading" />
        </View>
      );
    }
    return null;
  }

  if (access.status === 'redirect') {
    if (loadingVariant === 'fullscreen') {
      return <LoadingScreen />;
    }
    if (loadingVariant === 'spinner') {
      return (
        <View className="flex-1 items-center justify-center bg-transparent">
          <ActivityIndicator accessibilityLabel="Loading" />
        </View>
      );
    }
    return null;
  }

  return <>{children}</>;
}
