import { supabase } from '@/lib/supabase';
import type { AccountType } from '@/types/models';

export type GymMemberRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export type OwnerMemberCandidate = {
  profile_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: AccountType;
  request_status: GymMemberRequestStatus | null;
  request_id: string | null;
  is_member: boolean;
  total_count: number;
};

export type MemberIncomingRequest = {
  id: string;
  gym_id: string;
  owner_id: string;
  member_id: string;
  status: GymMemberRequestStatus;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  gym_name?: string;
  owner_name?: string;
  owner_phone?: string | null;
};

export async function fetchOwnerMemberCandidates(input: {
  gymId: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: OwnerMemberCandidate[]; total: number }> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
  const { data, error } = await supabase.rpc('get_owner_member_candidates', {
    p_gym_id: input.gymId,
    p_search: input.search?.trim() || null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });

  if (error) throw error;
  const rows = (data ?? []) as OwnerMemberCandidate[];
  const total = rows[0]?.total_count ? Number(rows[0].total_count) : 0;
  return { rows, total };
}

export async function createMemberRequest(input: {
  gymId: string;
  ownerId: string;
  memberId: string;
  planType?: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
}): Promise<void> {
  const { error } = await supabase.from('gym_member_requests').upsert(
    {
      gym_id: input.gymId,
      owner_id: input.ownerId,
      member_id: input.memberId,
      plan_type: input.planType ?? 'monthly',
      status: 'pending',
      responded_at: null,
    },
    { onConflict: 'gym_id,member_id' },
  );
  if (error) throw error;
}

export async function fetchIncomingMemberRequests(memberId: string): Promise<MemberIncomingRequest[]> {
  const { data, error } = await supabase
    .from('gym_member_requests')
    .select('id, gym_id, owner_id, member_id, status, created_at, updated_at, responded_at, gyms(name)')
    .eq('member_id', memberId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const baseRows = (data ?? []).map((row) => ({
    id: row.id as string,
    gym_id: row.gym_id as string,
    owner_id: row.owner_id as string,
    member_id: row.member_id as string,
    status: row.status as GymMemberRequestStatus,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    responded_at: (row.responded_at as string | null) ?? null,
    gym_name: (row.gyms as { name?: string } | null)?.name ?? 'Gym',
  }));

  const ownerIds = [...new Set(baseRows.map((row) => row.owner_id).filter(Boolean))];
  let ownerById = new Map<string, { full_name: string | null; phone: string | null }>();

  if (ownerIds.length > 0) {
    const { data: ownerRows, error: ownerError } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', ownerIds);

    if (ownerError) throw ownerError;
    ownerById = new Map(
      (ownerRows ?? []).map((owner) => [owner.id as string, { full_name: (owner.full_name as string | null) ?? null, phone: (owner.phone as string | null) ?? null }]),
    );
  }

  return baseRows.map((row) => {
    const owner = ownerById.get(row.owner_id);
    return {
      ...row,
      owner_name: owner?.full_name ?? 'Gym Owner',
      owner_phone: owner?.phone ?? null,
    };
  });
}

export async function respondToMemberRequest(requestId: string, decision: 'accepted' | 'rejected'): Promise<void> {
  const { error } = await supabase.rpc('respond_to_gym_member_request', {
    p_request_id: requestId,
    p_decision: decision,
  });
  if (error) throw error;
}
