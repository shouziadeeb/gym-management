import { ProtectedRoute, routes } from '@/routing';
import { OwnerAttendanceDashboardScreen } from '@/screens/owner/OwnerAttendanceDashboardScreen';

export default function AttendanceRoute() {
  return (
    <ProtectedRoute
      redirectPath={routes.attendance}
      authIntent="owner_dashboard"
      requireProfile
      requireOwner
    >
      <OwnerAttendanceDashboardScreen />
    </ProtectedRoute>
  );
}
