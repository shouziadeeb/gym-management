import { ActivityIndicator, View } from 'react-native';

import { useUserGyms } from '@/hooks/useUserGyms';
import { MemberAttendanceScannerScreen } from '@/screens/member/MemberAttendanceScannerScreen';
import { OwnerAttendanceQrScreen } from '@/screens/owner/OwnerAttendanceQrScreen';

/** Center tab: owners see gym attendance QR; members scan to check in. */
export function TabScannerScreen() {
  const { ownedGyms, isLoading } = useUserGyms();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator accessibilityLabel="Loading scanner" />
      </View>
    );
  }

  if (ownedGyms.length > 0) {
    return <OwnerAttendanceQrScreen />;
  }

  return <MemberAttendanceScannerScreen />;
}
