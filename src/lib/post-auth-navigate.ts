import type { Session } from '@supabase/supabase-js';

import type { EnsureProfileOptions } from '@/api/profiles.api';
import { completeSignIn } from '@/services/auth/complete-sign-in';
import type { AuthScreenMode } from '@/services/auth/auth.types';

/** After auth success: ensure profile, sync store, warm cache, then navigate. */
export async function postAuthNavigate(
  session: Session,
  mode: AuthScreenMode,
  redirect?: string,
  authMethod?: 'phone' | 'email' | 'google' | null,
  profileOptions?: EnsureProfileOptions,
): Promise<void> {
  await completeSignIn({
    session,
    mode,
    redirect,
    authMethod,
    profileOptions,
  });
}
