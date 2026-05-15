import { AuthError } from '@supabase/supabase-js';

import { isPostgrestError } from '@/utils/supabase-errors';

export function getErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.message.toLowerCase().includes('token has expired')) {
      return 'Code expired. Request a new OTP and try again.';
    }
    return error.message;
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