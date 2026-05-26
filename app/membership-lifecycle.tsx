import { Redirect } from 'expo-router';

import { useRequireCompletedProfile } from '@/hooks/useRequireCompletedProfile';
import { useRequireOwner } from '@/hooks/useRequireOwner';
import { MembershipLifecycleScreen } from '@/screens/owner/MembershipLifecycleScreen';
import { useAuthStore } from '@/store/auth.store';

export default function MembershipLifecycleRoute() {
  const session = useAuthStore((state) => state.session);
  const { isLoading, isProfileComplete } = useRequireCompletedProfile();
  const ownerGuard = useRequireOwner();
  if (!session) return <Redirect href="/auth/login?redirect=/membership-lifecycle&intent=owner_dashboard" />;
  if (isLoading || ownerGuard.isLoading) return null;
  if (!isProfileComplete) return <Redirect href="/profile-setup?redirect=/membership-lifecycle" />;
  if (!ownerGuard.isOwner) return <Redirect href="/(tabs)/profile-hub" />;
  return <MembershipLifecycleScreen />;
}
