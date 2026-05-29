/**
 * @file useRole.ts
 * Combines profile + owned gyms to expose owner/member role flags for guards and dashboards.
 */
import { canAccessOwnerDashboard, isGymOwnerAccount } from '@/domain/roles/helpers';
import type { RoleGuardContext } from '@/domain/roles/types';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useSession } from '@/hooks/useSession';
import { useUserGyms } from '@/hooks/useUserGyms';

/** Resolves global + gym-scoped role context for guards and UI. */
export function useRole() {
  const { user, isAuthenticated } = useSession();
  const profileQuery = useMyProfile();
  const { ownedGyms, memberGyms, isLoading: gymsLoading } = useUserGyms();

  const profile = profileQuery.data;
  const context: RoleGuardContext = {
    role: profile?.role ?? 'member',
    accountType: profile?.account_type ?? 'normal_user',
    ownedGymCount: ownedGyms.length,
  };

  return {
    userId: user?.id ?? null,
    isAuthenticated,
    profile,
    profileLoading: profileQuery.isLoading,
    gymsLoading,
    role: context.role,
    accountType: context.accountType,
    isGymOwner: isGymOwnerAccount(context),
    canAccessOwnerDashboard: canAccessOwnerDashboard(context),
    ownedGyms,
    memberGyms,
  };
}
