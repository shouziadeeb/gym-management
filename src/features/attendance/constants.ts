/** Attendance QR payload version — extend for GPS/selfie/kiosk later. */
export const ATTENDANCE_QR_VERSION = 1 as const;

/** Prefix for secure attendance tokens stored in DB (`gat_<48 hex chars>`). */
export const ATTENDANCE_TOKEN_PREFIX = 'gat_' as const;

export const ATTENDANCE_PAGE_SIZE = 20;

export const ATTENDANCE_SOURCE = {
  QR_SCAN: 'qr_scan',
  MOBILE: 'mobile',
  KIOSK: 'kiosk',
} as const;

export type AttendanceSource = (typeof ATTENDANCE_SOURCE)[keyof typeof ATTENDANCE_SOURCE];
