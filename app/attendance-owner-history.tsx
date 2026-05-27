import { ProtectedRoute, routes } from '@/routing';
import { OwnerAttendanceHistoryScreen } from '@/screens/owner/OwnerAttendanceHistoryScreen';

export default function AttendanceOwnerHistoryRoute() {
  return (
    <ProtectedRoute
      redirectPath={routes.attendanceOwnerHistory}
      authIntent="owner_dashboard"
      requireProfile
      requireOwner
    >
      <OwnerAttendanceHistoryScreen />
    </ProtectedRoute>
  );
}
