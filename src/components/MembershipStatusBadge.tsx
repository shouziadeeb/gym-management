import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import {
  getMembershipStatus,
  getMembershipStatusLabel,
  getMembershipStatusTone,
  resolveMembershipExpiryDate,
} from '@/domain/memberships';
import type { MembershipStatus } from '@/types/models';

type Props = {
  status: MembershipStatus;
  expiryDate?: string | null;
  endsAt?: string | null;
};

const toneMap: Record<'red' | 'yellow' | 'gray' | 'green', StatusTone> = {
  red: 'expired',
  yellow: 'expiring',
  gray: 'cancelled',
  green: 'active',
};

export function MembershipStatusBadge({ status, expiryDate, endsAt }: Props) {
  const resolvedExpiry = resolveMembershipExpiryDate({
    expiry_date: expiryDate,
    ends_at: endsAt,
  });
  const finalStatus: MembershipStatus =
    status === 'cancelled' ? status : getMembershipStatus(resolvedExpiry);
  const label = getMembershipStatusLabel(finalStatus);
  const toneId = getMembershipStatusTone(finalStatus);

  return <StatusBadge label={label} tone={toneMap[toneId]} />;
}
