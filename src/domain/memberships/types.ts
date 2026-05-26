import type { MembershipStatus } from '@/types/models';

export const MEMBERSHIP_PLAN_TYPES = ['monthly', 'quarterly', 'half_yearly', 'yearly'] as const;
export type MembershipPlanType = (typeof MEMBERSHIP_PLAN_TYPES)[number];

export const MEMBERSHIP_PAYMENT_STATUSES = ['paid', 'pending', 'failed', 'waived'] as const;
export type MembershipPaymentStatus = (typeof MEMBERSHIP_PAYMENT_STATUSES)[number];

export const MEMBERSHIP_EXPIRING_SOON_DAYS = 3;

export type MembershipLifecycleRecord = {
  id: string;
  gym_id: string;
  member_id: string;
  plan_type: MembershipPlanType;
  start_date: string;
  expiry_date: string;
  status: MembershipStatus;
  payment_status: MembershipPaymentStatus;
  created_at: string;
  starts_at?: string | null;
  ends_at?: string | null;
  renewed_at?: string | null;
};

export type MembershipRenewalRecord = {
  id: string;
  membership_id: string;
  gym_id: string;
  member_id: string;
  previous_start_date: string;
  previous_expiry_date: string;
  new_start_date: string;
  new_expiry_date: string;
  plan_type: MembershipPlanType;
  payment_status: MembershipPaymentStatus;
  amount_cents: number | null;
  currency: string;
  renewed_at: string;
  metadata: Record<string, unknown>;
};

export type MembershipDashboardFilter = 'all' | 'active' | 'expiring_soon' | 'expired';

export type MembershipDashboardSort = 'expiry_nearest' | 'recently_joined';
