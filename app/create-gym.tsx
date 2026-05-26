import { ProtectedRoute, routes } from '@/routing';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';

export default function CreateGymRoute() {
  return (
    <ProtectedRoute
      redirectPath={routes.createGym}
      authIntent="create_gym"
      requireProfile
      loadingVariant="spinner"
    >
      <OnboardingScreen />
    </ProtectedRoute>
  );
}
