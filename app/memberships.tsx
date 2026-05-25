import { Redirect } from 'expo-router';

import { useRequireCompletedProfile } from '@/hooks/useRequireCompletedProfile';
import { MemberHomeScreen } from '@/screens/member/MemberHomeScreen';
import { useAuthStore } from '@/store/auth.store';

export default function MembershipsRoute() {
  const session = useAuthStore((state) => state.session);
  const { isLoading, isProfileComplete } = useRequireCompletedProfile();
  if (!session) return <Redirect href="/auth/login?redirect=/memberships&intent=member_dashboard" />;
  if (isLoading) return null;
  if (!isProfileComplete) return <Redirect href="/profile-setup?redirect=/memberships" />;
  return <MemberHomeScreen />;
}

