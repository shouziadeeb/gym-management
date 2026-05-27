import type { MembershipStatus } from '@/types/models';

export type MembershipStatusTone = 'green' | 'yellow' | 'red' | 'gray';

export function getMembershipStatusLabel(status: MembershipStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'expiring_soon':
      return 'Expiring Soon';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

export function getMembershipStatusTone(status: MembershipStatus): MembershipStatusTone {
  switch (status) {
    case 'active':
      return 'green';
    case 'expiring_soon':
      return 'yellow';
    case 'expired':
      return 'red';
    default:
      return 'gray';
  }
}

export function getMembershipCountdownLabel(remainingDays: number | null): string {
  if (remainingDays === null) return 'Expiry date not set yet';
  if (remainingDays < 0) return `Expired ${Math.abs(remainingDays)} day(s) ago`;
  if (remainingDays === 0) return 'Expires today';
  return `${remainingDays} day(s) left`;
}
