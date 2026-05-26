import { CheckCircle2, XCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { formatAttendanceDateTime } from '@/features/attendance/domain/format';
import type { AttendanceMarkSuccess } from '@/features/attendance/types';
import { useTheme } from '@/hooks/useTheme';
import { layout, text } from '@/theme/classes';

type Props = {
  result: AttendanceMarkSuccess;
};

export function AttendanceSuccessState({ result }: Props) {
  const { colors } = useTheme();

  return (
    <View
      className="items-center rounded-3xl border p-6"
      style={{ borderColor: colors.primary, backgroundColor: colors.card }}
    >
      <CheckCircle2 size={56} color={colors.primary} />
      <Text className={`${layout.stackMd} ${text.cardTitle}`}>Attendance marked</Text>
      <Text className={`text-center ${text.body}`}>{result.gym_name}</Text>
      <Text className={`${layout.stackSm} text-center ${text.caption}`}>
        {formatAttendanceDateTime(result.attendance_date, result.attendance_time)}
      </Text>
    </View>
  );
}

type ErrorProps = {
  message: string;
};

export function AttendanceErrorState({ message }: ErrorProps) {
  const { colors } = useTheme();

  return (
    <View
      className="items-center rounded-3xl border p-6"
      style={{ borderColor: colors.danger, backgroundColor: colors.card }}
    >
      <XCircle size={56} color={colors.danger} />
      <Text className={`${layout.stackMd} ${text.cardTitle}`}>Check-in failed</Text>
      <Text className={`text-center ${text.body}`}>{message}</Text>
    </View>
  );
}
