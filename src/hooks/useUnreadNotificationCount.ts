import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { fetchUnreadNotificationCount } from '@/api/notifications.api';
import { queryKeys } from '@/api/queries/keys';
import { setBadgeCount } from '@/services/notifications/push-handler';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';

export function useUnreadNotificationCount() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.notifications.unread(userId),
    queryFn: fetchUnreadNotificationCount,
    enabled: Boolean(userId),
    staleTime: 20_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root(userId) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  useEffect(() => {
    void setBadgeCount(query.data ?? 0);
  }, [query.data]);

  return {
    count: query.data ?? 0,
    loading: query.isLoading,
  };
}
