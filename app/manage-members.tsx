import { Redirect } from 'expo-router';

import { useRequireCompletedProfile } from '@/hooks/useRequireCompletedProfile';
import { useRequireOwner } from '@/hooks/useRequireOwner';
import { MembersScreen } from '@/screens/owner/MembersScreen';
import { useAuthStore } from '@/store/auth.store';

export default function ManageMembersRoute() {
  const session = useAuthStore((state) => state.session);
  const { isLoading, isProfileComplete } = useRequireCompletedProfile();
  const ownerGuard = useRequireOwner();
  if (!session) return <Redirect href="/auth/login?redirect=/manage-members&intent=owner_dashboard" />;
  if (isLoading || ownerGuard.isLoading) return null;
  if (!isProfileComplete) return <Redirect href="/profile-setup?redirect=/manage-members" />;
  if (!ownerGuard.isOwner) return <Redirect href="/(tabs)/profile-hub" />;
  return <MembersScreen />;
}

