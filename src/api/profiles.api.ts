import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

/**
 * Phone-auth users created before the DB migration may lack a profiles row.
 * gyms.owner_id FK requires profiles.id — without it PostgREST returns 409.
 */
export async function ensureProfileForUser(user: User): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return;

  const phone = user.phone ?? null;
  const fullName =
    (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ?? null;

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