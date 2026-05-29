import { ActivityIndicator, View } from 'react-native';

import { ProtectedRoute, routes } from '@/routing';
import { MemberHomeScreen } from '@/screens/member/MemberHomeScreen';
import { MembershipGuestScreen } from '@/screens/member/MembershipGuestScreen';
import { useAuthStore } from '@/store/auth.store';

/** Memberships tab: guest UI when logged out; guarded member dashboard when signed in. */
export default function MembershipsTabRoute() {
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  if (!session) {
    return <MembershipGuestScreen />;
  }

  return (
    <ProtectedRoute
      redirectPath={routes.memberships}
      authIntent="member_dashboard"
      requireProfile
      loadingVariant="spinner"
    >
      <MemberHomeScreen />
    </ProtectedRoute>
  );
}
