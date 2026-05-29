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
