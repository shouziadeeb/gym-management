import { ATTENDANCE_QR_VERSION, ATTENDANCE_TOKEN_PREFIX } from '@/features/attendance/constants';
import type { AttendanceScanErrorCode } from '@/features/attendance/types';

export type AttendanceQrPayload = {
  v: typeof ATTENDANCE_QR_VERSION;
  t: string;
};

/** Build QR payload JSON — never includes raw gym IDs. */
export function buildAttendanceQrPayload(token: string): string {
  const payload: AttendanceQrPayload = { v: ATTENDANCE_QR_VERSION, t: token };
  return JSON.stringify(payload);
}

/** Parse scanned QR/barcode data into a secure attendance token. */
export function parseAttendanceScanPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(ATTENDANCE_TOKEN_PREFIX)) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<AttendanceQrPayload>;
    if (parsed?.t && typeof parsed.t === 'string' && parsed.t.startsWith(ATTENDANCE_TOKEN_PREFIX)) {
      return parsed.t;
    }
  } catch {
    // fall through — treat as opaque token string
  }

  return trimmed.startsWith(ATTENDANCE_TOKEN_PREFIX) ? trimmed : null;
}

export function isAttendanceScanErrorCode(value: unknown): value is AttendanceScanErrorCode {
  return (
    value === 'UNAUTHORIZED' ||
    value === 'INVALID_QR' ||
    value === 'GYM_INACTIVE' ||
    value === 'ATTENDANCE_DISABLED' ||
    value === 'NOT_A_MEMBER' ||
    value === 'MEMBERSHIP_EXPIRED' ||
    value === 'ALREADY_MARKED' ||
    value === 'UNKNOWN'
  );
}

export function mapAttendanceErrorMessage(code: AttendanceScanErrorCode): string {
  switch (code) {
    case 'INVALID_QR':
      return 'Invalid or unrecognized gym QR code.';
    case 'GYM_INACTIVE':
      return 'This gym is currently inactive.';
    case 'ATTENDANCE_DISABLED':
      return 'Attendance scanning is disabled for this gym.';
    case 'NOT_A_MEMBER':
      return 'You are not an active member of this gym.';
    case 'MEMBERSHIP_EXPIRED':
      return 'Your membership is expired or inactive.';
    case 'ALREADY_MARKED':
      return 'Attendance already marked for today.';
    case 'UNAUTHORIZED':
      return 'Please sign in to mark attendance.';
    default:
      return 'Could not mark attendance. Please try again.';
  }
}
