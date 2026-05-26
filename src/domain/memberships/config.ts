import type { MembershipDashboardFilter, MembershipDashboardSort, MembershipPlanType } from '@/domain/memberships/types';

export const MEMBERSHIP_DURATION_MONTHS: Record<MembershipPlanType, number> = {
  monthly: 1,
  quarterly: 3,
  half_yearly: 6,
  yearly: 12,
};

export const MEMBERSHIP_FILTER_OPTIONS: ReadonlyArray<{ id: MembershipDashboardFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'expiring_soon', label: 'Expiring' },
  { id: 'expired', label: 'Expired' },
];

export const MEMBERSHIP_SORT_OPTIONS: ReadonlyArray<{ id: MembershipDashboardSort; label: string }> = [
  { id: 'expiry_nearest', label: 'Expiry nearest first' },
  { id: 'recently_joined', label: 'Recently joined' },
];
