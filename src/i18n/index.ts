import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resolveDeviceLanguage } from '@/i18n/device-language';
import { resources } from '@/i18n/resources';

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveDeviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'hi', 'ur', 'ar'],
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
