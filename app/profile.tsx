import { Redirect } from 'expo-router';

import { useRequireCompletedProfile } from '@/hooks/useRequireCompletedProfile';
import { MemberProfileScreen } from '@/screens/member/MemberProfileScreen';
import { useAuthStore } from '@/store/auth.store';

export default function ProfileRoute() {
  const session = useAuthStore((state) => state.session);
  const { isLoading, isProfileComplete } = useRequireCompletedProfile();
  if (!session) return <Redirect href="/auth/login?redirect=/profile&intent=member_dashboard" />;
  if (isLoading) return null;
  if (!isProfileComplete) return <Redirect href="/profile-setup?redirect=/profile" />;
  return <MemberProfileScreen />;
}

