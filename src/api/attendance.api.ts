import { format } from 'date-fns';

import { ATTENDANCE_PAGE_SIZE } from '@/features/attendance/constants';
import type {
  AttendanceHistoryFilters,
  AttendanceMarkResult,
  GymAttendanceSettings,
  MemberAttendanceRow,
  OwnerAttendanceRow,
} from '@/features/attendance/types';
import { normalizeAttendanceMarkResult } from '@/features/attendance/domain/validate-scan';
import { supabase } from '@/lib/supabase';

export async function fetchGymAttendanceSettings(gymId: string): Promise<GymAttendanceSettings> {
  const { data, error } = await supabase
    .from('gyms')
    .select('id, attendance_token, attendance_enabled, qr_generated_at')
    .eq('id', gymId)
    .single();

  if (error) throw error;

  return {
    gym_id: data.id,
    attendance_token: data.attendance_token,
    attendance_enabled: Boolean(data.attendance_enabled),
    qr_generated_at: data.qr_generated_at,
  };
}

export async function generateAttendanceQr(gymId: string, regenerate = false) {
  const { data, error } = await supabase.rpc('owner_upsert_attendance_qr', {
    p_gym_id: gymId,
    p_regenerate: regenerate,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    attendance_token: String(row?.attendance_token ?? ''),
    attendance_enabled: Boolean(row?.attendance_enabled),
    qr_generated_at: row?.qr_generated_at ? String(row.qr_generated_at) : null,
  };
}

export async function setAttendanceEnabled(gymId: string, enabled: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc('owner_set_attendance_enabled', {
    p_gym_id: gymId,
    p_enabled: enabled,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function deleteAttendanceQr(gymId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('owner_delete_attendance_qr', { p_gym_id: gymId });
  if (error) throw error;
  return Boolean(data);
}

export async function markAttendanceByToken(token: string, localDate?: string): Promise<AttendanceMarkResult> {
  const { data, error } = await supabase.rpc('mark_attendance_by_token', {
    p_token: token,
    p_local_date: localDate ?? format(new Date(), 'yyyy-MM-dd'),
  });
  if (error) throw error;
  return normalizeAttendanceMarkResult(data);
}

export async function fetchTodayAttendance(gymId: string, date?: string): Promise<OwnerAttendanceRow[]> {
  const { data, error } = await supabase.rpc('get_gym_today_attendance', {
    p_gym_id: gymId,
    p_date: date ?? null,
  });
  if (error) throw error;
  return (data ?? []) as OwnerAttendanceRow[];
}

export async function fetchGymAttendanceHistory(
  gymId: string,
  filters: AttendanceHistoryFilters = {},
  page = 1,
  pageSize = ATTENDANCE_PAGE_SIZE,
): Promise<{ rows: OwnerAttendanceRow[]; total: number }> {
  const { data, error } = await supabase.rpc('get_gym_attendance_history', {
    p_gym_id: gymId,
    p_from: filters.from ?? null,
    p_to: filters.to ?? null,
    p_member_id: filters.memberId ?? null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw error;
  const rows = (data ?? []) as OwnerAttendanceRow[];
  const total = rows[0]?.total_count ? Number(rows[0].total_count) : 0;
  return { rows, total };
}

export async function fetchMemberAttendanceHistory(
  gymId?: string,
  page = 1,
  pageSize = ATTENDANCE_PAGE_SIZE,
): Promise<{ rows: MemberAttendanceRow[]; total: number }> {
  const { data, error } = await supabase.rpc('get_member_attendance_history', {
    p_gym_id: gymId ?? null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw error;
  const rows = (data ?? []) as MemberAttendanceRow[];
  const total = rows[0]?.total_count ? Number(rows[0].total_count) : 0;
  return { rows, total };
}

export async function deleteAttendanceRecord(attendanceId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('owner_delete_attendance_record', {
    p_attendance_id: attendanceId,
  });
  if (error) throw error;
  return Boolean(data);
}

/** Client-side alias — token generation happens server-side via RPC. */
export const generateAttendanceToken = generateAttendanceQr;
export const validateAttendanceScan = markAttendanceByToken;
export const markAttendance = markAttendanceByToken;
export const getTodayAttendance = fetchTodayAttendance;
export const getMemberAttendanceHistory = fetchMemberAttendanceHistory;
