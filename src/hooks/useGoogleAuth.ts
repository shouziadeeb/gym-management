/**
 * @file useGoogleAuth.ts
 * Google OAuth hook with loading and user-facing error messages.
 */
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { isRunningInExpoGo } from '@/lib/oauth-redirect';import { mapOAuthErrorMessage } from '@/services/auth/auth.utils';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import { signInWithGoogle } from '@/services/auth/providers/oauth.provider';

type GoogleAuthOptions = {
  redirect?: string;
};

export function useGoogleAuth(mode: AuthScreenMode = 'login') {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const signIn = useCallback(
    async (options?: GoogleAuthOptions) => {
      setMessage(null);
      setLoading(true);

      try {
        const session = await signInWithGoogle({
          mode,
          redirect: options?.redirect,
        });

        if (!session && isRunningInExpoGo()) {
          setMessage('Finish Google sign-in in your browser. You will return to Expo Go automatically.');
        }

        return session;
      } catch (error) {
        setMessage(mapOAuthErrorMessage(error));
        throw error;
      } finally {
        if (Platform.OS !== 'web') {
          setLoading(false);
        }
      }
    },
    [mode],
  );

  const reset = useCallback(() => {
    setMessage(null);
    setLoading(false);
  }, []);

  return {
    loading,
    message,
    setMessage,
    signInWithGoogle: signIn,
    reset,
  };
}
