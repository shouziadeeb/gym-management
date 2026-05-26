import { renewMembershipLifecycle } from '@/api/membership-lifecycle.api';
import type { Membership } from '@/types/models';
import { supabase } from '@/lib/supabase';

export async function fetchMembershipForUser(gymId: string, userId: string): Promise<Membership | null> {
  const { data, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('gym_id', gymId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Membership | null;
}

export async function renewMembership(membershipId: string, months: number): Promise<Membership> {
  const { data: row, error: readError } = await supabase.from('memberships').select('*').eq('id', membershipId).single();
  if (readError) throw readError;

  const current = row as Membership;
  const planType = months >= 12 ? 'yearly' : months >= 3 ? 'quarterly' : 'monthly';
  return renewMembershipLifecycle({
    membershipId,
    gymId: current.gym_id,
    memberId: current.member_id || current.user_id,
    planType,
    paymentStatus: current.payment_status ?? 'paid',
  });
}