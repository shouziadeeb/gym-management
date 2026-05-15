import { addMonths } from 'date-fns';

import type { GymMembership, Membership, Profile } from '@/types/models';
import { supabase } from '@/lib/supabase';

export type MemberRow = {
  membership: GymMembership;
  profile: Pick<Profile, 'id' | 'full_name' | 'phone'> | null;
  subscription: Membership | null;
};

export async function fetchGymMemberRows(gymId: string): Promise<MemberRow[]> {
  const { data: links, error: linkError } = await supabase
    .from('gym_memberships')
    .select('*')
    .eq('gym_id', gymId)
    .is('left_at', null)
    .eq('is_active', true);

  if (linkError) throw linkError;

  const memberships = (links ?? []) as GymMembership[];
  if (memberships.length === 0) return [];

  const userIds = memberships.map((item) => item.user_id);

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', userIds);

  if (profilesError) throw profilesError;

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('memberships')
    .select('*')
    .eq('gym_id', gymId)
    .in('user_id', userIds);

  if (subscriptionsError) throw subscriptionsError;

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const membershipByUserId = new Map((subscriptions ?? []).map((membership) => [membership.user_id, membership]));

  return memberships.map((membership) => ({
    membership,
    profile: profileById.get(membership.user_id) ?? null,
    subscription: (membershipByUserId.get(membership.user_id) as Membership | undefined) ?? null,
  }));
}

export async function addMemberByPhone(gymId: string, ownerId: string, phone: string, months: number) {
  const normalizedPhone = phone.trim();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw new Error('No user with this phone. They must sign up first.');
  if (profile.id === ownerId) throw new Error('Owner is already part of the gym.');

  const { error: gymMembershipError } = await supabase.from('gym_memberships').upsert(
    {
      gym_id: gymId,
      user_id: profile.id,
      role_in_gym: 'member',
      is_active: true,
      left_at: null,
    },
    { onConflict: 'gym_id,user_id' },
  );

  if (gymMembershipError) throw gymMembershipError;

  const endsAt = addMonths(new Date(), months).toISOString();

  const { error: membershipError } = await supabase.from('memberships').upsert(
    {
      gym_id: gymId,
      user_id: profile.id,
      ends_at: endsAt,
      status: 'active',
    },
    { onConflict: 'gym_id,user_id' },
  );

  if (membershipError) throw membershipError;
}

export async function removeMemberFromGym(gymId: string, userId: string) {
  const { error } = await supabase
    .from('gym_memberships')
    .update({ is_active: false, left_at: new Date().toISOString() })
    .eq('gym_id', gymId)
    .eq('user_id', userId);

  if (error) throw error;
}