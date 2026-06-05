export type LanguageCode = 'en' | 'hi' | 'ur' | 'ar';

export const SUPPORTED_LANGUAGES: LanguageCode[] = ['en', 'hi', 'ur', 'ar'];

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && SUPPORTED_LANGUAGES.includes(value as LanguageCode);
}
