import { Text } from 'react-native';

import type { Membership } from '@/types/models';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { text } from '@/theme/classes';

type Props = {
  membership: Pick<Membership, 'status' | 'expiry_date'>;
};

export function MembershipCountdown({ membership }: Props) {
  const { countdownLabel, status } = useMembershipStatus(membership);
  const tone = status === 'expired' ? text.error : status === 'expiring_soon' ? text.warningBody : text.caption;

  return <Text className={tone}>{countdownLabel}</Text>;
}
