import { ProtectedRoute } from '@/routing';
import { JoinRequestReviewScreen } from '@/screens/owner/JoinRequestReviewScreen';

export default function JoinRequestReviewRoute() {
  return (
    <ProtectedRoute
      redirectPath="/notifications"
      authIntent="owner_dashboard"
      requireProfile
      requireOwner
    >
      <JoinRequestReviewScreen />
    </ProtectedRoute>
  );
}
