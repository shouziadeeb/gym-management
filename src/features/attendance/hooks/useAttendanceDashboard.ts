import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useCallback, useMemo } from 'react';

import { fetchOwnerGymMemberSummary } from '@/api/owner-members.api';
import { queryKeys } from '@/api/queries/keys';
import { DATE_FORMAT } from '@/constants/date';
import { buildAttendanceDashboardStats } from '@/features/attendance/domain/dashboard';
import {
  useAttendanceSettings,
  useTodayAttendance,
} from '@/features/attendance/hooks/useOwnerAttendance';

export function useAttendanceDashboard(gymId?: string) {
  const todayKey = format(new Date(), DATE_FORMAT.isoDate);

  const settingsQuery = useAttendanceSettings(gymId);
  const todayQuery = useTodayAttendance(gymId, todayKey);

  const summaryQuery = useQuery({
    queryKey: queryKeys.members.ownerSummary(gymId),
    queryFn: () => fetchOwnerGymMemberSummary(gymId!),
    enabled: Boolean(gymId),
  });

  const settings = settingsQuery.data;
  const token = settings?.attendance_token ?? null;
  const enabled = Boolean(settings?.attendance_enabled && token);
  const todayRows = todayQuery.data ?? [];

  const stats = useMemo(
    () =>
      buildAttendanceDashboardStats({
        presentToday: todayRows.length,
        activeMembers: summaryQuery.data?.active_memberships ?? 0,
        expiredMembers: summaryQuery.data?.expired_memberships ?? 0,
      }),
    [summaryQuery.data?.active_memberships, summaryQuery.data?.expired_memberships, todayRows.length],
  );

  const isLoading = settingsQuery.isLoading || todayQuery.isLoading || summaryQuery.isLoading;
  const isRefetching = settingsQuery.isRefetching || todayQuery.isRefetching || summaryQuery.isRefetching;

  const refetch = useCallback(async () => {
    await Promise.all([settingsQuery.refetch(), todayQuery.refetch(), summaryQuery.refetch()]);
  }, [settingsQuery, summaryQuery, todayQuery]);

  return {
    settings,
    token,
    enabled,
    hasQr: Boolean(token),
    todayRows,
    stats,
    isLoading,
    isRefetching,
    refetch,
    settingsQuery,
    todayQuery,
    summaryQuery,
  };
}
