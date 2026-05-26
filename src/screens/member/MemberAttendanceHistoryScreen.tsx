import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { MemberAttendanceRowCard, useMemberAttendanceHistory } from '@/features/attendance';
import { useAppStore } from '@/store/app.store';
import { layout, text } from '@/theme/classes';

export function MemberAttendanceHistoryScreen() {
  const activeMemberGymId = useAppStore((state) => state.activeMemberGymId);
  const historyQuery = useMemberAttendanceHistory(activeMemberGymId ?? undefined);
  const rows = historyQuery.data?.rows ?? [];

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>Attendance history</Text>
      <Text className={text.caption}>Your gym check-ins are stored permanently until the owner removes them.</Text>

      <Card title="Recent check-ins" className={layout.sectionLg}>
        {historyQuery.isLoading ? <Text className={text.loading}>Loading history…</Text> : null}
        {!historyQuery.isLoading && rows.length === 0 ? (
          <EmptyState title="No attendance yet" description="Scan your gym QR code to mark your first check-in." />
        ) : null}
        {rows.map((row) => (
          <MemberAttendanceRowCard key={row.id} row={row} />
        ))}
        {historyQuery.data && rows.length < historyQuery.data.total ? (
          <View className={layout.stackMd}>
            <Button title="Load more" variant="ghost" onPress={historyQuery.loadMore} />
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
