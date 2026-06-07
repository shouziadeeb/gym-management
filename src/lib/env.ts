import { Platform } from 'react-native';

type RequiredEnv = {
  EXPO_PUBLIC_SUPABASE_URL: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
};

type OptionalEnv = {
  /** Phone-only: fake OTP + @app.local bridge. Email auth never reads this. */
  EXPO_PUBLIC_ENABLE_DEV_PHONE_AUTH: string;
  /** @deprecated Alias for EXPO_PUBLIC_ENABLE_DEV_PHONE_AUTH (phone only). */
  EXPO_PUBLIC_ENABLE_DEV_AUTH: string;
  EXPO_PUBLIC_ALLOW_PROD_DEV_AUTH: string;
  EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET: string;
  /** Google Cloud Web OAuth client ID — required for native Google Sign-In. */
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
  /** Google Cloud iOS OAuth client ID — recommended for iOS native sign-in. */
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: string;
  /** Reversed iOS client ID URL scheme for Expo config plugin (com.googleusercontent.apps.*). */
  EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME: string;
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
  EXPO_PUBLIC_ENABLE_DEV_PHONE_AUTH: process.env.EXPO_PUBLIC_ENABLE_DEV_PHONE_AUTH?.trim() ?? '',
  EXPO_PUBLIC_ENABLE_DEV_AUTH: process.env.EXPO_PUBLIC_ENABLE_DEV_AUTH?.trim() ?? '',
  EXPO_PUBLIC_ALLOW_PROD_DEV_AUTH: process.env.EXPO_PUBLIC_ALLOW_PROD_DEV_AUTH?.trim() ?? '',
  EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() ?? '',
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '',
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '',
  EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim() ?? '',
};

/** Native Google Sign-In client IDs from environment. */
export function getGoogleSignInEnv(): {
  webClientId: string | null;
  iosClientId: string | null;
  iosUrlScheme: string | null;
} {
  return {
    webClientId: optionalEnv.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || null,
    iosClientId: optionalEnv.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || null,
    iosUrlScheme: optionalEnv.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME || null,
  };
}

function parseEnvBoolean(raw: string): boolean | null {
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return null;
}

/**
 * Resolves phone-only dev auth flag.
 * Priority: EXPO_PUBLIC_ENABLE_DEV_PHONE_AUTH → legacy EXPO_PUBLIC_ENABLE_DEV_AUTH → default (__DEV__ ? on : off).
 */
function resolveDevPhoneAuthExplicit(): boolean | null {
  const phoneFlag = parseEnvBoolean(optionalEnv.EXPO_PUBLIC_ENABLE_DEV_PHONE_AUTH);
  if (phoneFlag !== null) return phoneFlag;

  const legacyFlag = parseEnvBoolean(optionalEnv.EXPO_PUBLIC_ENABLE_DEV_AUTH);
  if (legacyFlag !== null) return legacyFlag;

  return null;
}

/**
 * Dev phone bridge + fake SMS OTP (123456). Never applies to email — email always uses Supabase OTP.
 */
export function isDevPhoneAuthEnabled(): boolean {
  const explicit = resolveDevPhoneAuthExplicit();
  const allowProdDevAuth = parseEnvBoolean(optionalEnv.EXPO_PUBLIC_ALLOW_PROD_DEV_AUTH) === true;

  if (explicit !== null) {
    if (!explicit) return false;
    if (__DEV__) return true;
    return allowProdDevAuth;
  }

  // Unset: dev client uses phone bridge; release/preview builds use real SMS unless ALLOW_PROD_DEV_AUTH
  if (__DEV__) return true;
  return allowProdDevAuth;
}

/** Email OTP always goes through Supabase — there is no dev email bypass. */
export function isDevEmailAuthEnabled(): boolean {
  return false;
}

/** @deprecated Use `isDevPhoneAuthEnabled` — email auth ignores dev mode. */
export function isDevAuthEnabled(): boolean {
  return isDevPhoneAuthEnabled();
}

/** Debug summary for auth routing (phone dev vs prod SMS, email always Supabase). */
export function getAuthEnvSummary(): {
  phoneMode: 'dev_bridge' | 'supabase_sms';
  emailMode: 'supabase_otp';
  isDevClient: boolean;
} {
  return {
    phoneMode: isDevPhoneAuthEnabled() ? 'dev_bridge' : 'supabase_sms',
    emailMode: 'supabase_otp',
    isDevClient: __DEV__,
  };
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
