/** Canonical app routes — use for redirects and deep links. */
export const routes = {
  home: '/(tabs)',
  explore: '/(tabs)/explore',
  profileHub: '/(tabs)/profile-hub',
  memberships: '/memberships',
  login: '/auth/login',
  signup: '/auth/signup',
  profileSetup: '/profile-setup',
  profile: '/profile',
  createGym: '/create-gym',
  dashboard: '/dashboard',
  manageMembers: '/manage-members',
  membershipLifecycle: '/membership-lifecycle',
  analytics: '/analytics',
  attendance: '/attendance',
  attendanceScan: '/attendance-scan',
  attendanceHistory: '/attendance-history',
  attendanceQr: '/attendance-qr',
  attendanceOwnerHistory: '/attendance-owner-history',
  attendanceAnalytics: '/attendance-analytics',
  bookings: '/bookings',
  gymDetail: (id: string) => `/gym/${id}` as const,
} as const;

export const ownerUnauthorizedFallback = routes.profileHub;
