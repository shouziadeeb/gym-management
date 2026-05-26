import type { AccountType, UserRole } from '@/types/models';

export const ACCOUNT_TYPES = ['normal_user', 'gym_owner'] as const;
export const USER_ROLES = ['owner', 'member', 'trainer', 'staff', 'admin'] as const;

export type RoleGuardContext = {
  role: UserRole | null | undefined;
  accountType: AccountType | null | undefined;
  ownedGymCount?: number;
};
