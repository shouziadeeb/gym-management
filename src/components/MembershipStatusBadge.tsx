import { Text, View } from 'react-native';

import { displayStatus } from '@/lib/membership';
import type { MembershipStatus } from '@/types/models';
import { badges, text } from '@/theme/classes';

type Props = {
  status: MembershipStatus;
  endsAt: string;
};

export function MembershipStatusBadge({ status, endsAt }: Props) {
  const label = displayStatus(status, endsAt);
  const tone =
    label === 'Expired'
      ? badges.expired
      : label === 'Expiring soon'
        ? badges.expiring
        : label === 'Cancelled'
          ? badges.cancelled
          : badges.active;

  return (
    <View className={`${badges.container} ${tone}`}>
      <Text className={text.badge}>{label}</Text>
    </View>
  );
}
