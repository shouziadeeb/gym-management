import { Platform } from 'react-native';

type RequiredEnv = {
  EXPO_PUBLIC_SUPABASE_URL: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
};

type OptionalEnv = {
  EXPO_PUBLIC_ENABLE_DEV_AUTH: string;
  EXPO_PUBLIC_ALLOW_PROD_DEV_AUTH: string;
  EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET: string;
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
export const optionalEnv: OptionalEnv = {
  EXPO_PUBLIC_ENABLE_DEV_AUTH: process.env.EXPO_PUBLIC_ENABLE_DEV_AUTH?.trim() ?? '',
  EXPO_PUBLIC_ALLOW_PROD_DEV_AUTH: process.env.EXPO_PUBLIC_ALLOW_PROD_DEV_AUTH?.trim() ?? '',
  EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() ?? '',
};

/** Dev phone bridge + fake SMS OTP. Never applies to email — email always uses Supabase. */
export function isDevPhoneAuthEnabled(): boolean {
  const enableDevAuth = optionalEnv.EXPO_PUBLIC_ENABLE_DEV_AUTH.toLowerCase() === 'true';
  const allowProdDevAuth = optionalEnv.EXPO_PUBLIC_ALLOW_PROD_DEV_AUTH.toLowerCase() === 'true';

  if (__DEV__) return enableDevAuth;

  return enableDevAuth && allowProdDevAuth;
}

/** @deprecated Use `isDevPhoneAuthEnabled` — email auth ignores dev mode. */
export function isDevAuthEnabled(): boolean {
  return isDevPhoneAuthEnabled();
}

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