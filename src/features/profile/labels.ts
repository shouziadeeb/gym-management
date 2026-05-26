import type { Profile } from '@/types/models';

export const PROFILE_GENDER_OPTIONS = [
  { value: 'male' as const, label: 'Male' },
  { value: 'female' as const, label: 'Female' },
  { value: 'prefer_not_to_say' as const, label: 'Prefer not to say' },
];

export type ProfileGenderValue = (typeof PROFILE_GENDER_OPTIONS)[number]['value'];

export function formatGenderLabel(gender: Profile['gender']): string {
  if (!gender) return 'Not set';
  const match = PROFILE_GENDER_OPTIONS.find((option) => option.value === gender);
  if (match) return match.label;
  if (gender === 'other') return 'Other';
  return gender.replace(/_/g, ' ');
}

export function formatDateLabel(isoDate: string | null | undefined): string {
  if (!isoDate?.trim()) return 'Not set';
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ageFromDateOfBirth(isoDate: string): number | null {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDelta = today.getMonth() - parsed.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < parsed.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(isoDate: string | null | undefined): Date | null {
  if (!isoDate?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const parsed = new Date(`${isoDate}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
