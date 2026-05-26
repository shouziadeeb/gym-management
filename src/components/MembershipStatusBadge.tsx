import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { getMembershipStatusLabel, getMembershipStatusTone } from '@/domain/memberships';
import type { MembershipStatus } from '@/types/models';

type Props = {
  status: MembershipStatus;
  expiryDate: string;
};

const toneMap: Record<'red' | 'yellow' | 'gray' | 'green', StatusTone> = {
  red: 'expired',
  yellow: 'expiring',
  gray: 'cancelled',
  green: 'active',
};

export function MembershipStatusBadge({ status, expiryDate }: Props) {
  const finalStatus = status === 'cancelled' ? status : expiryDate ? status : 'expired';
  const label = getMembershipStatusLabel(finalStatus);
  const toneId = getMembershipStatusTone(finalStatus);

  return <StatusBadge label={label} tone={toneMap[toneId]} />;
}
