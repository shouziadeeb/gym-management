export type AttendanceScanErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_QR'
  | 'GYM_INACTIVE'
  | 'ATTENDANCE_DISABLED'
  | 'NOT_A_MEMBER'
  | 'MEMBERSHIP_EXPIRED'
  | 'ALREADY_MARKED'
  | 'UNKNOWN';

export type AttendanceMarkSuccess = {
  success: true;
  attendance_id: string;
  gym_id: string;
  gym_name: string;
  attendance_date: string;
  attendance_time: string;
};

export type AttendanceMarkFailure = {
  success: false;
  error: AttendanceScanErrorCode;
};

export type AttendanceMarkResult = AttendanceMarkSuccess | AttendanceMarkFailure;

export type GymAttendanceSettings = {
  gym_id: string;
  attendance_token: string | null;
  attendance_enabled: boolean;
  qr_generated_at: string | null;
};

export type AttendanceRecord = {
  id: string;
  gym_id: string;
  member_id: string;
  user_id: string;
  scanned_token: string | null;
  attendance_date: string;
  attendance_time: string;
  checked_in_at: string;
  created_at: string;
  source: string | null;
};

export type OwnerAttendanceRow = {
  id: string;
  member_id: string;
  member_name: string | null;
  member_phone: string | null;
  avatar_url: string | null;
  attendance_date: string;
  attendance_time: string;
  scanned_token: string | null;
  created_at: string;
  total_count?: number;
};

export type MemberAttendanceRow = {
  id: string;
  gym_id: string;
  gym_name: string;
  attendance_date: string;
  attendance_time: string;
  created_at: string;
  total_count?: number;
};

export type AttendanceHistoryFilters = {
  from?: string;
  to?: string;
  memberId?: string;
};
