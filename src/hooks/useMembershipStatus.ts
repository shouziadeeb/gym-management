import { useMemo } from 'react';

import {
  getMembershipCountdownLabel,
  getMembershipStatus,
  getRemainingDays,
  resolveMembershipExpiryDate,
} from '@/domain/memberships';
import type { Membership } from '@/types/models';

export function useMembershipStatus(
  membership?: (Pick<Membership, 'status' | 'expiry_date'> & { ends_at?: string | null }) | null,
) {
  return useMemo(() => {
    if (!membership) {
      return {
        remainingDays: null,
        status: null,
        countdownLabel: 'No membership',
      };
    }

    if (membership.status === 'cancelled') {
      return {
        remainingDays: null,
        status: 'cancelled' as const,
        countdownLabel: 'Membership cancelled',
      };
    }

    const expiry = resolveMembershipExpiryDate(membership);
    const remainingDays = getRemainingDays(expiry);
    const status = getMembershipStatus(expiry);
    const countdownLabel = getMembershipCountdownLabel(remainingDays);
    return { remainingDays, status, countdownLabel };
  }, [membership]);
}
