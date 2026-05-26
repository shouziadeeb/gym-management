import type { User } from '@supabase/supabase-js';

import type { CreateGymInput } from '@/api/gyms.api';
import type { CreateGymFormValues } from '@/features/create-gym/schema';
import type { Profile } from '@/types/models';

const OWNER_PHONE_PATTERN = /^\+?[1-9]\d{9,14}$/;

export type ResolvedGymOwnerContact = {
  name: string;
  phone: string;
  /** Real email only; omitted for phone-first / synthetic identities. */
  email: string | null;
};

/**
 * Owner contact shown on the gym & stored in `settings.ownerProfile`;
 * sourced from onboarding profile + Supabase Auth (no redundant form fields).
 */
export function resolveGymOwnerFromAccount(
  profile: Profile | null | undefined,
  user: Pick<User, 'phone' | 'email'>,
): ResolvedGymOwnerContact {
  const phone = profile?.phone?.trim() || user.phone?.trim() || '';
  const name = profile?.full_name?.trim() || '';
  const rawEmail = typeof user.email === 'string' ? user.email.trim() : '';
  const email =
    rawEmail.includes('@') && !rawEmail.endsWith('@app.local') ? rawEmail : null;

  return { name, phone, email };
}

export function isResolvedOwnerContactComplete(owner: ResolvedGymOwnerContact): boolean {
  return owner.name.trim().length >= 2 && OWNER_PHONE_PATTERN.test(owner.phone.trim());
}

export function toCreateGymInput(values: CreateGymFormValues, owner: ResolvedGymOwnerContact): CreateGymInput {
  const latitude = values.gymLatitude;
  const longitude = values.gymLongitude;

  return {
    name: values.gymName.trim(),
    description: values.gymDescription.trim(),
    logoUrl: values.gymLogoUri?.trim() || undefined,
    gymType: values.gymType.trim(),
    latitude:
      typeof latitude === 'number' && Number.isFinite(latitude) ? latitude : null,
    longitude:
      typeof longitude === 'number' && Number.isFinite(longitude) ? longitude : null,
    address: {
      country: values.country.trim(),
      state: values.state.trim(),
      city: values.city.trim(),
      fullAddress: values.fullAddress.trim(),
      pincode: values.pincode.trim(),
    },
    timings: {
      openingTime: values.openingTime.trim(),
      closingTime: values.closingTime.trim(),
      workingDays: values.workingDays,
    },
    membershipPlans: {
      monthlyFeeCents: Math.round(Number(values.monthlyFee) * 100),
      quarterlyFeeCents: Math.round(Number(values.quarterlyFee) * 100),
      yearlyFeeCents: Math.round(Number(values.yearlyFee) * 100),
    },
    facilities: values.facilities,
    ownerProfile: {
      name: owner.name.trim(),
      phone: owner.phone.trim(),
      ...(owner.email ? { email: owner.email.trim() } : {}),
    },
  };
}
