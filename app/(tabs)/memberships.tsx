import { Redirect } from 'expo-router';

import { useRequireCompletedProfile } from '@/hooks/useRequireCompletedProfile';
import { MemberHomeScreen } from '@/screens/member/MemberHomeScreen';
import { useAuthStore } from '@/store/auth.store';

export default function MembershipsTabRoute() {
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);
  const { isLoading, isProfileComplete } = useRequireCompletedProfile();

  if (!initialized) return null;
  if (!session) return <Redirect href="/auth/login?redirect=/memberships&intent=member_dashboard" />;
  if (isLoading) return null;
  if (!isProfileComplete) return <Redirect href="/profile-setup?redirect=/memberships" />;

  return <MemberHomeScreen />;
}

