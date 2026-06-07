import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

import {
  completeNativeOAuthCallback,
  completeWebOAuthCallbackIfNeeded,
} from '@/lib/auth-oauth-callback';
import { authNavigate } from '@/lib/auth-navigate';
import { getErrorMessage } from '@/lib/errors';
import { finishOAuthFlow } from '@/lib/oauth-finish';
import { useTheme } from '@/hooks/useTheme';
import { logOAuthDebug, snapshotOAuthStorage } from '@/lib/oauth-debug';
import { parseOAuthCallbackUrl } from '@/lib/oauth-callback-url';
import { supabase } from '@/lib/supabase';

/** OAuth callback — web full-page redirect and native Expo deep link (exp://…/--/auth/callback). */
export default function AuthCallbackRoute() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    void (async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          logOAuthDebug('callback.route.mount.web', parseOAuthCallbackUrl(window.location.href));
          snapshotOAuthStorage('callback.route.mount');
        } else {
          logOAuthDebug('callback.route.mount.native', {
            code: params.code ?? null,
            error: params.error ?? null,
          });
        }

        const handled =
          Platform.OS === 'web'
            ? await completeWebOAuthCallbackIfNeeded()
            : await completeNativeOAuthCallback(params);

        if (!handled) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            logOAuthDebug('callback.route.late_session_recovery', {
              userId: data.session.user?.id ?? null,
            });
            await finishOAuthFlow(data.session);
            return;
          }

          setError('Sign-in could not be completed. Please try again.');
        }
      } catch (callbackError) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          logOAuthDebug('callback.route.error_but_logged_in', {
            userId: data.session.user?.id ?? null,
          });
          try {
            await finishOAuthFlow(data.session);
            return;
          } catch {
            const recovered =
              Platform.OS === 'web'
                ? await completeWebOAuthCallbackIfNeeded()
                : await completeNativeOAuthCallback(params);
            if (recovered) return;
          }
        }

        logOAuthDebug('callback.route.error', {
          error: getErrorMessage(callbackError),
        });
        setError(getErrorMessage(callbackError));
      }
    })();
  }, [params.code, params.error, params.error_description]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        padding: 24,
      }}
    >
      {error ? (
        <>
          <Text style={{ color: colors.foreground, textAlign: 'center', marginBottom: 16 }}>
            {error}
          </Text>
          <Pressable onPress={() => authNavigate('/auth/login')}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Back to login</Text>
          </Pressable>
        </>
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
    </View>
  );
}
