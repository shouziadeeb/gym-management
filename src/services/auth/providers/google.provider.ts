/**
 * @file google.provider.ts
 * Native Google Sign-In (Android/iOS) via ID token + Supabase signInWithIdToken.
 * Web continues to use Supabase OAuth redirect flow.
 */
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import type { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { authLog } from '@/lib/auth-log';
import { getOAuthRedirectUri, logOAuthRedirectDiagnostics } from '@/lib/auth-redirect-uri';
import { clearOAuthPendingStorage } from '@/lib/auth-oauth-cleanup';
import { logOAuthDebug, snapshotOAuthStorage } from '@/lib/oauth-debug';
import { finishOAuthFlow, resetOAuthFinishState } from '@/lib/oauth-finish';
import { saveOAuthPending } from '@/lib/oauth-pending';
import { postAuthNavigate } from '@/lib/post-auth-navigate';
import { supabase } from '@/lib/supabase';
import {
  assertGoogleSignInConfigured,
  ensureGoogleSignInConfigured,
} from '@/services/auth/google-signin.config';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import { useAuthStore } from '@/store/auth.store';

function googleQueryParams(mode: AuthScreenMode) {
  return {
    access_type: 'offline',
    prompt: mode === 'signup' ? 'consent' : 'select_account',
  };
}

async function beginGoogleOAuth(mode: AuthScreenMode, redirect?: string): Promise<string> {
  resetOAuthFinishState();
  clearOAuthPendingStorage();
  await saveOAuthPending({ mode, redirect });

  const redirectTo = getOAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: googleQueryParams(mode),
    },
  });

  if (error) {
    authLog.googleWarn('oauth.begin_failed', { mode, error: error.message });
    throw error;
  }

  if (!data.url) {
    throw new Error('Could not start Google sign-in. Check Supabase Google provider settings.');
  }

  return data.url;
}

async function signInWithGoogleWeb(
  mode: AuthScreenMode,
  redirect?: string,
): Promise<Session> {
  logOAuthRedirectDiagnostics('web.signInWithOAuth');

  logOAuthDebug('signInWithOAuth.before', {
    mode,
    redirectTo: getOAuthRedirectUri(),
    origin: typeof window !== 'undefined' ? window.location.origin : null,
  });
  snapshotOAuthStorage('signInWithOAuth.before');

  const url = await beginGoogleOAuth(mode, redirect);

  snapshotOAuthStorage('signInWithOAuth.after');
  logOAuthDebug('signInWithOAuth.after', {
    oauthUrl: url,
    codeVerifierKey: 'gym-auth-code-verifier',
  });

  if (typeof window !== 'undefined') {
    window.location.assign(url);
  }

  return new Promise<Session>(() => {});
}

async function signInWithGoogleNativeIdToken(
  mode: AuthScreenMode,
  redirect?: string,
): Promise<Session> {
  assertGoogleSignInConfigured();
  ensureGoogleSignInConfigured();

  const store = useAuthStore.getState();
  store.setPhase('signing_in');
  store.setLastError(null);

  authLog.google('sign_in.started', { mode, platform: Platform.OS });

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) {
      throw new Error('Google sign-in was cancelled');
    }

    if (!isSuccessResponse(response)) {
      throw new Error('Google sign-in failed. Please try again.');
    }

    authLog.google('account.selected', {
      email: response.data.user.email ?? null,
    });

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error('Google did not return an ID token. Check Web Client ID configuration.');
    }

    authLog.google('id_token.received');

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      authLog.googleError('supabase.sign_in_failed', { error: error.message });
      throw error;
    }

    const session = data.session;
    if (!session) {
      throw new Error('Sign-in succeeded but no Supabase session was returned.');
    }

    authLog.session('created', { userId: session.user.id });

    await postAuthNavigate(session, mode, redirect, 'google', {
      authMethod: 'oauth',
      authProvider: 'google',
    });

    authLog.google('sign_in.completed', { userId: session.user.id, mode });
    return session;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Google sign-in was cancelled');
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google sign-in is already in progress.');
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services is not available on this device.');
      }
    }

    const hasSession = Boolean(useAuthStore.getState().session);
    useAuthStore.getState().setPhase(hasSession ? 'ready' : 'anonymous');
    throw error;
  }
}

/** Google sign-in: native account picker + ID token on mobile; OAuth redirect on web. */
export async function signInWithGoogle(
  mode: AuthScreenMode = 'login',
  redirect?: string,
): Promise<Session> {
  if (Platform.OS === 'web') {
    return signInWithGoogleWeb(mode, redirect);
  }
  return signInWithGoogleNativeIdToken(mode, redirect);
}
