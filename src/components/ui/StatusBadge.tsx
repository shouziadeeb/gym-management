import { Text, View } from 'react-native';

import { badges, text } from '@/theme/classes';

export type StatusTone = 'active' | 'expiring' | 'expired' | 'cancelled' | 'neutral';

const toneClasses: Record<StatusTone, string> = {
  active: badges.active,
  expiring: badges.expiring,
  expired: badges.expired,
  cancelled: badges.cancelled,
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <View className={`${badges.container} ${toneClasses[tone]}`}>
      <Text className={text.badge}>{label}</Text>
    </View>
  );
}
