import { DEEP_LINK_PATHS, GYMOS_APP_SCHEME } from '@/lib/deep-links/constants';
import { getWebAppOrigin } from '@/lib/env';

/** Build HTTPS join URL for printed QR codes. */
export function buildJoinQrUrl(slug: string): string {
  return `${getWebAppOrigin()}/${DEEP_LINK_PATHS.join}/${encodeURIComponent(slug)}`;
}

/** Build HTTPS attendance URL for printed QR codes. */
export function buildAttendanceQrUrl(token: string): string {
  const params = new URLSearchParams({ token });
  return `${getWebAppOrigin()}/${DEEP_LINK_PATHS.attendance}?${params.toString()}`;
}

/** Build custom-scheme URL for in-app sharing. */
export function buildAppJoinUrl(slug: string): string {
  return `${GYMOS_APP_SCHEME}://${DEEP_LINK_PATHS.join}/${encodeURIComponent(slug)}`;
}

export function buildAppAttendanceUrl(token: string): string {
  const params = new URLSearchParams({ token });
  return `${GYMOS_APP_SCHEME}://${DEEP_LINK_PATHS.attendance}?${params.toString()}`;
}
