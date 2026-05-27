import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { AttendanceStatsGrid, useAttendanceDashboard } from '@/features/attendance';
import { useAppStore } from '@/store/app.store';
import { layout, text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

export function OwnerAttendanceAnalyticsScreen() {
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const dashboard = useAttendanceDashboard(activeOwnerGymId ?? undefined);

  if (!activeOwnerGymId) {
    return (
      <Screen omitTopSafeArea>
        <EmptyState title="Select a gym" description="Choose an active gym to view attendance analytics." />
      </Screen>
    );
  }

  return (
    <Screen scroll omitTopSafeArea>
      <View className={layout.screenTop} style={{ gap: spacing[3] }}>
        <Text className={text.screenTitleLg}>Attendance analytics</Text>
        <Text className={text.caption}>Daily snapshot — trends, streaks, and exports are coming soon.</Text>

        {dashboard.isLoading ? <Text className={text.loading}>Loading analytics…</Text> : <AttendanceStatsGrid stats={dashboard.stats} />}

        <View
          className="rounded-2xl border p-4"
          style={{ gap: spacing[2] }}
        >
          <Text className={text.listTitle}>Coming next</Text>
          <Text className={text.caption}>• Weekly attendance trends</Text>
          <Text className={text.caption}>• Member streaks and reports</Text>
          <Text className={text.caption}>• CSV export and kiosk mode</Text>
        </View>

        <Button title="Open full analytics" variant="ghost" onPress={() => router.push('/analytics')} />
        <Button title="Back to today" variant="ghost" onPress={() => router.push('/attendance')} />
      </View>
    </Screen>
  );
}
