import { Redirect } from 'expo-router';

import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { useAuthStore } from '@/store/auth.store';

export default function CreateGymRoute() {
  const session = useAuthStore((state) => state.session);
  if (!session) return <Redirect href="/auth/login?redirect=/create-gym&intent=create_gym" />;
  return <OnboardingScreen />;
}

