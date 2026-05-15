import { QUERY_RETRY_COUNT, QUERY_STALE_TIME_MS } from '@/constants/query';

export const queryKeys = {
  gyms: {
    all: ['gyms'] as const,
    owned: (userId?: string) => ['gyms', 'owned', userId] as const,
    member: (userId?: string) => ['gyms', 'member', userId] as const,
  },
  members: {
    list: (gymId?: string) => ['members', gymId] as const,
  },
  payments: {
    list: (gymId?: string) => ['payments', gymId] as const,
  },
  memberships: {
    byUser: (gymId?: string, userId?: string) => ['membership', gymId, userId] as const,
  },
  config: {
    staleTime: QUERY_STALE_TIME_MS,
    retry: QUERY_RETRY_COUNT,
  },
};