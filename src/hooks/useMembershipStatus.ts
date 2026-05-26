import { useMemo } from 'react';

import { getMembershipCountdownLabel, getMembershipStatus, getRemainingDays } from '@/domain/memberships';
import type { Membership } from '@/types/models';

export function useMembershipStatus(membership?: Pick<Membership, 'status' | 'expiry_date'> | null) {
  return useMemo(() => {
    if (!membership) {
      return {
        remainingDays: null,
        status: null,
        countdownLabel: 'No membership',
      };
    }

    const remainingDays = getRemainingDays(membership.expiry_date);
    const status = membership.status === 'cancelled' ? 'cancelled' : getMembershipStatus(membership.expiry_date);
    const countdownLabel = getMembershipCountdownLabel(remainingDays);
    return { remainingDays, status, countdownLabel };
  }, [membership]);
}
