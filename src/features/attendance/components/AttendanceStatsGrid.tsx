import { Text, View } from 'react-native';

import type { AttendanceDashboardStats } from '@/features/attendance/domain/dashboard';
import { AttendanceStatCard } from '@/features/attendance/components/AttendanceStatCard';
import { spacing } from '@/theme/spacing';

type Props = {
  stats: AttendanceDashboardStats;
};

export function AttendanceStatsGrid({ stats }: Props) {
  return (
    <View style={{ gap: spacing[2] }}>
      <View className="flex-row" style={{ gap: spacing[2] }}>
        <AttendanceStatCard label="Present today" value={stats.presentToday} accent="success" />
        <AttendanceStatCard label="Absent" value={stats.absentToday} hint="Active not checked in" />
      </View>
      <View className="flex-row" style={{ gap: spacing[2] }}>
        <AttendanceStatCard label="Active members" value={stats.activeMembers} />
        <AttendanceStatCard label="Expired" value={stats.expiredMembers} accent="danger" />
      </View>
    </View>
  );
}
