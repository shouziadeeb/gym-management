import { Platform } from 'react-native';

type RequiredEnv = {
  EXPO_PUBLIC_SUPABASE_URL: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
};

function readEnv(): RequiredEnv {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

  return {
    EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  };
}

export const env = readEnv();

export function assertRequiredEnv(): void {
  const missing = Object.entries(env)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length === 0) return;

  throw new Error(
    `Missing required env variables: ${missing.join(', ')}. Platform=${Platform.OS}. ` +
      'Create .env and define EXPO_PUBLIC_* values.',
  );
}