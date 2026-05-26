import { Text, View } from 'react-native';

import { getMembershipStatusLabel, getMembershipStatusTone } from '@/domain/memberships';
import type { MembershipStatus } from '@/types/models';
import { badges, text } from '@/theme/classes';

type Props = {
  status: MembershipStatus;
  expiryDate: string;
};

export function MembershipStatusBadge({ status, expiryDate }: Props) {
  const finalStatus = status === 'cancelled' ? status : (expiryDate ? status : 'expired');
  const label = getMembershipStatusLabel(finalStatus);
  const toneId = getMembershipStatusTone(finalStatus);
  const tone = toneId === 'red' ? badges.expired : toneId === 'yellow' ? badges.expiring : toneId === 'gray' ? badges.cancelled : badges.active;

  return (
    <View className={`${badges.container} ${tone}`}>
      <Text className={text.badge}>{label}</Text>
    </View>
  );
}
