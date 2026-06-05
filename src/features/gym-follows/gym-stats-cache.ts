import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/queries/keys';
import type { Gym } from '@/types/models';

export type GymStatsPatch = {
  followerCount?: number;
  activeMemberCount?: number;
};

function patchGymRow(gym: Gym, patch: GymStatsPatch): Gym {
  return {
    ...gym,
    follower_count: patch.followerCount ?? gym.follower_count ?? 0,
    active_member_count: patch.activeMemberCount ?? gym.active_member_count ?? 0,
  };
}

function mapGymList(gyms: Gym[], gymId: string, patch: GymStatsPatch): Gym[] {
  return gyms.map((gym) => (gym.id === gymId ? patchGymRow(gym, patch) : gym));
}

function patchCachedGymData(data: unknown, gymId: string, patch: GymStatsPatch): unknown {
  if (!data) return data;

  if (Array.isArray(data)) {
    return mapGymList(data as Gym[], gymId, patch);
  }

  if (typeof data === 'object' && 'pages' in data && Array.isArray((data as { pages: unknown }).pages)) {
    const infinite = data as { pages: { items: Gym[] }[] };
    return {
      ...infinite,
      pages: infinite.pages.map((page) => ({
        ...page,
        items: mapGymList(page.items ?? [], gymId, patch),
      })),
    };
  }

  if (typeof data === 'object' && 'id' in data && (data as Gym).id === gymId) {
    return patchGymRow(data as Gym, patch);
  }

  return data;
}

/** Patch follower/member counts across all cached gym queries in one pass. */
export function patchGymStatsInCache(queryClient: QueryClient, gymId: string, patch: GymStatsPatch) {
  queryClient.setQueriesData({ queryKey: ['gyms'] }, (data) => patchCachedGymData(data, gymId, patch));
}

export function patchFollowedIdsInCache(
  queryClient: QueryClient,
  userId: string | undefined,
  gymId: string,
  isFollowing: boolean,
) {
  if (!userId) return;

  queryClient.setQueryData<string[]>(queryKeys.gymFollows.byUser(userId), (current = []) => {
    if (isFollowing) {
      return current.includes(gymId) ? current : [gymId, ...current];
    }
    return current.filter((id) => id !== gymId);
  });
}

function readFollowerCount(queryClient: QueryClient, gymId: string): number {
  const detail = queryClient.getQueryData<Gym | null>(['gyms', 'detail', gymId]);
  if (detail && typeof detail.follower_count === 'number') {
    return detail.follower_count;
  }

  const queries = queryClient.getQueriesData<unknown>({ queryKey: ['gyms'] });
  for (const [, data] of queries) {
    if (!Array.isArray(data)) continue;
    const gym = (data as Gym[]).find((row) => row.id === gymId);
    if (gym && typeof gym.follower_count === 'number') {
      return gym.follower_count;
    }
  }

  return 0;
}

export function adjustFollowerCountInCache(queryClient: QueryClient, gymId: string, delta: number) {
  patchGymStatsInCache(queryClient, gymId, {
    followerCount: Math.max(0, readFollowerCount(queryClient, gymId) + delta),
  });
}
