import { ProtectedRoute, routes } from '@/routing';
import { MemberAttendanceHistoryScreen } from '@/screens/member/MemberAttendanceHistoryScreen';

export default function AttendanceHistoryRoute() {
  return (
    <ProtectedRoute redirectPath={routes.attendanceHistory} authIntent="member_dashboard" requireProfile>
      <MemberAttendanceHistoryScreen />
    </ProtectedRoute>
  );
}
