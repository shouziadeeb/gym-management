import { z } from 'zod';

export const GYM_TYPES = [
  'General Fitness',
  'Strength Training',
  'CrossFit',
  'Yoga Studio',
  'Martial Arts',
  'Pilates',
  'HIIT Studio',
  'Women Only',
] as const;

export const WORKING_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const FACILITIES = [
  'Cardio',
  'Weight Training',
  'Yoga',
  'AC',
  'Parking',
  'WiFi',
  'Personal Trainer',
] as const;

const positiveMoney = z
  .string()
  .trim()
  .min(1, 'Fee is required')
  .refine((value) => !Number.isNaN(Number(value)), 'Enter a valid amount')
  .refine((value) => Number(value) > 0, 'Fee must be greater than 0');

export const createGymValidationSchema = z
  .object({
    gymName: z.string().trim().min(2, 'Gym name is required'),
    gymLogoUri: z.string().trim().optional(),
    gymType: z.string().trim().min(2, 'Gym type is required'),
    gymDescription: z.string().trim().min(10, 'Description must be at least 10 characters'),

    ownerName: z.string().trim().min(2, 'Owner name is required'),
    ownerEmail: z.string().trim().email('Enter a valid email'),
    ownerPhone: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),

    country: z.string().trim().min(2, 'Country is required'),
    state: z.string().trim().min(2, 'State is required'),
    city: z.string().trim().min(2, 'City is required'),
    fullAddress: z.string().trim().min(5, 'Full address is required'),
    pincode: z
      .string()
      .trim()
      .regex(/^\d{4,10}$/, 'Enter a valid pincode'),

    openingTime: z.string().trim().min(1, 'Opening time is required'),
    closingTime: z.string().trim().min(1, 'Closing time is required'),
    workingDays: z.array(z.enum(WORKING_DAYS)).min(1, 'Select at least one working day'),

    monthlyFee: positiveMoney,
    quarterlyFee: positiveMoney,
    yearlyFee: positiveMoney,

    facilities: z.array(z.enum(FACILITIES)).min(1, 'Select at least one facility'),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export type CreateGymFormValues = z.infer<typeof createGymValidationSchema>;

export const createGymDefaultValues: CreateGymFormValues = {
  gymName: '',
  gymLogoUri: '',
  gymType: '',
  gymDescription: '',

  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  password: '',
  confirmPassword: '',

  country: '',
  state: '',
  city: '',
  fullAddress: '',
  pincode: '',

  openingTime: '',
  closingTime: '',
  workingDays: [],

  monthlyFee: '',
  quarterlyFee: '',
  yearlyFee: '',

  facilities: [],
};

export const createGymStepFields = {
  gymInformation: ['gymName', 'gymType', 'gymDescription'] as const,
  ownerInformation: ['ownerName', 'ownerEmail', 'ownerPhone', 'password', 'confirmPassword'] as const,
  gymAddress: ['country', 'state', 'city', 'fullAddress', 'pincode'] as const,
  gymTiming: ['openingTime', 'closingTime', 'workingDays'] as const,
  membershipSetup: ['monthlyFee', 'quarterlyFee', 'yearlyFee'] as const,
  facilities: ['facilities'] as const,
} as const;

export const createGymSteps = [
  { id: 'gymInformation', title: 'Gym Information' },
  { id: 'ownerInformation', title: 'Owner Information' },
  { id: 'gymAddress', title: 'Gym Address' },
  { id: 'gymTiming', title: 'Gym Timing' },
  { id: 'membershipSetup', title: 'Membership Setup' },
  { id: 'facilities', title: 'Facilities' },
] as const;

