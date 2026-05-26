import type { PostgrestError } from '@supabase/supabase-js';

export function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

export function isUniqueViolation(error: unknown): boolean {
  return isPostgrestError(error) && error.code === '23505';
}

export function isForeignKeyViolation(error: unknown): boolean {
  return isPostgrestError(error) && error.code === '23503';
}

/** PostgREST cannot find the RPC — migration not applied or wrong project. */
export function isMissingRpcError(error: unknown): boolean {
  if (!isPostgrestError(error)) return false;
  return (
    error.code === 'PGRST202' ||
    error.message.toLowerCase().includes('could not find the function') ||
    error.message.toLowerCase().includes('not found')
  );
}

/** Column missing — attendance migration not applied. */
export function isMissingSchemaError(error: unknown): boolean {
  if (!isPostgrestError(error)) return false;
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    error.message.toLowerCase().includes('does not exist') ||
    error.message.toLowerCase().includes('attendance_token')
  );
}

export function isAttendanceMigrationMissingError(error: unknown): boolean {
  return isMissingRpcError(error) || isMissingSchemaError(error);
}