import { format } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BarChart3, History, QrCode } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useScreenScrollBottomPadding } from '@/components/ui/Screen';
import {
  AttendanceEmptyState,
  AttendanceHistoryList,
  AttendanceQuickActions,
  AttendanceSectionHeader,
  AttendanceStatsGrid,
  useAttendanceDashboard,
} from '@/features/attendance';
import { DATE_FORMAT } from '@/constants/date';
import { useTheme } from '@/hooks/useTheme';
import { isAttendanceMigrationMissingError } from '@/utils/supabase-errors';
import { useAppStore } from '@/store/app.store';
import { layout, text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

export function OwnerAttendanceDashboardScreen() {
  const { colors } = useTheme();
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const bottomPadding = useScreenScrollBottomPadding(true);
  const todayLabel = format(new Date(), DATE_FORMAT.long);

  const dashboard = useAttendanceDashboard(activeOwnerGymId ?? undefined);

  const migrationMissing =
    isAttendanceMigrationMissingError(dashboard.settingsQuery.error) ||
    isAttendanceMigrationMissingError(dashboard.todayQuery.error);

  const quickActions = useMemo(
    () => [
      { key: 'qr', label: 'Show QR', icon: QrCode, onPress: () => router.push('/attendance-qr') },
      { key: 'history', label: 'History', icon: History, onPress: () => router.push('/attendance-owner-history') },
      { key: 'analytics', label: 'Analytics', icon: BarChart3, onPress: () => router.push('/attendance-analytics') },
    ],
    [],
  );

  const header = useCallback(
    () => (
      <View style={{ gap: spacing[3], paddingTop: spacing[4] }}>
        <View>
          <Text className={text.screenTitleLg}>Attendance</Text>
          <Text className={`${layout.stackSm} ${text.caption}`}>{todayLabel}</Text>
        </View>

        {dashboard.isLoading ? (
          <ActivityIndicator color={colors.primary} accessibilityLabel="Loading attendance" />
        ) : (
          <AttendanceStatsGrid stats={dashboard.stats} />
        )}

        <AttendanceQuickActions actions={quickActions} />

        {!dashboard.hasQr ? (
          <View
            className="rounded-2xl border px-3 py-3"
            style={{ borderColor: colors.border, backgroundColor: colors.card }}
          >
            <Text className={text.bodySm}>QR check-in is not set up yet.</Text>
            <View className="mt-2">
              <Button title="Set up QR" onPress={() => router.push('/attendance-qr')} />
            </View>
          </View>
        ) : null}

        <AttendanceSectionHeader
          title="Present today"
          subtitle={`${dashboard.todayRows.length} check-in${dashboard.todayRows.length === 1 ? '' : 's'}`}
        />
      </View>
    ),
    [
      colors.border,
      colors.card,
      colors.primary,
      dashboard.hasQr,
      dashboard.isLoading,
      dashboard.stats,
      dashboard.todayRows.length,
      quickActions,
      todayLabel,
    ],
  );

  if (!activeOwnerGymId) {
    return (
      <View className="flex-1 px-4" style={{ paddingTop: spacing[4] }}>
        <EmptyState title="Select a gym" description="Choose an active gym to track attendance." />
      </View>
    );
  }

  if (migrationMissing) {
    return (
      <View className="flex-1 px-4" style={{ paddingTop: spacing[4], gap: spacing[3] }}>
        <Text className={text.screenTitleLg}>Attendance</Text>
        <Text className={text.body}>
          Apply supabase/migrations/20260528130000_attendance_qr_repair.sql in Supabase, then retry.
        </Text>
        <Button title="Retry" onPress={() => void dashboard.refetch()} />
      </View>
    );
  }

  return (
    <AttendanceHistoryList
      rows={dashboard.todayRows}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <AttendanceEmptyState
          compact
          title="No check-ins yet"
          description="Members who scan your gym QR will appear here instantly."
          action={<Button title="Open QR" variant="ghost" onPress={() => router.push('/attendance-qr')} />}
        />
      }
      refreshing={dashboard.isRefetching}
      onRefresh={() => void dashboard.refetch()}
      contentPaddingBottom={bottomPadding}
    />
  );
}
