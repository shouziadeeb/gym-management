import { Text, View } from 'react-native';

import { formatAttendanceDateTime } from '@/features/attendance/domain/format';
import type { MemberAttendanceRow } from '@/features/attendance/types';
import { useTheme } from '@/hooks/useTheme';
import { layout, text } from '@/theme/classes';
import { webFullWidthStyle } from '@/lib/web-layout';

type Props = {
  row: MemberAttendanceRow;
  variant?: 'default' | 'embedded';
};

export function MemberAttendanceRowCard({ row, variant = 'default' }: Props) {
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
