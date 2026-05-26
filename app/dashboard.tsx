import { Redirect } from 'expo-router';

import { useRequireCompletedProfile } from '@/hooks/useRequireCompletedProfile';
import { useRequireOwner } from '@/hooks/useRequireOwner';
import { OwnerDashboardScreen } from '@/screens/owner/OwnerDashboardScreen';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardRoute() {
  const session = useAuthStore((state) => state.session);
  const { isLoading, isProfileComplete } = useRequireCompletedProfile();
  const ownerGuard = useRequireOwner();
  if (!session) return <Redirect href="/auth/login?redirect=/dashboard&intent=owner_dashboard" />;
  if (isLoading || ownerGuard.isLoading) return null;
  if (!isProfileComplete) return <Redirect href="/profile-setup?redirect=/dashboard" />;
  if (!ownerGuard.isOwner) return <Redirect href="/(tabs)/profile-hub" />;
  return <OwnerDashboardScreen />;
}

