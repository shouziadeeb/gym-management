import type { Profile } from '@/types/models';

/** Strip non-digits from a phone number or identifier string. */
export function toDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/**
 * Generates a stable fallback display name when the user has not set one.
 * Prefers phone digits, then a suffix of the user id, then a time-based suffix.
 */
export function buildDefaultDisplayName(
  phone: string | null | undefined,
  fallbackId?: string | null,
): string {
  const phoneDigits = toDigits(phone);
  if (phoneDigits.length > 0) return `user${phoneDigits}`;

  const fallbackDigits = toDigits(fallbackId).slice(-8);
  if (fallbackDigits.length > 0) return `user${fallbackDigits}`;

  return `user${Date.now().toString().slice(-6)}`;
}

/** Resolves the best available display name for a profile. */
export function resolveDisplayName(
  fullName: string | null | undefined,
  phone: string | null | undefined,
  fallbackId?: string | null,
): string {
  const trimmed = fullName?.trim();
  if (trimmed) return trimmed;
  return buildDefaultDisplayName(phone, fallbackId);
}

/** Whether onboarding is complete enough for gated app features. */
export function isProfileComplete(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (!profile.onboarding_completed || !profile.full_name?.trim()) return false;

  const isEmailUser = profile.auth_type === 'email' || profile.auth_provider === 'email';
  if (isEmailUser) {
    return Boolean(profile.email?.trim());
  }

  return Boolean(profile.phone);
}
