import { z } from 'zod';

import { ageFromDateOfBirth } from '@/features/profile/labels';

const ONBOARDING_GENDERS = ['male', 'female', 'prefer_not_to_say'] as const;

export type ProfileFormValues = {
  fullName: string;
  phone: string;
  gender: (typeof ONBOARDING_GENDERS)[number];
  dateOfBirth: string;
  city: string;
  fitnessGoal: string;
  homeLatitude: number | null;
  homeLongitude: number | null;
  homeLocationLabel: string;
};

export function createProfileFormSchema(options: { phoneRequired: boolean }) {
  const phoneField = options.phoneRequired
    ? z.string().trim().min(5, 'Phone is required')
    : z.string().transform((value) => value.trim());

  return z
    .object({
      fullName: z.string().trim().min(2, 'Full name is required'),
      phone: phoneField,
      gender: z.enum(ONBOARDING_GENDERS, { message: 'Select a valid gender' }),
      dateOfBirth: z.string().transform((value) => value.trim()),
      city: z.string().transform((value) => value.trim()),
      fitnessGoal: z.string().transform((value) => value.trim()),
      homeLatitude: z.union([z.number(), z.null()]),
      homeLongitude: z.union([z.number(), z.null()]),
      homeLocationLabel: z.string().transform((value) => value.trim()),
    })
    .superRefine((values, ctx) => {
      if (!values.dateOfBirth) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dateOfBirth)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dateOfBirth'], message: 'Select a valid date' });
        return;
      }
      const age = ageFromDateOfBirth(values.dateOfBirth);
      if (age == null || age < 13 || age > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dateOfBirth'],
          message: 'Age must be between 13 and 100',
        });
      }
    });
}
