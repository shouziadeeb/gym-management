import { Text, View } from 'react-native';

import { formatAttendanceDateTime } from '@/features/attendance/domain/format';
import type { MemberAttendanceRow, OwnerAttendanceRow } from '@/features/attendance/types';
import { useTheme } from '@/hooks/useTheme';
import { layout, text } from '@/theme/classes';
import { webFullWidthStyle } from '@/lib/web-layout';

type OwnerProps = {
  row: OwnerAttendanceRow;
  variant?: 'default' | 'embedded';
};

export function OwnerAttendanceRowCard({ row, variant = 'default' }: OwnerProps) {
  const { colors } = useTheme();

  if (variant === 'embedded') {
    return (
      <View style={webFullWidthStyle}>
        <Text className={text.listTitle}>{row.member_name ?? 'Member'}</Text>
        {row.member_phone ? <Text className={`${layout.stackSm} ${text.caption}`}>{row.member_phone}</Text> : null}
        <Text className={`${layout.stackSm} ${text.bodySm}`}>
          {formatAttendanceDateTime(row.attendance_date, row.attendance_time)}
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`${layout.cardSpacing} w-full rounded-2xl border p-4`}
      style={{ borderColor: colors.border, backgroundColor: colors.card, ...webFullWidthStyle }}
    >
      <Text className={text.listTitle}>{row.member_name ?? 'Member'}</Text>
      {row.member_phone ? <Text className={text.caption}>{row.member_phone}</Text> : null}
      <Text className={`${layout.stackSm} ${text.bodySm}`}>
        {formatAttendanceDateTime(row.attendance_date, row.attendance_time)}
      </Text>
    </View>
  );
}

type MemberProps = {
  row: MemberAttendanceRow;
  variant?: 'default' | 'embedded';
};

export function MemberAttendanceRowCard({ row, variant = 'default' }: MemberProps) {
  const { colors } = useTheme();

  if (variant === 'embedded') {
    return (
      <View style={webFullWidthStyle}>
        <Text className={text.listTitle}>{row.gym_name}</Text>
        <Text className={`${layout.stackSm} ${text.bodySm}`}>
          {formatAttendanceDateTime(row.attendance_date, row.attendance_time)}
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`${layout.cardSpacing} w-full rounded-2xl border p-4`}
      style={{ borderColor: colors.border, backgroundColor: colors.card, ...webFullWidthStyle }}
    >
      <Text className={text.listTitle}>{row.gym_name}</Text>
      <Text className={`${layout.stackSm} ${text.bodySm}`}>
        {formatAttendanceDateTime(row.attendance_date, row.attendance_time)}
      </Text>
    </View>
  );
}
