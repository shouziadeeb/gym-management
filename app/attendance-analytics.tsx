import { ProtectedRoute, routes } from '@/routing';
import { OwnerAttendanceAnalyticsScreen } from '@/screens/owner/OwnerAttendanceAnalyticsScreen';

export default function AttendanceAnalyticsRoute() {
  return (
    <ProtectedRoute
      redirectPath={routes.attendanceAnalytics}
      authIntent="owner_dashboard"
      requireProfile
      requireOwner
    >
      <OwnerAttendanceAnalyticsScreen />
    </ProtectedRoute>
  );
}
