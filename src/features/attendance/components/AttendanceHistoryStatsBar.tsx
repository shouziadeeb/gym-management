import { Text, View } from 'react-native';

import { AttendanceStatCard } from '@/features/attendance/components/AttendanceStatCard';
import type { AttendanceHistoryAnalytics } from '@/features/attendance/domain/history-analytics';
import { spacing } from '@/theme/spacing';

type Props = {
  analytics: AttendanceHistoryAnalytics;
};

export function AttendanceHistoryStatsBar({ analytics }: Props) {
  return (
    <View style={{ gap: spacing[2] }}>
      <View className="flex-row" style={{ gap: spacing[2] }}>
        <AttendanceStatCard label="Total records" value={analytics.totalRecords} />
        <AttendanceStatCard label="Present today" value={analytics.presentToday} accent="success" />
      </View>
      <View className="flex-row" style={{ gap: spacing[2] }}>
        <AttendanceStatCard label="Active members" value={analytics.activeMembers} />
        <AttendanceStatCard
          label="Attendance rate"
          value={`${analytics.attendanceRate}%`}
          hint="Today vs active"
          accent={analytics.attendanceRate >= 50 ? 'success' : 'warning'}
        />
      </View>
    </View>
  );
}
