/**
 * @file providers/index.ts
 * Re-exports phone and email auth provider functions.
 */
export { sendPhoneOtp, verifyPhoneOtp, getPhoneDevOtpHint } from '@/services/auth/providers/phone.provider';
export {
  sendEmailOtp,
  verifyEmailOtp,
  signUpWithEmailPassword,
  signInWithEmailPassword,
  requestPasswordReset,
  resendSignupConfirmation,
} from '@/services/auth/providers/email.provider';
export {
  completeOAuthFromCode,
  completeOAuthFromUrl,
  resolvePendingOAuthContext,
  signInWithGoogle,
} from '@/services/auth/providers/oauth.provider';
export type { GoogleOAuthOptions } from '@/services/auth/providers/oauth.provider';
