import type { Payment } from '@/types/models';
import { supabase } from '@/lib/supabase';

export async function fetchPaymentsForGym(gymId: string, limit = 500): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('gym_id', gymId)
    .order('paid_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Payment[];
}

export async function recordManualPayment(input: {
  gymId: string;
  userId: string | null;
  membershipId: string | null;
  amountCents: number;
  currency?: string;
}) {
  const { error } = await supabase.from('payments').insert({
    gym_id: input.gymId,
    user_id: input.userId,
    membership_id: input.membershipId,
    amount_cents: input.amountCents,
    currency: input.currency ?? 'USD',
    provider: 'manual',
  });

  if (error) throw error;
}