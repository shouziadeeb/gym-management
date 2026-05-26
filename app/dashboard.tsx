import { ProtectedRoute, routes } from '@/routing';
import { OwnerDashboardScreen } from '@/screens/owner/OwnerDashboardScreen';

export default function DashboardRoute() {
  return (
    <ProtectedRoute
      redirectPath={routes.dashboard}
      authIntent="owner_dashboard"
      requireProfile
      requireOwner
    >
      <OwnerDashboardScreen />
    </ProtectedRoute>
  );
}
