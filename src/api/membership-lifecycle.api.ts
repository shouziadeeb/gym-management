import { addMonths, format, parseISO } from 'date-fns';

import {
  calculateExpiryDate,
  getMembershipStatus,
  MEMBERSHIP_DURATION_MONTHS,
  type MembershipPaymentStatus,
  type MembershipPlanType,
  type MembershipRenewalRecord,
} from '@/domain/memberships';
import { supabase } from '@/lib/supabase';
import type { Membership } from '@/types/models';

export type UpsertMembershipInput = {
  gymId: string;
  memberId: string;
  planType: MembershipPlanType;
  paymentStatus?: MembershipPaymentStatus;
  startDate?: string;
};

export type RenewMembershipInput = {
  membershipId: string;
  gymId: string;
  memberId: string;
  planType: MembershipPlanType;
  paymentStatus?: MembershipPaymentStatus;
  amountCents?: number | null;
  currency?: string;
};

function todayDateIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function toStartOfDay(dateIso: string): string {
  return `${dateIso}T00:00:00.000Z`;
}

function toEndOfDay(dateIso: string): string {
  return `${dateIso}T23:59:59.000Z`;
}

export async function fetchGymMemberships(gymId: string): Promise<Membership[]> {
  const { data, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('gym_id', gymId)
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Membership[];
}

export async function fetchMembershipRenewals(gymId: string, memberId: string): Promise<MembershipRenewalRecord[]> {
  const { data, error } = await supabase
    .from('membership_renewals')
    .select('*')
    .eq('gym_id', gymId)
    .eq('member_id', memberId)
    .order('renewed_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as MembershipRenewalRecord[];
}

export async function upsertMembershipLifecycle(input: UpsertMembershipInput): Promise<Membership> {
  const startDate = input.startDate ?? todayDateIso();
  const expiryDate = calculateExpiryDate(startDate, input.planType);
  const status = getMembershipStatus(expiryDate);
  const paymentStatus = input.paymentStatus ?? 'paid';

  const { data, error } = await supabase
    .from('memberships')
    .upsert(
      {
        gym_id: input.gymId,
        user_id: input.memberId,
        member_id: input.memberId,
        plan_type: input.planType,
        payment_status: paymentStatus,
        start_date: startDate,
        expiry_date: expiryDate,
        starts_at: toStartOfDay(startDate),
        ends_at: toEndOfDay(expiryDate),
        status,
      },
      { onConflict: 'gym_id,user_id' },
    )
    .select('*')
    .single();

  if (error) throw error;
  return data as Membership;
}

export async function renewMembershipLifecycle(input: RenewMembershipInput): Promise<Membership> {
  const { data: currentRow, error: readError } = await supabase
    .from('memberships')
    .select('*')
    .eq('id', input.membershipId)
    .single();
  if (readError) throw readError;

  const current = currentRow as Membership;
  const now = new Date();
  const currentExpiry = parseISO(`${current.expiry_date}T23:59:59.000Z`);
  const nextStartDate = currentExpiry > now ? current.expiry_date : todayDateIso();
  const nextExpiryDate = calculateExpiryDate(nextStartDate, input.planType);
  const nextStatus = getMembershipStatus(nextExpiryDate);
  const paymentStatus = input.paymentStatus ?? 'paid';

  const { data, error } = await supabase
    .from('memberships')
    .update({
      plan_type: input.planType,
      payment_status: paymentStatus,
      start_date: nextStartDate,
      expiry_date: nextExpiryDate,
      starts_at: toStartOfDay(nextStartDate),
      ends_at: toEndOfDay(nextExpiryDate),
      renewed_at: now.toISOString(),
      status: nextStatus,
    })
    .eq('id', input.membershipId)
    .select('*')
    .single();

  if (error) throw error;

  const { error: renewalError } = await supabase.from('membership_renewals').insert({
    membership_id: input.membershipId,
    gym_id: input.gymId,
    member_id: input.memberId,
    previous_start_date: current.start_date,
    previous_expiry_date: current.expiry_date,
    new_start_date: nextStartDate,
    new_expiry_date: nextExpiryDate,
    plan_type: input.planType,
    payment_status: paymentStatus,
    amount_cents: input.amountCents ?? null,
    currency: input.currency ?? 'USD',
    metadata: {
      renewed_from_plan_type: current.plan_type,
      duration_months: MEMBERSHIP_DURATION_MONTHS[input.planType],
    },
  });

  if (renewalError) throw renewalError;

  return data as Membership;
}

export async function refreshGymMembershipStatuses(gymId: string): Promise<void> {
  const { error } = await supabase.rpc('refresh_membership_statuses', { p_gym_id: gymId });
  if (error) throw error;
}
