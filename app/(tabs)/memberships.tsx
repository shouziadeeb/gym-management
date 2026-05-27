import { ProtectedRoute, routes } from '@/routing';
import { MemberHomeScreen } from '@/screens/member/MemberHomeScreen';

export default function MembershipsTabRoute() {
  return (
    <ProtectedRoute
      redirectPath={routes.memberships}
      authIntent="member_dashboard"
      requireProfile
      waitForAuthInit
      loadingVariant="spinner"
    >
      <MemberHomeScreen />
    </ProtectedRoute>
  );
}
