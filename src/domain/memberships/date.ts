import { addMonths, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';

import { DATE_FORMAT } from '@/constants/date';
import { MEMBERSHIP_DURATION_MONTHS } from '@/domain/memberships/config';
import { MEMBERSHIP_EXPIRING_SOON_DAYS, type MembershipPlanType } from '@/domain/memberships/types';
import type { MembershipStatus } from '@/types/models';

function parseIsoDateOnly(isoDate: string): Date {
  return parseISO(`${isoDate.trim()}T00:00:00.000Z`);
}

function toDateOnlyIso(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function safeToday(now: Date = new Date()): Date {
  if (!isValid(now)) return new Date();
  return parseIsoDateOnly(format(now, 'yyyy-MM-dd'));
}

/** Parse yyyy-MM-dd or ISO datetime — returns null instead of throwing (safe for UI). */
export function parseMembershipDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();
  const parsed = trimmed.includes('T') ? parseISO(trimmed) : parseIsoDateOnly(trimmed);
  return isValid(parsed) ? parsed : null;
}

export function formatMembershipLongDate(value: string | null | undefined): string | null {
  const parsed = parseMembershipDate(value);
  if (!parsed) return null;
  return format(parsed, DATE_FORMAT.long);
}

/** Prefer `expiry_date`, then normalize `ends_at` to yyyy-MM-dd for countdown/status. */
export function resolveMembershipExpiryDate(membership: {
  expiry_date?: string | null;
  ends_at?: string | null;
}): string | null {
  if (membership.expiry_date?.trim()) return membership.expiry_date.trim();

  if (!membership.ends_at?.trim()) return null;

  const parsed = parseMembershipDate(membership.ends_at);
  if (parsed) return toDateOnlyIso(parsed);

  const datePart = membership.ends_at.trim().slice(0, 10);
  return parseMembershipDate(datePart) ? datePart : null;
}

export function calculateExpiryDate(startDate: string, planType: MembershipPlanType): string {
  const base = parseIsoDateOnly(startDate);
  if (!isValid(base)) {
    throw new Error('Invalid membership start date.');
  }

  const months = MEMBERSHIP_DURATION_MONTHS[planType];
  return toDateOnlyIso(addMonths(base, months));
}

/** Days until expiry; null when date is missing or invalid (never throws). */
export function getRemainingDays(expiryDate: string | null | undefined, now: Date = new Date()): number | null {
  const parsed = parseMembershipDate(expiryDate);
  if (!parsed) return null;
  return differenceInCalendarDays(parsed, safeToday(now));
}

export function isMembershipExpired(expiryDate: string | null | undefined, now: Date = new Date()): boolean {
  const remaining = getRemainingDays(expiryDate, now);
  if (remaining === null) return false;
  return remaining < 0;
}

export function getMembershipStatus(
  expiryDate: string | null | undefined,
  now: Date = new Date(),
): MembershipStatus {
  const remaining = getRemainingDays(expiryDate, now);
  if (remaining === null) return 'active';
  if (remaining < 0) return 'expired';
  if (remaining <= MEMBERSHIP_EXPIRING_SOON_DAYS) return 'expiring_soon';
  return 'active';
}
