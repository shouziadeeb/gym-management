import { ProtectedRoute, routes } from '@/routing';
import { UserProfileScreen } from '@/screens/profile/UserProfileScreen';

export default function ProfileRoute() {
  return (
    <ProtectedRoute redirectPath={routes.profile} authIntent="member_dashboard" requireProfile>
      <UserProfileScreen />
    </ProtectedRoute>
  );
}
