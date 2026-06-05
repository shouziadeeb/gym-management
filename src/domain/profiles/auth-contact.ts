import type { User } from '@supabase/supabase-js';

import { resolveRealEmail } from '@/services/auth/auth.utils';
import type { Profile } from '@/types/models';

/** Whether the account uses email/OAuth (phone optional on profile). */
export function isEmailAuthUser(
  profile: Profile | null | undefined,
  user?: Pick<User, 'email' | 'phone' | 'identities'> | null,
): boolean {
  if (profile?.auth_type === 'email' || profile?.auth_provider === 'email') return true;
  if (profile?.auth_type === 'oauth') return true;
  if (profile?.auth_provider === 'google' || profile?.auth_provider === 'apple') return true;
  if (user?.identities?.some((identity) => identity.provider === 'google' || identity.provider === 'apple')) {
    return true;
  }
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
