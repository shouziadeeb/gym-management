import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchGymAttendanceHistory } from '@/api/attendance.api';
import { queryKeys } from '@/api/queries/keys';
import { ATTENDANCE_PAGE_SIZE } from '@/features/attendance/constants';
import { groupAttendanceByDate } from '@/features/attendance/domain/group-by-date';
import { buildAttendanceHistoryAnalytics } from '@/features/attendance/domain/history-analytics';
import { useAttendanceDashboard } from '@/features/attendance/hooks/useAttendanceDashboard';
import type { AttendanceHistoryFilters } from '@/features/attendance/types';

export function useOwnerAttendanceHistoryManager(gymId?: string, filters: AttendanceHistoryFilters = {}) {
  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        from: filters.from ?? null,
        to: filters.to ?? null,
        memberId: filters.memberId ?? null,
        search: filters.search ?? null,
        sort: filters.sort ?? 'newest',
      }),
    [filters.from, filters.to, filters.memberId, filters.search, filters.sort],
  );

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.attendance.ownerHistory(gymId, filtersKey, 1), 'infinite'],
    queryFn: ({ pageParam = 1 }) => fetchGymAttendanceHistory(gymId!, filters, pageParam, ATTENDANCE_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.rows.length, 0);
      if (loaded >= lastPage.total) return undefined;
      return pages.length + 1;
    },
    enabled: Boolean(gymId),
  });

  const dashboard = useAttendanceDashboard(gymId);

  const rows = useMemo(
    () => query.data?.pages.flatMap((page) => page.rows) ?? [],
    [query.data?.pages],
  );

  const total = query.data?.pages[0]?.total ?? 0;
  const resolvedTotal = Math.max(total, rows.length);
  const sections = useMemo(() => groupAttendanceByDate(rows), [rows]);

  const analytics = useMemo(
    () =>
      buildAttendanceHistoryAnalytics({
        totalRecords: resolvedTotal,
        presentToday: dashboard.stats.presentToday,
        activeMembers: dashboard.stats.activeMembers,
      }),
    [dashboard.stats.activeMembers, dashboard.stats.presentToday, resolvedTotal],
  );

  return {
    query,
    rows,
    sections,
    total: resolvedTotal,
    analytics,
    loadMore: () => void query.fetchNextPage(),
    hasMore: query.hasNextPage ?? false,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
