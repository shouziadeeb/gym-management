import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import {
  AttendanceQrCode,
  AttendanceStatsCard,
  OwnerAttendanceRowCard,
  useAttendanceSettings,
  useOwnerAttendanceHistory,
  useOwnerAttendanceMutations,
  useTodayAttendance,
} from '@/features/attendance';
import { DATE_FORMAT } from '@/constants/date';
import { getErrorMessage } from '@/lib/errors';
import { useTheme } from '@/hooks/useTheme';
import { isAttendanceMigrationMissingError } from '@/utils/supabase-errors';
import { useAppStore } from '@/store/app.store';
import { layout, text } from '@/theme/classes';

export function OwnerAttendanceScreen() {
  const { colors } = useTheme();
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const todayKey = format(new Date(), DATE_FORMAT.isoDate);

  const settingsQuery = useAttendanceSettings(activeOwnerGymId ?? undefined);
  const todayQuery = useTodayAttendance(activeOwnerGymId ?? undefined, todayKey);
  const [filters] = useState({ from: undefined, to: undefined, memberId: undefined });
  const historyQuery = useOwnerAttendanceHistory(activeOwnerGymId ?? undefined, filters);
  const mutations = useOwnerAttendanceMutations(activeOwnerGymId ?? undefined);

  const settings = settingsQuery.data;
  const token = settings?.attendance_token ?? null;
  const enabled = Boolean(settings?.attendance_enabled && token);
  const todayRows = todayQuery.data ?? [];
  const historyRows = historyQuery.data?.rows ?? [];
  const migrationMissing =
    isAttendanceMigrationMissingError(settingsQuery.error) ||
    isAttendanceMigrationMissingError(todayQuery.error) ||
    isAttendanceMigrationMissingError(historyQuery.error);

  const busy =
    mutations.generate.isPending ||
    mutations.toggleEnabled.isPending ||
    mutations.removeQr.isPending ||
    mutations.removeRecord.isPending;

  const qrLabel = useMemo(() => {
    if (!settings?.qr_generated_at) return undefined;
    return `Generated ${format(new Date(settings.qr_generated_at), DATE_FORMAT.long)}`;
  }, [settings?.qr_generated_at]);

  async function run(action: () => Promise<unknown>, successMessage: string) {
    try {
      await action();
      Alert.alert('Success', successMessage);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  }

  if (!activeOwnerGymId) {
    return (
      <Screen>
        <EmptyState title="Select a gym" description="Choose an active gym to manage attendance." />
      </Screen>
    );
  }

  if (migrationMissing) {
    return (
      <Screen scroll>
        <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>Attendance</Text>
        <Card title="Database setup required" highlighted>
          <Text className={text.body}>
            The attendance migration has not been applied to your Supabase project yet.
          </Text>
          <Text className={`${layout.stack} ${text.caption}`}>
            Run the repair script in Supabase SQL Editor: supabase/migrations/20260528130000_attendance_qr_repair.sql
          </Text>
          <Button title="Retry" onPress={() => void settingsQuery.refetch()} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className={layout.vstackMd}>
        <View>
          <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>Attendance</Text>
          <Text className={`${layout.stackSm} ${text.caption}`}>
            Generate a permanent QR code and track member check-ins.
          </Text>
        </View>

        <AttendanceStatsCard todayCount={todayRows.length} enabled={enabled} hasQr={Boolean(token)} />

        <Card title="Attendance QR">
          {settingsQuery.isLoading ? <Text className={text.loading}>Loading settings…</Text> : null}
          {token && enabled ? (
            <>
              <AttendanceQrCode token={token} label={qrLabel} />
              <View className={layout.vstackSm}>
                <Button
                  title="Regenerate QR"
                  variant="ghost"
                  disabled={busy}
                  onPress={() =>
                    Alert.alert('Regenerate QR?', 'The old QR will stop working immediately.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Regenerate',
                        style: 'destructive',
                        onPress: () => void run(() => mutations.generate.mutateAsync(true), 'New QR generated.'),
                      },
                    ])
                  }
                />
                <Button
                  title="Disable attendance"
                  variant="ghost"
                  disabled={busy}
                  onPress={() => void run(() => mutations.toggleEnabled.mutateAsync(false), 'Attendance disabled.')}
                />
                <Button
                  title="Delete QR"
                  variant="danger"
                  disabled={busy}
                  onPress={() =>
                    Alert.alert('Delete QR?', 'Members will no longer be able to scan until you generate a new one.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => void run(() => mutations.removeQr.mutateAsync(), 'Attendance QR deleted.'),
                      },
                    ])
                  }
                />
              </View>
            </>
          ) : (
            <>
              <Text className={text.caption}>
                Create a secure attendance token and display it as a QR code at your gym entrance.
              </Text>
              <Button
                title={token ? 'Enable attendance' : 'Generate attendance QR'}
                disabled={busy}
                onPress={() =>
                  void run(
                    () => (token ? mutations.toggleEnabled.mutateAsync(true) : mutations.generate.mutateAsync(false)),
                    token ? 'Attendance enabled.' : 'Attendance QR generated.',
                  )
                }
              />
            </>
          )}
        </Card>

        <Card title="Present today">
          {todayQuery.isLoading ? <Text className={text.loading}>Loading today&apos;s attendance…</Text> : null}
          {!todayQuery.isLoading && todayRows.length === 0 ? (
            <Text className={text.caption}>No check-ins yet today.</Text>
          ) : null}
          {todayRows.map((row) => (
            <OwnerAttendanceRowCard key={row.id} row={row} variant="embedded" />
          ))}
        </Card>

        <Card title="Attendance history">
          {historyQuery.isLoading ? <Text className={text.loading}>Loading history…</Text> : null}
          {!historyQuery.isLoading && historyRows.length === 0 ? (
            <Text className={text.caption}>No attendance records yet.</Text>
          ) : null}
          {historyRows.map((row, index) => (
            <View
              key={row.id}
              className={layout.vstackSm}
              style={{
                paddingBottom: index < historyRows.length - 1 ? 12 : 0,
                marginBottom: index < historyRows.length - 1 ? 12 : 0,
                borderBottomWidth: index < historyRows.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <OwnerAttendanceRowCard row={row} variant="embedded" />
              <Button
                title="Delete record"
                variant="ghost"
                disabled={busy}
                onPress={() =>
                  Alert.alert('Delete attendance record?', 'This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () =>
                        void run(() => mutations.removeRecord.mutateAsync(row.id), 'Attendance record deleted.'),
                    },
                  ])
                }
              />
            </View>
          ))}
          {historyQuery.data && historyRows.length < historyQuery.data.total ? (
            <Button title="Load more" variant="ghost" onPress={historyQuery.loadMore} />
          ) : null}
        </Card>
      </View>
    </Screen>
  );
}
