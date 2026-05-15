import { Text, View } from 'react-native';

import { displayStatus } from '@/lib/membership';
import type { MembershipStatus } from '@/types/models';

type Props = {
  status: MembershipStatus;
  endsAt: string;
};

export function MembershipStatusBadge({ status, endsAt }: Props) {
  const label = displayStatus(status, endsAt);
  const tone =
    label === 'Expired'
      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
      : label === 'Expiring soon'
        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100'
        : label === 'Cancelled'
          ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';

  return (
    <View className={`self-start rounded-full px-3 py-1 ${tone}`}>
      <Text className="text-xs font-semibold uppercase tracking-wide">{label}</Text>
    </View>
  );
}
