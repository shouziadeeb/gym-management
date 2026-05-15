import type { Gym } from '@/types/models';
import { getCurrentSession } from '@/services/auth/auth.service';
import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { supabase } from '@/lib/supabase';
import { isUniqueViolation } from '@/utils/supabase-errors';
import { buildGymSlug } from '@/utils/slug';
import { ensureProfileForUser } from '@/api/profiles.api';

const MAX_SLUG_RETRIES = 3;

export async function fetchOwnedGyms(ownerId: string): Promise<Gym[]> {
  const { data, error } = await supabase.from('gyms').select('*').eq('owner_id', ownerId).order('name');
  if (error) throw error;
  return (data ?? []) as Gym[];
}

export async function fetchMemberGyms(userId: string): Promise<Gym[]> {
  const { data, error } = await supabase
    .from('gym_memberships')
    .select('gyms(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('left_at', null);

  if (error) throw error;

  const rows = data as { gyms: Gym | Gym[] | null }[] | null;
  const list: Gym[] = [];

  for (const row of rows ?? []) {
    if (!row.gyms) continue;
    if (Array.isArray(row.gyms)) {
      for (const gym of row.gyms) list.push(gym);
    } else {
      list.push(row.gyms);
    }
  }

  return list;
}

export type CreateGymInput = {
  name: string;
  description?: string;
};

export async function createGym(input: CreateGymInput): Promise<Gym> {
  const session = await getCurrentSession();
  const user = session?.user;

  if (!user) {
    throw new Error('You must be signed in to create a gym.');
  }

  const name = input.name.trim();
  if (name.length < 2) {
    throw new Error('Gym name must be at least 2 characters.');
  }

  await ensureProfileForUser(user);

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt += 1) {
    const payload = {
      owner_id: user.id,
      name,
      description: input.description?.trim() || null,
      slug: buildGymSlug(name),
    };

    logger.info('createGym payload', { userId: user.id, payload, attempt });

    try {
      const data = await withRetry(async () => {
        const { data, error } = await supabase.from('gyms').insert(payload).select('*').single();
        if (error) throw error;
        return data;
      });

      return data as Gym;
    } catch (error) {
      lastError = error;

      if (isUniqueViolation(error)) {
        logger.warn('createGym slug collision, retrying', { slug: payload.slug, attempt });
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error('Could not create gym. Please try again.');
}

export async function updateGym(gymId: string, patch: Partial<Pick<Gym, 'name' | 'description' | 'address'>>) {
  const { data, error } = await supabase.from('gyms').update(patch).eq('id', gymId).select('*').single();
  if (error) throw error;
  return data as Gym;
}