import Constants from 'expo-constants';
import { Platform, Text, View } from 'react-native';

import {
  buildOAuthRedirectUri,
  getSupabaseOAuthSetupInstructions,
} from '@/lib/oauth-redirect';
import { layout, text } from '@/theme/classes';

/** Dev-only hint: shows the exact redirect URL to allowlist in Supabase for Expo Go. */
export function SupabaseOAuthDevHint() {
  if (!__DEV__ || Platform.OS === 'web') return null;

  const redirectUri = buildOAuthRedirectUri();
  const instructions = getSupabaseOAuthSetupInstructions(redirectUri);

  return (
    <View className={`${layout.vstackSm} rounded-xl border border-amber-500/40 bg-amber-500/10 p-3`}>
      <Text className={`${text.caption} font-semibold text-amber-700 dark:text-amber-300`}>
        Expo Go uses your deployed HTTPS callback
      </Text>
      <Text className={`${text.caption} text-amber-800 dark:text-amber-200`}>
        Google sign-in opens the production callback below, then returns to Expo Go. Ensure Supabase
        Redirect URLs include:
      </Text>
      {instructions.map((line) => (
        <Text key={line} className={`${text.caption} font-mono text-amber-900 dark:text-amber-100`}>
          {line}
        </Text>
      ))}
      <Text className={`${text.caption} text-amber-800 dark:text-amber-200`}>
        Site URL: http://localhost:8081. Deploy latest app to Vercel so /auth/callback can hand off to
        Expo host {Constants.expoConfig?.hostUri ?? 'unknown'}.
      </Text>
    </View>
  );
}
