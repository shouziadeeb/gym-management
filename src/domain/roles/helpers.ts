import type { RoleGuardContext } from '@/domain/roles/types';

export function isGymOwnerAccount(context: RoleGuardContext): boolean {
  if (context.accountType === 'gym_owner') return true;
  if (context.role === 'owner') return true;
  return (context.ownedGymCount ?? 0) > 0;
}

export function canAccessOwnerDashboard(context: RoleGuardContext): boolean {
  return isGymOwnerAccount(context);
}
