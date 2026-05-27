import { Text, View } from 'react-native';

import { text } from '@/theme/classes';

export type AttendanceBadgeTone = 'present' | 'neutral' | 'warning' | 'danger';

const toneTextClasses = {
  present: 'text-emerald-800 dark:text-emerald-200',
  neutral: 'text-slate-700 dark:text-slate-200',
  warning: 'text-amber-900 dark:text-amber-100',
  danger: 'text-red-800 dark:text-red-200',
} as const;

const toneBgClasses = {
  present: 'bg-emerald-100 dark:bg-emerald-950',
  neutral: 'bg-slate-100 dark:bg-slate-800',
  warning: 'bg-amber-100 dark:bg-amber-950',
  danger: 'bg-red-100 dark:bg-red-950',
} as const;

type Props = {
  label: string;
  tone?: AttendanceBadgeTone;
};

export function AttendanceBadge({ label, tone = 'present' }: Props) {
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${toneBgClasses[tone]}`}>
      <Text className={`${text.badge} text-[10px] ${toneTextClasses[tone]}`}>{label}</Text>
    </View>
  );
}
