import * as Localization from 'expo-localization';

import { isLanguageCode, type LanguageCode } from '@/i18n/types';

export function resolveDeviceLanguage(): LanguageCode {
  const locale = Localization.getLocales()[0];
  const code = locale?.languageCode?.toLowerCase();
  if (isLanguageCode(code)) {
    return code;
  }
  return 'en';
}
