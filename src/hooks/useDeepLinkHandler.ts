import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useEffect, useRef } from 'react';

import { authLog } from '@/lib/auth-log';
import {
  isAlreadyOnDeepLinkRoute,
  shouldSkipDuplicateDeepLink,
} from '@/lib/deep-links/guard';
import {
  navigateDeepLink,
  navigatePendingDeepLink,
  queuePendingDeepLink,
} from '@/lib/deep-links/navigate';
import { parseDeepLink } from '@/lib/deep-links/parse';
import { useAuthStore } from '@/store/auth.store';

/**
 * Handles cold-start and warm deep links for join + attendance QR flows.
 * On web, Expo Router owns URL state — we only process explicit external entry once.
 */
export function useDeepLinkHandler() {
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);
  const handledInitialRef = useRef(false);
  const pendingResumeRef = useRef(false);

  useEffect(() => {
    if (!initialized || !session || pendingResumeRef.current) return;
    pendingResumeRef.current = true;
    navigatePendingDeepLink({ replace: true });
  }, [initialized, session]);

  useEffect(() => {
    const handleUrl = (url: string, source: 'initial' | 'event') => {
      if (shouldSkipDuplicateDeepLink(url)) {
        return;
      }

      if (isAlreadyOnDeepLinkRoute(url)) {
        return;
      }

      const parsed = parseDeepLink(url);
      if (parsed.kind === 'unknown') {
        return;
      }

      authLog.auth('deep_link.received', { url: url.slice(0, 160), source });

      const initializedNow = useAuthStore.getState().initialized;
      const hasSession = Boolean(useAuthStore.getState().session);

      if (!initializedNow || !hasSession) {
        queuePendingDeepLink(url);
        return;
      }

      navigateDeepLink(url, { replace: true });
    };

    // Web: Expo Router syncs the browser URL — Linking "url" events cause navigate loops.
    if (Platform.OS === 'web') {
      if (!handledInitialRef.current) {
        handledInitialRef.current = true;
        void Linking.getInitialURL().then((url) => {
          if (url) handleUrl(url, 'initial');
        });
      }
      return;
    }

    if (!handledInitialRef.current) {
      handledInitialRef.current = true;
      void Linking.getInitialURL().then((url) => {
        if (url) handleUrl(url, 'initial');
      });
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url, 'event');
    });

    return () => subscription.remove();
  }, []);
}
