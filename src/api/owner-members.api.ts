import { supabase } from '@/lib/supabase';
import type { MembershipStatus } from '@/types/models';

export type OwnerMemberStatusFilter = 'all' | 'active' | 'expiring_soon' | 'expired';

export type OwnerMemberCard = {
  membership_link_id: string;
  gym_id: string;
  member_id: string;
  member_name: string | null;
  member_phone: string | null;
  avatar_url: string | null;
  joined_at: string;
  membership_id: string | null;
  membership_status: MembershipStatus | null;
  plan_type: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | null;
  payment_status: 'paid' | 'pending' | 'failed' | 'waived' | null;
  expiry_date: string | null;
  remaining_days: number | null;
  total_count: number;
};

export type OwnerMemberSummary = {
  total_members: number;
  active_memberships: number;
  expiring_memberships: number;
  expired_memberships: number;
};

export type FetchOwnerMembersInput = {
  gymId: string;
  search?: string;
  status?: OwnerMemberStatusFilter;
  page?: number;
  pageSize?: number;
};

export async function fetchOwnerGymMemberSummary(gymId: string): Promise<OwnerMemberSummary> {
  const { data, error } = await supabase.rpc('get_owner_gym_member_summary', { p_gym_id: gymId });
  if (error) throw error;

  const summary = Array.isArray(data) && data[0] ? data[0] : null;
  return {
    total_members: Number(summary?.total_members ?? 0),
    active_memberships: Number(summary?.active_memberships ?? 0),
    expiring_memberships: Number(summary?.expiring_memberships ?? 0),
    expired_memberships: Number(summary?.expired_memberships ?? 0),
  };
}

export async function fetchOwnerGymMembers(input: FetchOwnerMembersInput): Promise<{ rows: OwnerMemberCard[]; total: number }> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
  const status: MembershipStatus | null = input.status && input.status !== 'all' ? input.status : null;

  const { data, error } = await supabase.rpc('get_owner_gym_members', {
    p_gym_id: input.gymId,
    p_search: input.search?.trim() || null,
    p_status: status,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });

  if (error) throw error;
  const rows = (data ?? []) as OwnerMemberCard[];
  const total = rows[0]?.total_count ? Number(rows[0].total_count) : 0;
  return { rows, total };
}
