import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useRouteAccess, type RouteAccessOptions } from '@/routing/guards/useRouteAccess';

type ProtectedRouteProps = RouteAccessOptions & {
  children: ReactNode;
  /** How to display guard loading state. */
  loadingVariant?: 'none' | 'spinner' | 'fullscreen';
};

export function ProtectedRoute({
  children,
  loadingVariant = 'none',
  ...accessOptions
}: ProtectedRouteProps) {
  const access = useRouteAccess(accessOptions);

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
    return <Redirect href={access.href} />;
  }

  return <>{children}</>;
}
