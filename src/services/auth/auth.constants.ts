/**
 * @file auth.constants.ts
 * Central auth configuration: OTP lengths, cooldowns, bridge email domains,
 * Supabase error code lists, and auth provider identifiers.
 */
/** Primary internal domain for phone→pseudo-email bridge (never shown in UI). */
export const PHONE_BRIDGE_DOMAIN = 'app.local';

/** Legacy bridge domains still accepted at login for existing users. */
export const LEGACY_PHONE_BRIDGE_DOMAINS = ['gymos.app'] as const;

export const PHONE_BRIDGE_PASSWORD_PREFIX = 'bridge_pwd_v1_';

export const DEV_OTP_VALUE = '123456';

export const AUTH_METHODS = ['phone', 'email'] as const;

export const AUTH_PROVIDERS = [
  'phone',
  'phone_email_bridge',
  'email',
  'google',
  'apple',
  'whatsapp',
] as const;

/** OTP digit count for phone + email (signup and login). */
export const OTP_DIGIT_COUNT = 6;

/** @deprecated Use `OTP_DIGIT_COUNT` */
export const PHONE_OTP_LENGTH = OTP_DIGIT_COUNT;

/** @deprecated Use `OTP_DIGIT_COUNT` */
export const EMAIL_OTP_LENGTH = OTP_DIGIT_COUNT;

/** Client-side OTP session limits — keep at or below Supabase Auth OTP TTL. */
export const OTP_EXPIRY_SECONDS_EMAIL = 600;

/** SMS OTP expires quickly on Supabase (typically 60s); client timer must not outlive server. */
export const OTP_EXPIRY_SECONDS_PHONE = 120;

/** @deprecated Use OTP_EXPIRY_SECONDS_EMAIL or OTP_EXPIRY_SECONDS_PHONE */
export const OTP_EXPIRY_SECONDS = OTP_EXPIRY_SECONDS_EMAIL;

export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export const OTP_MAX_VERIFY_ATTEMPTS = 5;

export const OTP_MAX_RESEND_COUNT = 5;

export const SIGNUP_EXISTS_CODES = ['user_already_exists', 'email_exists', 'already_exists'] as const;

export const SIGNUP_EXISTS_MESSAGES = [
  'already registered',
  'already exists',
  'already been registered',
] as const;

export const SIGNUP_RATE_LIMIT_CODES = ['over_email_send_rate_limit'] as const;

export const LOGIN_NOT_FOUND_MESSAGES = ['invalid login credentials', 'user not found'] as const;

export const EMAIL_OTP_TYPES = ['signup', 'magiclink', 'recovery', 'email_change', 'email'] as const;
