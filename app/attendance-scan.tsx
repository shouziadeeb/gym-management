import { ProtectedRoute, routes } from '@/routing';
import { MemberAttendanceScannerScreen } from '@/screens/member/MemberAttendanceScannerScreen';

export default function AttendanceScanRoute() {
  return (
    <ProtectedRoute redirectPath={routes.attendanceScan} authIntent="member_dashboard" requireProfile>
      <MemberAttendanceScannerScreen />
    </ProtectedRoute>
  );
}
