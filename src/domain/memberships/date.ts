import { addMonths, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';

import { MEMBERSHIP_DURATION_MONTHS } from '@/domain/memberships/config';
import { MEMBERSHIP_EXPIRING_SOON_DAYS, type MembershipPlanType } from '@/domain/memberships/types';
import type { MembershipStatus } from '@/types/models';

function parseIsoDateOnly(isoDate: string): Date {
  return parseISO(`${isoDate}T00:00:00.000Z`);
}

function toDateOnlyIso(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function safeToday(now: Date = new Date()): Date {
  if (!isValid(now)) return new Date();
  return parseIsoDateOnly(format(now, 'yyyy-MM-dd'));
}

export function calculateExpiryDate(startDate: string, planType: MembershipPlanType): string {
  const base = parseIsoDateOnly(startDate);
  if (!isValid(base)) {
    throw new Error('Invalid membership start date.');
  }

  const months = MEMBERSHIP_DURATION_MONTHS[planType];
  return toDateOnlyIso(addMonths(base, months));
}

export function getRemainingDays(expiryDate: string, now: Date = new Date()): number {
  const expiry = parseIsoDateOnly(expiryDate);
  if (!isValid(expiry)) {
    throw new Error('Invalid membership expiry date.');
  }
  return differenceInCalendarDays(expiry, safeToday(now));
}

export function isMembershipExpired(expiryDate: string, now: Date = new Date()): boolean {
  return getRemainingDays(expiryDate, now) < 0;
}

export function getMembershipStatus(expiryDate: string, now: Date = new Date()): MembershipStatus {
  const remaining = getRemainingDays(expiryDate, now);
  if (remaining < 0) return 'expired';
  if (remaining <= MEMBERSHIP_EXPIRING_SOON_DAYS) return 'expiring_soon';
  return 'active';
}
