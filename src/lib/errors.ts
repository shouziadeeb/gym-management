import { AuthError } from '@supabase/supabase-js';

import { isPostgrestError } from '@/utils/supabase-errors';

export function getErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    const message = error.message.toLowerCase();
    if (message.includes('already registered') || message.includes('already exists') || message.includes('email_exists')) {
      return 'This number is already registered';
    }
    if (message.includes('rate limit') || message.includes('over_email_send_rate_limit')) {
      return 'Too many signup attempts. Please wait a few seconds and try again.';
    }
    if (message.includes('invalid login credentials') || message.includes('user not found')) {
      return 'This number is not registered. Please create an account.';
    }
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