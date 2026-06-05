import type { LanguageCode } from '@/i18n/types';

export const LANGUAGE_OPTIONS: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'ur', label: 'اردو' },
  { value: 'ar', label: 'العربية' },
];

export function isRtlLanguage(language: LanguageCode): boolean {
  return language === 'ar' || language === 'ur';
}
