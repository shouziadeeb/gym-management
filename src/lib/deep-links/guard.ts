import { Platform } from 'react-native';

import { deepLinkToRoute, parseDeepLink } from '@/lib/deep-links/parse';

/** App route segments that must never be treated as gym slugs in /join/{slug}. */
const RESERVED_JOIN_SLUGS = new Set([
  'scanner',
  'memberships',
  'explore',
  'profile-hub',
  'profile',
  'auth',
  'attendance',
  'attendance-scan',
  'login',
  'signup',
  'index',
  '(tabs)',
  'tabs',
  'dashboard',
  'settings',
  'notifications',
]);

export function isReservedJoinSlug(slug: string): boolean {
  return RESERVED_JOIN_SLUGS.has(slug.toLowerCase());
}

let lastHandledRawUrl: string | null = null;
let lastHandledAt = 0;

const DEDUPE_MS = 2000;

/** Returns true when this exact URL was handled very recently (prevents web navigation loops). */
export function shouldSkipDuplicateDeepLink(raw: string): boolean {
  const now = Date.now();
  if (raw === lastHandledRawUrl && now - lastHandledAt < DEDUPE_MS) {
    return true;
  }
  lastHandledRawUrl = raw;
  lastHandledAt = now;
  return false;
}

export function resetDeepLinkDedupe(): void {
  lastHandledRawUrl = null;
  lastHandledAt = 0;
}

/** True when the app is already showing the deep-link target route. */
export function isAlreadyOnDeepLinkRoute(raw: string): boolean {
  const parsed = parseDeepLink(raw);
  if (parsed.kind === 'unknown') return false;

  const target = deepLinkToRoute(parsed);
  if (!target) return false;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const [targetPath, targetQuery] = target.split('?');
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search.replace(/^\?/, '');

    if (currentPath !== targetPath) return false;
    if (targetQuery) return currentSearch === targetQuery;
    return true;
  }

  return false;
}
