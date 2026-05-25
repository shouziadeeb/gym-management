import type { CreateGymInput } from '@/api/gyms.api';
import type { CreateGymFormValues } from '@/features/create-gym/schema';

export function toCreateGymInput(values: CreateGymFormValues): CreateGymInput {
  return {
    name: values.gymName.trim(),
    description: values.gymDescription.trim(),
    logoUrl: values.gymLogoUri?.trim() || undefined,
    gymType: values.gymType.trim(),
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
      name: values.ownerName.trim(),
      email: values.ownerEmail.trim(),
      phone: values.ownerPhone.trim(),
    },
  };
}

