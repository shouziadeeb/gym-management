import * as Updates from 'expo-updates';
import { I18nManager, Platform } from 'react-native';

import { isRtlLanguage } from '@/i18n/config';
import i18n from '@/i18n';
import type { LanguageCode } from '@/i18n/types';

export function applyRtlForLanguage(language: LanguageCode): boolean {
  const shouldRtl = isRtlLanguage(language);
  if (I18nManager.isRTL === shouldRtl) {
    return false;
  }

  I18nManager.allowRTL(shouldRtl);
  I18nManager.forceRTL(shouldRtl);
  return true;
}

export async function changeAppLanguage(language: LanguageCode): Promise<{ needsReload: boolean }> {
  await i18n.changeLanguage(language);
  const needsReload = applyRtlForLanguage(language);
  return { needsReload };
}

export async function reloadAppForLayoutChange(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return;
  }

  try {
    await Updates.reloadAsync();
  } catch {
    // Dev client without updates — user can manually restart.
  }
}
