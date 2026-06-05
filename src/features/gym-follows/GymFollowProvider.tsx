import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { fetchFollowedGymIds, followGym, unfollowGym } from '@/api/gym-followers.api';
import { queryKeys } from '@/api/queries/keys';
import {
  adjustFollowerCountInCache,
  patchFollowedIdsInCache,
  patchGymStatsInCache,
} from '@/features/gym-follows/gym-stats-cache';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

type GymFollowContextValue = {
  isFollowing: (gymId: string) => boolean;
  isPending: (gymId: string) => boolean;
  toggleFollow: (gymId: string) => void;
};

const GymFollowContext = createContext<GymFollowContextValue | null>(null);

function useGymStatsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('gym-stats')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'gyms' },
        (payload) => {
          const row = payload.new as {
            id?: string;
            follower_count?: number | null;
            active_member_count?: number | null;
          };
          if (!row.id) return;

          patchGymStatsInCache(queryClient, row.id, {
            followerCount: typeof row.follower_count === 'number' ? row.follower_count : undefined,
            activeMemberCount:
              typeof row.active_member_count === 'number' ? row.active_member_count : undefined,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function GymFollowProvider({ children }: { children: ReactNode }) {
  useGymStatsRealtime();

  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.session?.user.id);
  const [pendingGymId, setPendingGymId] = useState<string | null>(null);

  const followedQuery = useQuery({
    queryKey: queryKeys.gymFollows.byUser(userId),
    queryFn: () => fetchFollowedGymIds(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });

  const followedIds = useMemo(() => new Set(followedQuery.data ?? []), [followedQuery.data]);

  const mutation = useMutation({
    mutationFn: async ({ gymId, nextFollowing }: { gymId: string; nextFollowing: boolean }) => {
      if (!userId) throw new Error('Sign in to follow gyms.');
      if (nextFollowing) await followGym(gymId, userId);
      else await unfollowGym(gymId, userId);
    },
    onMutate: async ({ gymId, nextFollowing }) => {
      setPendingGymId(gymId);
      await queryClient.cancelQueries({ queryKey: queryKeys.gymFollows.byUser(userId) });

      const previousIds = queryClient.getQueryData<string[]>(queryKeys.gymFollows.byUser(userId)) ?? [];
      patchFollowedIdsInCache(queryClient, userId, gymId, nextFollowing);
      adjustFollowerCountInCache(queryClient, gymId, nextFollowing ? 1 : -1);

      return { previousIds };
    },
    onError: (error, variables, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(queryKeys.gymFollows.byUser(userId), context.previousIds);
        adjustFollowerCountInCache(
          queryClient,
          variables.gymId,
          variables.nextFollowing ? -1 : 1,
        );
      }

      Alert.alert(
        'Could not update follow',
        error instanceof Error ? error.message : 'Check your connection and try again.',
      );
    },
    onSettled: (_data, error, variables) => {
      setPendingGymId((current) => (current === variables.gymId ? null : current));
      if (error) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.gymFollows.byUser(userId) });
      }
    },
  });

  const toggleFollow = useCallback(
    (gymId: string) => {
      if (!userId) {
        Alert.alert('Sign in required', 'Log in to follow gyms and get updates.');
        return;
      }
      if (pendingGymId === gymId) return;

      mutation.mutate({ gymId, nextFollowing: !followedIds.has(gymId) });
    },
    [followedIds, mutation, pendingGymId, userId],
  );

  const value = useMemo<GymFollowContextValue>(
    () => ({
      isFollowing: (gymId: string) => followedIds.has(gymId),
      isPending: (gymId: string) => pendingGymId === gymId,
      toggleFollow,
    }),
    [followedIds, pendingGymId, toggleFollow],
  );

  return <GymFollowContext.Provider value={value}>{children}</GymFollowContext.Provider>;
}

export function useGymFollow(): GymFollowContextValue {
  const context = useContext(GymFollowContext);
  if (!context) {
    throw new Error('useGymFollow must be used within GymFollowProvider');
  }
  return context;
}
