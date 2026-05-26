import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import {
  deleteAttendanceQr,
  deleteAttendanceRecord,
  fetchGymAttendanceHistory,
  fetchGymAttendanceSettings,
  fetchTodayAttendance,
  generateAttendanceQr,
  setAttendanceEnabled,
} from '@/api/attendance.api';
import { queryKeys } from '@/api/queries/keys';
import { ATTENDANCE_PAGE_SIZE } from '@/features/attendance/constants';
import type { AttendanceHistoryFilters } from '@/features/attendance/types';

export function useAttendanceSettings(gymId?: string) {
  return useQuery({
    queryKey: queryKeys.attendance.settings(gymId),
    queryFn: () => fetchGymAttendanceSettings(gymId!),
    enabled: !!gymId,
  });
}

export function useTodayAttendance(gymId?: string, date?: string) {
  return useQuery({
    queryKey: queryKeys.attendance.today(gymId, date),
    queryFn: () => fetchTodayAttendance(gymId!, date),
    enabled: !!gymId,
  });
}

export function useOwnerAttendanceHistory(gymId?: string, filters: AttendanceHistoryFilters = {}) {
  const [page, setPage] = useState(1);
  const filtersKey = useMemo(
    () => JSON.stringify({ from: filters.from ?? null, to: filters.to ?? null, memberId: filters.memberId ?? null }),
    [filters.from, filters.to, filters.memberId],
  );

  const query = useQuery({
    queryKey: queryKeys.attendance.ownerHistory(gymId, filtersKey, page),
    queryFn: () => fetchGymAttendanceHistory(gymId!, filters, page, ATTENDANCE_PAGE_SIZE),
    enabled: !!gymId,
  });

  const loadMore = useCallback(() => {
    if (!query.data) return;
    const maxPage = Math.ceil(query.data.total / ATTENDANCE_PAGE_SIZE);
    if (page < maxPage) setPage((current) => current + 1);
  }, [page, query.data]);

  const resetPage = useCallback(() => setPage(1), []);

  return { ...query, page, setPage, resetPage, loadMore };
}

export function useOwnerAttendanceMutations(gymId?: string) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.settings(gymId) }),
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today', gymId] }),
      queryClient.invalidateQueries({ queryKey: ['attendance', 'owner', gymId] }),
    ]);
  }, [gymId, queryClient]);

  const generate = useMutation({
    mutationFn: (regenerate: boolean) => generateAttendanceQr(gymId!, regenerate),
    onSuccess: invalidate,
  });

  const toggleEnabled = useMutation({
    mutationFn: (enabled: boolean) => setAttendanceEnabled(gymId!, enabled),
    onSuccess: invalidate,
  });

  const removeQr = useMutation({
    mutationFn: () => deleteAttendanceQr(gymId!),
    onSuccess: invalidate,
  });

  const removeRecord = useMutation({
    mutationFn: (attendanceId: string) => deleteAttendanceRecord(attendanceId),
    onSuccess: invalidate,
  });

  return { generate, toggleEnabled, removeQr, removeRecord, invalidate };
}
