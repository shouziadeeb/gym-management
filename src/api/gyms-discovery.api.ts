import type { ExploreSortMode } from '@/constants/gym-discovery';

import type { PaginatedDiscoveryResult } from '@/domain/discovery/types';
import { supabase } from '@/lib/supabase';

import type { Gym } from '@/types/models';

import { GYM_HOME_CATALOG_LIMIT, GYM_NEAREST_FETCH_CAP } from '@/constants/gym-discovery';

export type ExploreFetchInput = {
  page: number;
  pageSize: number;
  search?: string | null;
  categories?: string[];
  ratingMin?: number;
  sort: ExploreSortMode;
};

/**
 * Normalize free-text fragments so malformed tokens never break `.or(...)` payloads.
 */
export function escapeSearchToken(raw: string | null | undefined): string {
  return (raw ?? '')
    .replace(/[%_,()"'`]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

/** Baseline selectable query enforcing marketplace visibility gates. */
function marketplaceQueryBuilder() {
  return supabase.from('gyms').select('*', { count: 'exact' }).eq('is_active', true);
}

function applySearchFilter(builder: ReturnType<typeof marketplaceQueryBuilder>, needle: string | null | undefined) {
  const token = escapeSearchToken(needle);

  if (token.length < 2) {
    return builder;
  }

  const pattern = `%${token}%`;
  return builder.or(`name.ilike.${pattern},description.ilike.${pattern}`);
}

function resolveServerOrdering(sort: ExploreSortMode): { column: 'created_at' | 'rating_avg' | 'popularity_score' | 'trending_score'; ascending: boolean } {
  if (sort === 'recommended') {
    return { column: 'popularity_score', ascending: false };
  }

  switch (sort) {
    case 'nearest':
      return { column: 'created_at', ascending: false }; // Fallback only — nearest mode should bypass SQL ordering.
    case 'top_rated':
      return { column: 'rating_avg', ascending: false };
    case 'popular':
      return { column: 'popularity_score', ascending: false };
    case 'trending':
      return { column: 'trending_score', ascending: false };
    case 'newest':
    default:
      return { column: 'created_at', ascending: false };
  }
}

export async function fetchDiscoveryCatalog(limit = GYM_HOME_CATALOG_LIMIT): Promise<Gym[]> {
  const { data, error } = await marketplaceQueryBuilder()
    .order('created_at', { ascending: false })
    .limit(Math.max(limit, 1));

  if (error) throw error;

  return (data ?? []) as Gym[];
}

export async function fetchGymsByIds(ids: readonly string[]): Promise<Gym[]> {
  if (!ids.length) return [];

  const { data, error } = await supabase.from('gyms').select('*').in('id', [...ids]);
  if (error) throw error;

  const gyms = (data ?? []) as Gym[];
  const ranking = new Map(ids.map((id, index) => [id, index]));

  return gyms.slice().sort((a, b) => (ranking.get(a.id) ?? 0) - (ranking.get(b.id) ?? 0));
}

export async function fetchGeocodableGyms(cap = GYM_NEAREST_FETCH_CAP): Promise<Gym[]> {
  const { data, error } = await marketplaceQueryBuilder()
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(Math.max(cap, 1));

  if (error) throw error;

  return (data ?? []) as Gym[];
}

export async function fetchExplorePage(input: ExploreFetchInput): Promise<PaginatedDiscoveryResult> {
  if (input.sort === 'nearest') {
    throw new Error('Nearest sort uses batched geo fetch — compose it in the client hook.');
  }

  const ordering = resolveServerOrdering(input.sort);
  const from = Math.max(input.page, 0) * input.pageSize;
  const to = from + input.pageSize - 1;

  let qb = marketplaceQueryBuilder();
  qb = applySearchFilter(qb, input.search ?? '');

  if (input.categories && input.categories.length) {
    qb = qb.overlaps('categories', input.categories);
  }

  const ratingThreshold = typeof input.ratingMin === 'number' && input.ratingMin > 0 ? input.ratingMin : null;

  if (ratingThreshold !== null) {
    qb = qb.gte('rating_avg', ratingThreshold);
  }

  qb = qb.order(ordering.column, { ascending: ordering.ascending });

  const { data, error, count } = await qb.range(from, to);
  if (error) throw error;

  return { items: (data ?? []) as Gym[], total: count };
}
