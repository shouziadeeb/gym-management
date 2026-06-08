import { ActivityIndicator, View } from 'react-native';

import { ProtectedRoute, routes } from '@/routing';
import { TabScannerScreen } from '@/screens/scanner/TabScannerScreen';
import { ScannerGuestScreen } from '@/screens/scanner/ScannerGuestScreen';
import { useAuthStore } from '@/store/auth.store';

/** Center scanner tab — guest prompt or role-based scan / QR screen. */
export default function ScannerTabRoute() {
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
    return <ScannerGuestScreen />;
  }

  return (
    <ProtectedRoute
      redirectPath={routes.scanner}
      authIntent="member_dashboard"
      requireProfile
      loadingVariant="spinner"
    >
      <TabScannerScreen />
    </ProtectedRoute>
  );
}
