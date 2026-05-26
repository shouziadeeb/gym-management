import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { fetchMemberAttendanceHistory, markAttendanceByToken } from '@/api/attendance.api';
import { queryKeys } from '@/api/queries/keys';
import { ATTENDANCE_PAGE_SIZE } from '@/features/attendance/constants';
import { getLocalAttendanceDate } from '@/features/attendance/domain/format';
import {
  getAttendanceErrorMessage,
  validateAttendanceScanPayload,
} from '@/features/attendance/domain/validate-scan';
import type { AttendanceMarkResult } from '@/features/attendance/types';

export function useMemberAttendanceHistory(gymId?: string) {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: queryKeys.attendance.memberHistory(gymId, page),
    queryFn: () => fetchMemberAttendanceHistory(gymId, page, ATTENDANCE_PAGE_SIZE),
  });

  const loadMore = useCallback(() => {
    if (!query.data) return;
    const maxPage = Math.ceil(query.data.total / ATTENDANCE_PAGE_SIZE);
    if (page < maxPage) setPage((current) => current + 1);
  }, [page, query.data]);

  return { ...query, page, setPage, loadMore };
}

export function useAttendanceScanner(gymId?: string) {
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<AttendanceMarkResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const scanMutation = useMutation({
    mutationFn: (token: string) => markAttendanceByToken(token, getLocalAttendanceDate()),
  });

  const processScan = useCallback(
    async (rawValue: string) => {
      if (isProcessing) return lastResult;

      const parsed = validateAttendanceScanPayload(rawValue);
      if (!parsed.ok) {
        const failure = { success: false as const, error: parsed.error };
        setLastResult(failure);
        return failure;
      }

      try {
        setIsProcessing(true);
        const result = await scanMutation.mutateAsync(parsed.token);
        setLastResult(result);
        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: ['attendance', 'member', gymId ?? 'all'] });
        }
        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    [gymId, isProcessing, lastResult, queryClient, scanMutation],
  );

  const reset = useCallback(() => setLastResult(null), []);

  const errorMessage =
    lastResult && !lastResult.success ? getAttendanceErrorMessage(lastResult.error) : null;

  return {
    processScan,
    reset,
    lastResult,
    errorMessage,
    isProcessing: isProcessing || scanMutation.isPending,
  };
}
