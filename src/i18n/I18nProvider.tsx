import { ReactNode, useEffect } from 'react';

import { loadSettingsPreferences } from '@/features/settings/settings-preferences';
import '@/i18n';
import { applyRtlForLanguage, changeAppLanguage } from '@/i18n/language';

type I18nProviderProps = {
  children: ReactNode;
};

/** Applies saved language without blocking first paint. */
export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    void loadSettingsPreferences().then(async (prefs) => {
      applyRtlForLanguage(prefs.language);
      await changeAppLanguage(prefs.language);
    });
  }, []);

  return children;
}
