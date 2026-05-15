import { differenceInCalendarDays, parseISO } from 'date-fns';

import type { MembershipStatus } from '@/types/models';

export function displayStatus(status: MembershipStatus, endsAt: string): string {
  const days = differenceInCalendarDays(parseISO(endsAt), new Date());
  if (status === 'expired' || days < 0) return 'Expired';
  if (status === 'expiring_soon' || days <= 3) return 'Expiring soon';
  if (status === 'cancelled') return 'Cancelled';
  return 'Active';
}

export function daysUntil(endsAt: string): number {
  return differenceInCalendarDays(parseISO(endsAt), new Date());
}