import { AuthError } from '@supabase/supabase-js';

import { mapAuthErrorMessage } from '@/services/auth/auth.utils';
import type { AuthMethod } from '@/services/auth/auth.types';
import { isAttendanceMigrationMissingError, isPostgrestError } from '@/utils/supabase-errors';

export function getErrorMessage(error: unknown, authMethod: AuthMethod = 'phone'): string {
  if (error instanceof AuthError) {
    return mapAuthErrorMessage(error, authMethod);
  }

  if (isAttendanceMigrationMissingError(error)) {
    return 'Attendance database setup is missing. Apply supabase/migrations/20260528120000_attendance_qr_system.sql in your Supabase SQL editor, then reload the app.';
  }

  if (isPostgrestError(error)) {
    switch (error.code) {
      case '23503':
        return 'Your profile is not ready yet. Please sign out and sign in again.';
      case '23505':
        return 'This record already exists.';
      case '42501':
        return 'You do not have permission to perform this action.';
      default:
        return error.message || 'Database error';
    }
  }

  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong';
}