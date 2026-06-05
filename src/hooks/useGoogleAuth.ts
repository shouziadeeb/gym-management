/**
 * @file useGoogleAuth.ts
 * Google OAuth hook for login and signup screens.
 */
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { mapGoogleAuthErrorMessage } from '@/services/auth/auth.utils';
import type { AuthScreenMode } from '@/services/auth/auth.types';
import { hybridAuth } from '@/services/auth/hybrid-auth.service';

export function useGoogleAuth(mode: AuthScreenMode = 'login', redirect?: string) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setMessage(null);
    setLoading(true);
    try {
      return await hybridAuth.signInWithGoogle(mode, redirect);
    } catch (error) {
      setMessage(mapGoogleAuthErrorMessage(error));
      throw error;
    } finally {
      if (Platform.OS !== 'web') {
        setLoading(false);
      }
    }
  }, [mode, redirect]);

  const reset = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    loading,
    message,
    signIn,
    reset,
  };
}
