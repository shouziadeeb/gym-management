import '@/lib/crypto-polyfill';
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { AUTH_STORAGE_KEY, createAuthStorage } from '@/lib/auth-storage';
import { assertRequiredEnv, env } from '@/lib/env';
import { logSupabaseAuthConfig } from '@/lib/oauth-debug';

assertRequiredEnv();

if (__DEV__) {
  logSupabaseAuthConfig();
}

export const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    storage: createAuthStorage(),
    storageKey: AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
