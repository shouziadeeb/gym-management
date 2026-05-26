import { format, parseISO } from 'date-fns';

import {
  getMembershipCountdownLabel,
  getMembershipStatus,
  getMembershipStatusLabel,
  getRemainingDays,
  type MembershipDashboardFilter,
  type MembershipDashboardSort,
  type MembershipLifecycleRecord,
} from '@/domain/memberships';
import type { Membership } from '@/types/models';

function resolveExpiryDate(membership: Pick<Membership, 'expiry_date' | 'ends_at'>): string {
  if (membership.expiry_date) return membership.expiry_date;
  return format(parseISO(membership.ends_at), 'yyyy-MM-dd');
}

export function displayStatus(status: Membership['status'], expiryDateOrEndsAt: string): string {
  const safeStatus = status === 'cancelled' ? status : getMembershipStatus(expiryDateOrEndsAt);
  return getMembershipStatusLabel(safeStatus);
}

export function daysUntil(expiryDateOrEndsAt: string): number {
  return getRemainingDays(expiryDateOrEndsAt);
}

export function getMembershipCountdown(membership: Pick<Membership, 'expiry_date' | 'ends_at'>): string {
  const remaining = getRemainingDays(resolveExpiryDate(membership));
  return getMembershipCountdownLabel(remaining);
}

export function filterMemberships(
  rows: MembershipLifecycleRecord[],
  filter: MembershipDashboardFilter,
): MembershipLifecycleRecord[] {
  if (filter === 'all') return rows;
  return rows.filter((row) => row.status === filter);
}

export function sortMemberships(
  rows: MembershipLifecycleRecord[],
  sortBy: MembershipDashboardSort,
): MembershipLifecycleRecord[] {
  const copy = [...rows];
  if (sortBy === 'recently_joined') {
    return copy.sort((a, b) => b.start_date.localeCompare(a.start_date));
  }

  return copy.sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
}