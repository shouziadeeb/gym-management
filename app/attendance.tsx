import { ProtectedRoute, routes } from '@/routing';
import { OwnerAttendanceScreen } from '@/screens/owner/OwnerAttendanceScreen';

export default function AttendanceRoute() {
  return (
    <ProtectedRoute
      redirectPath={routes.attendance}
      authIntent="owner_dashboard"
      requireProfile
      requireOwner
    >
      <OwnerAttendanceScreen />
    </ProtectedRoute>
  );
}
