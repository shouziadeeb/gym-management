/**
 * @file auth.validators.ts
 * Zod schemas for phone/email inputs and 6-digit OTP codes used in auth forms.
 */
import { z } from 'zod';

import { OTP_DIGIT_COUNT } from '@/services/auth/auth.constants';

export const phoneInputSchema = z.object({
  phone: z
    .string()
    .min(1, 'Enter your phone number')
    .refine((value) => /^[6-9]\d{9}$/.test(value.replace(/\D/g, '')), 'Enter a valid 10-digit Indian mobile number'),
});

export const emailInputSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

/** Builds a numeric OTP schema for a fixed digit length (default: 6). */
export function createOtpSchema(length: number) {
  return z.object({
    token: z
      .string()
      .trim()
      .min(length, `Enter the ${length}-digit code`)
      .max(length, `Code must be ${length} digits`)
      .regex(/^\d+$/, 'Code must contain only numbers'),
  });
}

export const phoneOtpSchema = createOtpSchema(OTP_DIGIT_COUNT);

export const emailOtpSchema = createOtpSchema(OTP_DIGIT_COUNT);

export type PhoneInputValues = z.infer<typeof phoneInputSchema>;
export type EmailInputValues = z.infer<typeof emailInputSchema>;
export type PhoneOtpValues = z.infer<typeof phoneOtpSchema>;
export type EmailOtpValues = z.infer<typeof emailOtpSchema>;
