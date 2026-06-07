import type { Session } from '@supabase/supabase-js';

import { extractAuthCodeFromUrl } from '@/lib/oauth-callback-url';
import { logOAuthDebug } from '@/lib/oauth-debug';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

/** Prevents duplicate PKCE exchanges when WebBrowser and /auth/callback race. */
const inflightByCode = new Map<string, Promise<Session>>();

async function recoverSessionFromClient(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/** Exchange an authorization code once; recover session if code was already consumed. */
export async function exchangeOAuthCodeOnce(authCode: string): Promise<Session> {
  const inflight = inflightByCode.get(authCode);
  if (inflight) {
    logOAuthDebug('exchangeOAuthCodeOnce.reuse', { authCodePreview: `${authCode.slice(0, 8)}…` });
    return inflight;
  }

  const promise = (async () => {
    logOAuthDebug('exchangeOAuthCodeOnce.start', { authCodePreview: `${authCode.slice(0, 8)}…` });

    const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      logOAuthDebug('exchangeOAuthCodeOnce.error', { message: error.message });
      logger.warn('auth.oauth.exchangeCodeForSession failed', { error: error.message });

      const recovered = await recoverSessionFromClient();
      if (recovered) {
        logOAuthDebug('exchangeOAuthCodeOnce.recovered', { userId: recovered.user?.id ?? null });
        return recovered;
      }

      throw error;
    }

    if (!data.session) {
      throw new Error('Sign-in succeeded but no session was returned.');
    }

    return data.session;
  })();

  inflightByCode.set(authCode, promise);

  try {
    return await promise;
  } finally {
    inflightByCode.delete(authCode);
  }
}

/** Exchanges the OAuth callback URL for a Supabase session (PKCE). */
export async function completeOAuthSessionFromUrl(url: string): Promise<Session> {
  const authCode = extractAuthCodeFromUrl(url);

  logOAuthDebug('completeOAuthSessionFromUrl.input', {
    callbackUrl: url,
    authCodePresent: Boolean(authCode),
    authCodePreview: authCode ? `${authCode.slice(0, 8)}…` : null,
  });

  if (!authCode) {
    const recovered = await recoverSessionFromClient();
    if (recovered) return recovered;
    throw new Error('No authorization code in OAuth callback URL.');
  }

  return exchangeOAuthCodeOnce(authCode);
}
