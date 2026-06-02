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
        Expo Go Google sign-in uses exp:// (not LAN http)
      </Text>
      <Text className={`${text.caption} text-amber-800 dark:text-amber-200`}>
        Supabase blocks private http://10.x.x.x redirects. Add these exp:// entries in Redirect
        URLs (one per line). You can remove the http://10.x.x.x entries.
      </Text>
      {instructions.map((line) => (
        <Text key={line} className={`${text.caption} font-mono text-amber-900 dark:text-amber-100`}>
          {line}
        </Text>
      ))}
      <Text className={`${text.caption} text-amber-800 dark:text-amber-200`}>
        Sign-in opens in an in-app browser and returns to Expo Go automatically. Host:{' '}
        {Constants.expoConfig?.hostUri ?? 'unknown'}.
      </Text>
    </View>
  );
}
