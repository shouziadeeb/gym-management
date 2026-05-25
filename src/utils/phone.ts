/**
 * Normalize user-entered phone numbers to E.164 for Supabase Auth.
 * Examples:
 *   9756304445  -> +919756304445
 *   +919756304445 -> +919756304445
 *   91 9756304445   -> +919756304445
 */
export function toE164(raw: string): string {
  if (raw == null || typeof raw !== 'string') {
    throw new Error('Phone number is required');
  }

  const digits = raw.trim().replace(/\D/g, '');

  if (!digits) {
    throw new Error('Enter your phone number');
  }

  if (digits.length < 10) {
    throw new Error('Enter a valid phone number with country code');
  }

  // Already includes country code (e.g. 919756304445)
  if (digits.startsWith('91') && digits.length >= 12) {
    return `+${digits}`;
  }

  // Local 10-digit Indian mobile number without country code
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // Digits with leading 0 stripped (e.g. 0919756304445)
  const withoutLeadingZero = digits.replace(/^0+/, '');
  if (withoutLeadingZero.startsWith('91') && withoutLeadingZero.length >= 12) {
    return `+${withoutLeadingZero}`;
  }
  if (withoutLeadingZero.length === 10) {
    return `+91${withoutLeadingZero}`;
  }

  // Fallback: prepend + if user entered international digits without +
  return `+${digits}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{9,14}$/.test(phone);
}

export function sanitizeIndianPhoneInput(raw: string): string {
  return String(raw ?? '')
    .trim()
    .replace(/\D/g, '');
}

export function isValidIndianMobile10(raw: string): boolean {
  const digits = sanitizeIndianPhoneInput(raw);
  return /^[6-9]\d{9}$/.test(digits);
}

export function normalizeIndianMobile10(raw: string): string {
  const digits = sanitizeIndianPhoneInput(raw);
  if (/^[6-9]\d{9}$/.test(digits)) return digits;

  // Accept E.164-like Indian input +91XXXXXXXXXX (after sanitization => 91XXXXXXXXXX)
  if (digits.length === 12 && digits.startsWith('91')) {
    const local = digits.slice(2);
    if (/^[6-9]\d{9}$/.test(local)) return local;
  }

  throw new Error('Enter a valid 10-digit Indian mobile number');
}

export function toIndianE164(raw: string): string {
  return `+91${normalizeIndianMobile10(raw)}`;
}
