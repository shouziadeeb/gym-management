import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications.api';
import { queryKeys } from '@/api/queries/keys';
import {
  matchesNotificationFilter,
  type NotificationFilterCategory,
} from '@/domain/notifications/types';
import { useAuthStore } from '@/store/auth.store';

export function useNotifications(filter: NotificationFilterCategory = 'all') {
  const userId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: queryKeys.notifications.list(userId, filter),
    queryFn: fetchNotifications,
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const items = useMemo(() => {
    const rows = listQuery.data ?? [];
    if (filter === 'all') return rows;
    return rows.filter((row) => matchesNotificationFilter(row.type, filter));
  }, [filter, listQuery.data]);

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root(userId) });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root(userId) });
    },
  });

  return {
    items,
    loading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    markingRead: markReadMutation.isPending,
    markingAllRead: markAllReadMutation.isPending,
  };
}
