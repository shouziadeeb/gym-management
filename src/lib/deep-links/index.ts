export {
  GYMOS_APP_SCHEME,
  GYMOS_WEB_ORIGIN,
  LEGACY_APP_SCHEME,
  DEEP_LINK_PATHS,
  type DeepLinkKind,
  type ParsedDeepLink,
} from '@/lib/deep-links/constants';

export {
  buildAppAttendanceUrl,
  buildAppJoinUrl,
  buildAttendanceQrUrl,
  buildJoinQrUrl,
} from '@/lib/deep-links/urls';

export {
  deepLinkToRoute,
  parseDeepLink,
} from '@/lib/deep-links/parse';

export { navigateDeepLink, queuePendingDeepLink, consumePendingDeepLink, navigatePendingDeepLink } from '@/lib/deep-links/navigate';
