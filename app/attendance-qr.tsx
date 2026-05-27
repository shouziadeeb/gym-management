import { ProtectedRoute, routes } from '@/routing';
import { OwnerAttendanceQrScreen } from '@/screens/owner/OwnerAttendanceQrScreen';

export default function AttendanceQrRoute() {
  return (
    <ProtectedRoute
      redirectPath={routes.attendanceQr}
      authIntent="owner_dashboard"
      requireProfile
      requireOwner
    >
      <OwnerAttendanceQrScreen />
    </ProtectedRoute>
  );
}
