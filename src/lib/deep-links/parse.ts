import {
  DEEP_LINK_PATHS,
  GYMOS_APP_SCHEME,
  LEGACY_APP_SCHEME,
  type ParsedDeepLink,
} from '@/lib/deep-links/constants';
import { isReservedJoinSlug } from '@/lib/deep-links/guard';
import { parseAttendanceScanPayload } from '@/features/attendance/domain/qr-payload';
import { getTrustedWebHosts } from '@/lib/env';

const SCHEMES = [GYMOS_APP_SCHEME, LEGACY_APP_SCHEME, 'https', 'http'] as const;

function tryParseUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  for (const scheme of [GYMOS_APP_SCHEME, LEGACY_APP_SCHEME]) {
    if (trimmed.startsWith(`${scheme}://`)) {
      try {
        return new URL(trimmed.replace(`${scheme}://`, 'https://'));
      } catch {
        return null;
      }
    }
  }

  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
}

function parseJoinPath(pathname: string, searchParams: URLSearchParams): ParsedDeepLink | null {
  const segments = pathname.split('/').filter(Boolean);
  const joinIndex = segments.indexOf(DEEP_LINK_PATHS.join);
  const slug = joinIndex >= 0 ? segments[joinIndex + 1] : segments[0];

  if (!slug || slug === DEEP_LINK_PATHS.join) return null;
  if (isReservedJoinSlug(slug)) return null;

  return {
    kind: 'join',
    slug: decodeURIComponent(slug),
    sig: searchParams.get('sig') ?? undefined,
    exp: searchParams.get('exp') ?? undefined,
  };
}

function parseAttendancePath(searchParams: URLSearchParams, pathname: string): ParsedDeepLink | null {
  const tokenFromQuery = searchParams.get('token') ?? searchParams.get('t');
  if (tokenFromQuery) {
    const token = parseAttendanceScanPayload(tokenFromQuery);
    if (token) return { kind: 'attendance', token };
  }

  const segments = pathname.split('/').filter(Boolean);
  const attendanceIndex = segments.indexOf(DEEP_LINK_PATHS.attendance);
  if (attendanceIndex >= 0) {
    const maybeToken = segments[attendanceIndex + 1];
    if (maybeToken?.startsWith('gat_')) {
      return { kind: 'attendance', token: maybeToken };
    }
  }

  return null;
}

/** Parse gym join / attendance URLs, custom schemes, and legacy JSON QR payloads. */
export function parseDeepLink(raw: string): ParsedDeepLink {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'unknown', raw: trimmed };

  const attendanceToken = parseAttendanceScanPayload(trimmed);
  if (attendanceToken) {
    return { kind: 'attendance', token: attendanceToken };
  }

  const url = tryParseUrl(trimmed);
  if (!url) return { kind: 'unknown', raw: trimmed };

  const host = url.hostname.toLowerCase();
  const trustedHosts = getTrustedWebHosts();
  const isAppHost = trustedHosts.includes(host);

  const isCustomSchemePath = !url.protocol.startsWith('http');

  if (!isAppHost && !isCustomSchemePath && url.protocol.startsWith('http')) {
    return { kind: 'unknown', raw: trimmed };
  }

  const joinLink = parseJoinPath(url.pathname, url.searchParams);
  if (joinLink) return joinLink;

  const attendanceLink = parseAttendancePath(url.searchParams, url.pathname);
  if (attendanceLink) return attendanceLink;

  return { kind: 'unknown', raw: trimmed };
}

export function deepLinkToRoute(link: ParsedDeepLink): string | null {
  if (link.kind === 'join') {
    return `/join/${encodeURIComponent(link.slug)}`;
  }
  if (link.kind === 'attendance') {
    const params = new URLSearchParams({ token: link.token });
    return `/attendance-scan?${params.toString()}`;
  }
  return null;
}

export { SCHEMES };
