import { addMonths, parseISO } from 'date-fns';

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
  const currentEndDate = parseISO(current.ends_at);
  const renewFrom = currentEndDate > new Date() ? currentEndDate : new Date();
  const nextEndDate = addMonths(renewFrom, months);

  const { data, error } = await supabase
    .from('memberships')
    .update({
      ends_at: nextEndDate.toISOString(),
      renewed_at: new Date().toISOString(),
      status: 'active',
    })
    .eq('id', membershipId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Membership;
}