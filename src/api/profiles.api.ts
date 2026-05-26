import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/models';

import { buildDefaultDisplayName } from '@/domain/profiles';
import { supabase } from '@/lib/supabase';

function resolveAuthPhone(user: User, fallbackPhone?: string | null): string | null {
  const metadataPhone = typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : null;
  const emailPhone =
    typeof user.email === 'string' && user.email.endsWith('@app.local') ? user.email.split('@')[0] : null;
  const rawPhone = fallbackPhone ?? user.phone ?? metadataPhone ?? (emailPhone ? `+${emailPhone}` : null);
  const normalized = rawPhone?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

/**
 * Phone-auth users created before the DB migration may lack a profiles row.
 * gyms.owner_id FK requires profiles.id — without it PostgREST returns 409.
 */
export async function ensureProfileForUser(user: User): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id, phone, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  const phone = resolveAuthPhone(user);
  const fullNameFromMetadata =
    typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
  const generatedName = buildDefaultDisplayName(phone, user.id);
  const fullName = fullNameFromMetadata || generatedName;

  if (existing) {
    const patch: { phone?: string; full_name?: string } = {};
    if (!existing.phone?.trim() && phone) patch.phone = phone;
    if (!existing.full_name?.trim()) patch.full_name = fullName;

    if (Object.keys(patch).length > 0) {
      const { error: updateError } = await supabase.from('profiles').update(patch).eq('id', user.id);
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

export async function ensureProfileForUserWithPhone(user: User, fallbackPhone?: string | null): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id, phone, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  const phone = resolveAuthPhone(user, fallbackPhone);
  const fullNameFromMetadata =
    typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
  const generatedName = buildDefaultDisplayName(phone, user.id);
  const fullName = fullNameFromMetadata || generatedName;

  if (existing) {
    const patch: { phone?: string; full_name?: string } = {};
    if (!existing.phone?.trim() && phone) patch.phone = phone;
    if (!existing.full_name?.trim()) patch.full_name = fullName;

    if (Object.keys(patch).length > 0) {
      const { error: updateError } = await supabase.from('profiles').update(patch).eq('id', user.id);
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
  phone: string | null;
  gender: Profile['gender'];
  age: number | null;
  date_of_birth: string | null;
  fitness_goal: string | null;
  city: string | null;
  home_latitude?: number | null;
  home_longitude?: number | null;
  home_location_label?: string | null;
  onboarding_completed: boolean;
};

export async function updateMyProfile(userId: string, payload: UpdateMyProfileInput): Promise<Profile> {
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (updateError) throw updateError;
  if (updated) return updated as Profile;

  // `.single()` fails with “Cannot coerce…” when UPDATE matches 0 rows. That happens when
  // auth.users exists but profiles was never inserted (skipped trigger / legacy signup).
  const insertRow = {
    id: userId,
    role: 'member' as const,
    ...payload,
    home_latitude: payload.home_latitude ?? null,
    home_longitude: payload.home_longitude ?? null,
    home_location_label: payload.home_location_label ?? null,
  };

  const { data: inserted, error: insertError } = await supabase.from('profiles').insert(insertRow).select('*').single();

  if (!insertError && inserted) return inserted as Profile;

  // Concurrent insert raced with us — row exists now; apply update once.
  if (insertError?.code === '23505') {
    const { data: retry, error: retryError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .maybeSingle();
    if (retryError) throw retryError;
    if (retry) return retry as Profile;
  }

  throw insertError ?? new Error('Failed to save profile');
}

export async function promoteToGymOwner(userId: string): Promise<void> {
  const { error } = await supabase.rpc('promote_user_to_gym_owner', { p_user_id: userId });
  if (error) throw error;
}