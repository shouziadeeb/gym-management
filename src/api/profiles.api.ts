import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/models';

import { supabase } from '@/lib/supabase';

/**
 * Phone-auth users created before the DB migration may lack a profiles row.
 * gyms.owner_id FK requires profiles.id — without it PostgREST returns 409.
 */
export async function ensureProfileForUser(user: User): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id, phone')
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  const metadataPhone =
    typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : null;
  const emailPhone =
    typeof user.email === 'string' && user.email.endsWith('@app.local') ? user.email.split('@')[0] : null;
  const phone = user.phone ?? metadataPhone ?? (emailPhone ? `+${emailPhone}` : null);
  const fullName =
    (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ?? null;

  if (existing) {
    // Keep phone in sync for auth providers that store phone only in user_metadata.
    if (!existing.phone && phone) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone })
        .eq('id', user.id)
        .is('phone', null);
      if (updateError) throw updateError;
    }
    return;
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    phone,
    full_name: fullName,
    role: 'member',
  });

  if (insertError) {
    // Race: another request or trigger created the row
    if (insertError.code === '23505') return;
    throw insertError;
  }
}

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export type UpdateMyProfileInput = {
  full_name: string;
  gender: Profile['gender'];
  age: number | null;
  date_of_birth: string | null;
  fitness_goal: string | null;
  city: string | null;
  onboarding_completed: boolean;
};

export async function updateMyProfile(userId: string, payload: UpdateMyProfileInput): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select('*').single();
  if (error) throw error;
  return data as Profile;
}