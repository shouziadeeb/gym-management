/**
 * @file profiles.api.ts
 * Profile CRUD and auth-field sync (email, phone, provider) after hybrid OTP sign-in.
 */
import type { User } from '@supabase/supabase-js';
import type { ProfileAuthSyncInput } from '@/services/auth/auth.types';
import type { Profile } from '@/types/models';

import { buildDefaultDisplayName } from '@/domain/profiles';
import { supabase } from '@/lib/supabase';
import {
  detectAuthMethodFromUser,
  detectAuthProviderFromUser,
  isSyntheticBridgeEmail,
  phoneDigitsFromBridgeEmail,
  resolveRealEmail,
} from '@/services/auth/auth.utils';

/** Resolves E.164 phone from user metadata, bridge email, or legacy @app.local pseudo-email. */
function resolveAuthPhone(user: User, fallbackPhone?: string | null): string | null {
  const metadataPhone = typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : null;
  const bridgeDigits = user.email ? phoneDigitsFromBridgeEmail(user.email) : null;
  const legacyEmailPhone =
    typeof user.email === 'string' && user.email.endsWith('@app.local') ? user.email.split('@')[0] : null;
  const rawPhone =
    fallbackPhone ??
    user.phone ??
    metadataPhone ??
    (bridgeDigits ? `+${bridgeDigits.length === 10 ? '91' + bridgeDigits : bridgeDigits}` : null) ??
    (legacyEmailPhone ? `+${legacyEmailPhone}` : null);
  const normalized = rawPhone?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

/** Maps Supabase user to profile auth columns (method, provider, verified flags). */
export function buildProfileAuthSync(user: User, fallbackPhone?: string | null): ProfileAuthSyncInput {
  const phone = resolveAuthPhone(user, fallbackPhone);
  const email = resolveRealEmail(user);
  const auth_type = detectAuthMethodFromUser(user);
  const auth_provider = detectAuthProviderFromUser(user);

  return {
    auth_provider,
    auth_type,
    email,
    phone,
    email_verified: Boolean(user.email_confirmed_at) || Boolean(email && !isSyntheticBridgeEmail(user.email)),
    phone_verified: Boolean(user.phone_confirmed_at) || Boolean(phone),
    provider_metadata: {
      ...(typeof user.user_metadata === 'object' && user.user_metadata ? user.user_metadata : {}),
      last_synced_at: new Date().toISOString(),
    },
  };
}

/** Writes auth_provider, auth_type, verified flags, and metadata onto the profiles row. */
async function syncProfileAuthFields(user: User, fallbackPhone?: string | null): Promise<void> {
  const authSync = buildProfileAuthSync(user, fallbackPhone);
  const patch: Record<string, unknown> = {
    auth_provider: authSync.auth_provider,
    auth_type: authSync.auth_type,
    email_verified: authSync.email_verified,
    phone_verified: authSync.phone_verified,
    provider_metadata: authSync.provider_metadata,
  };

  if (authSync.email) patch.email = authSync.email;
  if (authSync.phone) patch.phone = authSync.phone;

  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) throw error;
}

/**
 * Phone-auth users created before the DB migration may lack a profiles row.
 * gyms.owner_id FK requires profiles.id — without it PostgREST returns 409.
 */
export async function ensureProfileForUser(user: User): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id, phone, full_name, email, auth_type')
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  const phone = resolveAuthPhone(user);
  const authSync = buildProfileAuthSync(user);
  const fullNameFromMetadata =
    typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
  const generatedName = buildDefaultDisplayName(phone, user.id);
  const fullName = fullNameFromMetadata || generatedName;

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (!existing.phone?.trim() && phone) patch.phone = phone;
    if (!existing.full_name?.trim()) patch.full_name = fullName;
    if (!existing.email?.trim() && authSync.email) patch.email = authSync.email;

    if (Object.keys(patch).length > 0) {
      const { error: updateError } = await supabase.from('profiles').update(patch).eq('id', user.id);
      if (updateError) throw updateError;
    }

    await syncProfileAuthFields(user, phone);
    return;
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    phone,
    full_name: fullName,
    email: authSync.email,
    role: 'member',
    auth_provider: authSync.auth_provider,
    auth_type: authSync.auth_type,
    email_verified: authSync.email_verified,
    phone_verified: authSync.phone_verified,
    provider_metadata: authSync.provider_metadata,
  });

  if (insertError) {
    if (insertError.code === '23505') return;
    throw insertError;
  }
}

export async function ensureProfileForUserWithPhone(user: User, fallbackPhone?: string | null): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id, phone, full_name, email, auth_type')
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  const phone = resolveAuthPhone(user, fallbackPhone);
  const authSync = buildProfileAuthSync(user, fallbackPhone);
  const fullNameFromMetadata =
    typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
  const generatedName = buildDefaultDisplayName(phone, user.id);
  const fullName = fullNameFromMetadata || generatedName;

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (!existing.phone?.trim() && phone) patch.phone = phone;
    if (!existing.full_name?.trim()) patch.full_name = fullName;
    if (!existing.email?.trim() && authSync.email) patch.email = authSync.email;

    if (Object.keys(patch).length > 0) {
      const { error: updateError } = await supabase.from('profiles').update(patch).eq('id', user.id);
      if (updateError) throw updateError;
    }

    await syncProfileAuthFields(user, phone);
    return;
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    phone,
    full_name: fullName,
    email: authSync.email,
    role: 'member',
    auth_provider: authSync.auth_provider,
    auth_type: authSync.auth_type,
    email_verified: authSync.email_verified,
    phone_verified: authSync.phone_verified,
    provider_metadata: authSync.provider_metadata,
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

  const insertRow = {
    id: userId,
    role: 'member' as const,
    auth_provider: 'phone' as const,
    auth_type: 'phone' as const,
    email_verified: false,
    phone_verified: false,
    provider_metadata: {},
    ...payload,
    home_latitude: payload.home_latitude ?? null,
    home_longitude: payload.home_longitude ?? null,
    home_location_label: payload.home_location_label ?? null,
  };

  const { data: inserted, error: insertError } = await supabase.from('profiles').insert(insertRow).select('*').single();

  if (!insertError && inserted) return inserted as Profile;

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
