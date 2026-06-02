import type { User } from '@supabase/supabase-js';

import { resolveRealEmail } from '@/services/auth/auth.utils';
import type { Profile } from '@/types/models';

/** Whether the account was created with email OTP (phone optional on profile). */
export function isEmailAuthUser(
  profile: Profile | null | undefined,
  user?: Pick<User, 'email' | 'phone'> | null,
): boolean {
  if (profile?.auth_type === 'email' || profile?.auth_provider === 'email') return true;
  if (user && !user.phone?.trim()) {
    return Boolean(resolveRealEmail(user));
  }
  return false;
}

/** Best available email for display — profile row first, then Supabase auth user. */
export function resolveProfileEmail(
  profile: Profile | null | undefined,
  user?: Pick<User, 'email'> | null,
): string | null {
  const profileEmail = profile?.email?.trim();
  if (profileEmail) return profileEmail;
  if (!user) return null;
  return resolveRealEmail(user);
}
