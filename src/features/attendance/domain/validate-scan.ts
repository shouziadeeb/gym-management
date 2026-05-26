import { isAttendanceScanErrorCode, mapAttendanceErrorMessage, parseAttendanceScanPayload } from '@/features/attendance/domain/qr-payload';
import type { AttendanceMarkResult, AttendanceScanErrorCode } from '@/features/attendance/types';

export function validateAttendanceScanPayload(raw: string): { ok: true; token: string } | { ok: false; error: AttendanceScanErrorCode } {
  const token = parseAttendanceScanPayload(raw);
  if (!token) {
    return { ok: false, error: 'INVALID_QR' };
  }
  return { ok: true, token };
}

export function normalizeAttendanceMarkResult(payload: unknown): AttendanceMarkResult {
  if (!payload || typeof payload !== 'object') {
    return { success: false, error: 'UNKNOWN' };
  }

  const record = payload as Record<string, unknown>;
  if (record.success === true) {
    return {
      success: true,
      attendance_id: String(record.attendance_id ?? ''),
      gym_id: String(record.gym_id ?? ''),
      gym_name: String(record.gym_name ?? 'Gym'),
      attendance_date: String(record.attendance_date ?? ''),
      attendance_time: String(record.attendance_time ?? ''),
    };
  }

  const error = record.error;
  return {
    success: false,
    error: isAttendanceScanErrorCode(error) ? error : 'UNKNOWN',
  };
}

export function getAttendanceErrorMessage(code: AttendanceScanErrorCode): string {
  return mapAttendanceErrorMessage(code);
}
