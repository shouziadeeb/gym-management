import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { text } from '@/theme/classes';

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  accent?: 'default' | 'success' | 'warning' | 'danger';
};

const accentColors = {
  default: undefined,
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
} as const;

export function AttendanceStatCard({ label, value, hint, accent = 'default' }: Props) {
  const { colors } = useTheme();
  const valueColor = accentColors[accent] ?? colors.foreground;

  return (
    <View
      className="min-h-[72px] flex-1 rounded-2xl border px-3 py-2.5"
      style={{ borderColor: colors.border, backgroundColor: colors.card }}
    >
      <Text className={`${text.meta} text-xs`} numberOfLines={1}>
        {label}
      </Text>
      <Text className="mt-1 text-2xl font-bold" style={{ color: valueColor }}>
        {value}
      </Text>
      {hint ? (
        <Text className={`mt-0.5 ${text.caption} text-xs`} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
