/** Expo route: /auth/callback — completes Supabase OAuth redirect (web + deep links). */
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { AuthStatusMessage } from '@/components/auth/AuthStatusMessage';
import { useTheme } from '@/hooks/useTheme';
import {
  buildExpoGoHandoffUrl,
  readExpoHostFromCallbackSearch,
  shouldHandoffOAuthToExpoGo,
} from '@/lib/oauth-redirect';
import { mapOAuthErrorMessage } from '@/services/auth/auth.utils';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import {
  completeOAuthFromCode,
  completeOAuthFromUrl,
  resolvePendingOAuthContext,
} from '@/services/auth/providers/oauth.provider';
import { layout, surfaces, text } from '@/theme/classes';

type AuthCallbackParams = {
  code?: string | string[];
  error?: string | string[];
  error_description?: string | string[];
  mode?: AuthScreenMode | AuthScreenMode[];
  redirect?: string | string[];
  expo_host?: string | string[];
};

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function resolvePostAuthTarget(mode?: AuthScreenMode, redirect?: string): string {
  const targetRedirect = typeof redirect === 'string' && redirect.length > 0 ? redirect : '/';
  if (mode === 'signup') {
    return `/profile-setup?redirect=${encodeURIComponent(targetRedirect)}`;
  }
  return targetRedirect;
}

function resolveCallbackUrl(): string | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.href;
  }

  return null;
}

async function finishOAuthNavigation(
  session: Session,
  routeParams?: { mode?: AuthScreenMode; redirect?: string; expoHost?: string },
) {
  if (shouldHandoffOAuthToExpoGo()) {
    const pending = await resolvePendingOAuthContext();
    const handoffUrl = buildExpoGoHandoffUrl(session, pending, routeParams?.expoHost);
    window.location.replace(handoffUrl);
    return;
  }

  const pending = await resolvePendingOAuthContext();
  router.replace(
    resolvePostAuthTarget(
      routeParams?.mode ?? pending?.mode,
      routeParams?.redirect ?? pending?.redirect,
    ) as never,
  );
}

export default function AuthCallbackRoute() {
  const params = useLocalSearchParams<AuthCallbackParams>();
  const { colors } = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [handoffPending, setHandoffPending] = useState(false);

  const code = readParam(params.code);
  const oauthError = readParam(params.error);
  const oauthErrorDescription = readParam(params.error_description);
  const mode = readParam(params.mode) as AuthScreenMode | undefined;
  const redirect = readParam(params.redirect);
  const expoHost =
    readParam(params.expo_host) ??
    (Platform.OS === 'web' && typeof window !== 'undefined'
      ? readExpoHostFromCallbackSearch(window.location.search)
      : undefined);

  useEffect(() => {
    let cancelled = false;

    async function completeSignIn(): Promise<Session> {
      if (oauthError) {
        throw new Error(oauthErrorDescription ?? oauthError);
      }

      if (code) {
        return completeOAuthFromCode(code);
      }

      const webUrl = resolveCallbackUrl();
      if (webUrl) {
        return completeOAuthFromUrl(webUrl);
      }

      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        return completeOAuthFromUrl(initialUrl);
      }

      throw new Error('No OAuth callback data received. Check Supabase redirect URLs.');
    }

    void completeSignIn()
      .then(async (session) => {
        if (cancelled) return;
        if (shouldHandoffOAuthToExpoGo()) {
          setHandoffPending(true);
        }
        await finishOAuthNavigation(session, { mode, redirect, expoHost });
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(mapOAuthErrorMessage(error));
      });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void completeOAuthFromUrl(url)
        .then(async (session) => {
          if (cancelled) return;
          await finishOAuthNavigation(session, { mode, redirect, expoHost });
        })
        .catch((error) => {
          if (cancelled) return;
          setErrorMessage(mapOAuthErrorMessage(error));
        });
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [code, expoHost, mode, oauthError, oauthErrorDescription, redirect]);

  const statusText = handoffPending
    ? 'Returning to Expo Go…'
    : 'Completing Google sign-in…';

  return (
    <View className={`${surfaces.loadingScreen} ${layout.vstackMd} px-6`} style={{ backgroundColor: colors.background }}>
      {!errorMessage ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className={`text-center ${text.bodySm}`}>{statusText}</Text>
        </>
      ) : (
        <>
          <AuthStatusMessage message={errorMessage} tone="error" />
          <Text
            className={`text-center ${text.link}`}
            onPress={() => router.replace('/auth/login' as never)}
            accessibilityRole="link"
          >
            Back to login
          </Text>
        </>
      )}
    </View>
  );
}
