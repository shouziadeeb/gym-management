import { Redirect } from 'expo-router';

import { useRequireCompletedProfile } from '@/hooks/useRequireCompletedProfile';
import { OwnerDashboardScreen } from '@/screens/owner/OwnerDashboardScreen';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardRoute() {
  const session = useAuthStore((state) => state.session);
  const { isLoading, isProfileComplete } = useRequireCompletedProfile();
  if (!session) return <Redirect href="/auth/login?redirect=/dashboard&intent=owner_dashboard" />;
  if (isLoading) return null;
  if (!isProfileComplete) return <Redirect href="/profile-setup?redirect=/dashboard" />;
  return <OwnerDashboardScreen />;
}

