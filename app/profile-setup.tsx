import { Redirect } from 'expo-router';

import { ProfileSetupScreen } from '@/screens/onboarding/ProfileSetupScreen';
import { useAuthStore } from '@/store/auth.store';

export default function ProfileSetupRoute() {
  const session = useAuthStore((state) => state.session);
  if (!session) return <Redirect href="/auth/login?redirect=/profile-setup&intent=profile" />;
  return <ProfileSetupScreen />;
}

