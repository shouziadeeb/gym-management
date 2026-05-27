import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

type Props = {
  title: string;
  count?: number;
};

export function AttendanceDateGroup({ title, count }: Props) {
  const { colors } = useTheme();

  return (
    <View
      className="mb-2 mt-3 flex-row items-center justify-between rounded-xl px-1 py-1"
      style={{ backgroundColor: colors.background }}
    >
      <Text className={`${text.label} font-semibold`}>{title}</Text>
      {typeof count === 'number' ? (
        <Text className={`${text.caption} text-xs`} style={{ color: colors.muted }}>
          {count} check-in{count === 1 ? '' : 's'}
        </Text>
      ) : null}
    </View>
  );
}
