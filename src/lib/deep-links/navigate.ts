import { router } from 'expo-router';

import { recordDeepLinkEvent } from '@/api/deep-link-events.api';
import { authLog } from '@/lib/auth-log';
import { isAlreadyOnDeepLinkRoute } from '@/lib/deep-links/guard';
import { deepLinkToRoute, parseDeepLink, type ParsedDeepLink } from '@/lib/deep-links/parse';

let pendingDeepLink: ParsedDeepLink | null = null;

/** Stores a deep link until auth bootstrap completes. */
export function queuePendingDeepLink(raw: string): ParsedDeepLink | null {
  const parsed = parseDeepLink(raw);
  if (parsed.kind === 'unknown') return null;
  pendingDeepLink = parsed;
  authLog.auth('deep_link.queued', { kind: parsed.kind });
  return parsed;
}

export function consumePendingDeepLink(): ParsedDeepLink | null {
  const link = pendingDeepLink;
  pendingDeepLink = null;
  return link;
}

function trackDeepLinkOpen(link: ParsedDeepLink): void {
  const eventType = link.kind === 'join' ? 'qr_scan_join' : link.kind === 'attendance' ? 'qr_scan_attendance' : null;
  if (!eventType) return;

  void recordDeepLinkEvent({
    eventType,
    metadata: link.kind === 'join' ? { slug: link.slug } : { hasToken: Boolean(link.token) },
  }).catch(() => undefined);
}

/** Parses and navigates to the matching Expo Router screen. */
export function navigateDeepLink(raw: string, options?: { replace?: boolean }): boolean {
  if (isAlreadyOnDeepLinkRoute(raw)) {
    return false;
  }

  const parsed = parseDeepLink(raw);
  if (parsed.kind === 'unknown') {
    authLog.authWarn('deep_link.unrecognized', { raw: raw.slice(0, 120) });
    return false;
  }

  const route = deepLinkToRoute(parsed);
  if (!route) return false;

  trackDeepLinkOpen(parsed);
  authLog.navigation('deep_link.route', { route, kind: parsed.kind });

  if (options?.replace) {
    router.replace(route as never);
  } else {
    router.push(route as never);
  }

  return true;
}

/** Resume a queued link after authentication initializes. */
export function navigatePendingDeepLink(options?: { replace?: boolean }): boolean {
  const pending = consumePendingDeepLink();
  if (!pending) return false;

  const route = deepLinkToRoute(pending);
  if (!route) return false;

  authLog.navigation('deep_link.resume', { route, kind: pending.kind });

  if (options?.replace) {
    router.replace(route as never);
  } else {
    router.push(route as never);
  }

  return true;
}
