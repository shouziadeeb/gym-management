import { QUERY_RETRY_COUNT, QUERY_STALE_TIME_MS } from '@/constants/query';

export const queryKeys = {
  gyms: {
    all: ['gyms'] as const,
    publicList: ['gyms', 'public'] as const,
    discoveryCatalog: (limit?: number) => ['gyms', 'discovery', 'catalog', limit ?? 'default'] as const,
    exploreInfinite: (filtersKey: string) => ['gyms', 'discovery', 'explore', filtersKey] as const,
    nearestBatch: (coordsKey?: string | null) => ['gyms', 'discovery', 'nearest', coordsKey ?? 'anon'] as const,
    gymsByIds: (idsHash: string) => ['gyms', 'discovery', 'byIds', idsHash] as const,
    owned: (userId?: string) => ['gyms', 'owned', userId] as const,
    member: (userId?: string) => ['gyms', 'member', userId] as const,
    byId: (gymId?: string) => ['gyms', 'detail', gymId] as const,
  },
  members: {
    list: (gymId?: string) => ['members', gymId] as const,
    history: (userId?: string) => ['members', 'history', userId] as const,
    ownerSearch: (gymId?: string, search?: string, status?: string, page?: number, pageSize?: number) =>
      ['members', 'owner', gymId, search ?? '', status ?? 'all', page ?? 1, pageSize ?? 20] as const,
    ownerSummary: (gymId?: string) => ['members', 'owner', 'summary', gymId] as const,
    ownerCandidates: (gymId?: string, search?: string, page?: number, pageSize?: number) =>
      ['members', 'owner', 'candidates', gymId, search ?? '', page ?? 1, pageSize ?? 20] as const,
    memberRequests: (memberId?: string) => ['members', 'requests', memberId] as const,
  },
  payments: {
    list: (gymId?: string) => ['payments', gymId] as const,
  },
  memberships: {
    byUser: (gymId?: string, userId?: string) => ['membership', gymId, userId] as const,
    byGym: (gymId?: string) => ['membership', 'gym', gymId] as const,
    renewalsByMember: (gymId?: string, memberId?: string) => ['membership', 'renewals', gymId, memberId] as const,
  },
  profile: {
    me: (userId?: string) => ['profile', userId] as const,
  },
  discovery: {
    signals: (userId?: string) => ['discovery', 'signals', userId] as const,
    preferences: (userId?: string) => ['discovery', 'preferences', userId] as const,
  },
  gymFollows: {
    byUser: (userId?: string) => ['gymFollows', 'user', userId] as const,
  },
  attendance: {
    settings: (gymId?: string) => ['attendance', 'settings', gymId] as const,
    today: (gymId?: string, date?: string) => ['attendance', 'today', gymId, date ?? 'today'] as const,
    ownerHistory: (gymId?: string, filtersKey?: string, page?: number) =>
      ['attendance', 'owner', gymId, filtersKey ?? 'all', page ?? 1] as const,
    memberHistory: (gymId?: string, page?: number) => ['attendance', 'member', gymId ?? 'all', page ?? 1] as const,
  },
  config: {
    staleTime: QUERY_STALE_TIME_MS,
    retry: QUERY_RETRY_COUNT,
  },
};