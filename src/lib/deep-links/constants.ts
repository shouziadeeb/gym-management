import { getWebAppOrigin } from '@/lib/env';

/** @deprecated Use getWebAppOrigin() — kept for imports that expect a constant. */
export const GYMOS_WEB_ORIGIN = getWebAppOrigin();

/** Custom URL scheme (align with app.json `scheme` during migration). */
export const GYMOS_APP_SCHEME = 'gymos';

/** Legacy scheme — accept during transition from gymapp → gymos. */
export const LEGACY_APP_SCHEME = 'gymapp';

export const DEEP_LINK_PATHS = {
  join: 'join',
  attendance: 'attendance',
} as const;

export type DeepLinkKind = 'join' | 'attendance' | 'unknown';

export type ParsedDeepLink =
  | { kind: 'join'; slug: string; sig?: string; exp?: string }
  | { kind: 'attendance'; token: string }
  | { kind: 'unknown'; raw: string };
