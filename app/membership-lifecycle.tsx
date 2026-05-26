import { ProtectedRoute, routes } from '@/routing';
import { MembershipLifecycleScreen } from '@/screens/owner/MembershipLifecycleScreen';

export default function MembershipLifecycleRoute() {
  return (
    <ProtectedRoute
      redirectPath={routes.membershipLifecycle}
      authIntent="owner_dashboard"
      requireProfile
      requireOwner
    >
      <MembershipLifecycleScreen />
    </ProtectedRoute>
  );
}
