import { ProtectedRoute, routes } from '@/routing';
import { MembersScreen } from '@/screens/owner/MembersScreen';

export default function ManageMembersRoute() {
  return (
    <ProtectedRoute
      redirectPath={routes.manageMembers}
      authIntent="owner_dashboard"
      requireProfile
      requireOwner
    >
      <MembersScreen />
    </ProtectedRoute>
  );
}
