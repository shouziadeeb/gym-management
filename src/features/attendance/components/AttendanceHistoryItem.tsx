import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MoreVertical } from 'lucide-react-native';

import { GymLogo } from '@/components/gym/GymLogo';
import { AttendanceBadge, type AttendanceBadgeTone } from '@/features/attendance/components/AttendanceBadge';
import { formatAttendanceDate, formatAttendanceTime } from '@/features/attendance/domain/format';
import type { OwnerAttendanceRow } from '@/features/attendance/types';
import { useTheme } from '@/hooks/useTheme';
import { layout, text } from '@/theme/classes';

type Props = {
  row: OwnerAttendanceRow;
  showDate?: boolean;
  onMorePress?: () => void;
};

function membershipTone(status?: string | null): AttendanceBadgeTone {
  if (status === 'expired' || status === 'cancelled') return 'danger';
  if (status === 'expiring_soon') return 'warning';
  return 'present';
}

function membershipLabel(status?: string | null): string {
  if (status === 'expired') return 'Expired';
  if (status === 'expiring_soon') return 'Expiring';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'active') return 'Active';
  return 'Checked in';
}

export const AttendanceHistoryItem = memo(function AttendanceHistoryItem({ row, showDate = false, onMorePress }: Props) {
  const { colors } = useTheme();
  const displayName = row.member_name?.trim() || 'Member';
  const checkInTime = formatAttendanceTime(row.attendance_time);
  const status = row.membership_status;

  return (
    <View
      className="flex-row items-center rounded-2xl border px-3 py-2.5"
      style={{ borderColor: colors.border, backgroundColor: colors.card, minHeight: 58 }}
    >
      <GymLogo logoUrl={row.avatar_url} gymName={displayName} size="sm" />
      <View className={`${layout.flex1} ml-3`}>
        <Text className={`${text.bodySm} font-semibold`} numberOfLines={1}>
          {displayName}
        </Text>
        <Text className={`${text.caption} text-xs`} numberOfLines={1}>
          {row.member_phone?.trim() || 'No phone'}
        </Text>
        <Text className={`${text.meta} text-[11px]`} numberOfLines={1}>
          {showDate ? `${formatAttendanceDate(row.attendance_date)} · ${checkInTime}` : checkInTime}
        </Text>
      </View>
      <View className="items-end" style={{ gap: 4 }}>
        <AttendanceBadge label={membershipLabel(status)} tone={membershipTone(status)} />
        <Text className={`${text.meta} text-[10px]`}>{checkInTime}</Text>
      </View>
      {onMorePress ? (
        <Pressable onPress={onMorePress} hitSlop={10} className="ml-2 p-1" accessibilityRole="button" accessibilityLabel="Record actions">
          <MoreVertical size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
});

/** @deprecated Use AttendanceHistoryItem */
export const AttendanceMemberRow = AttendanceHistoryItem;
