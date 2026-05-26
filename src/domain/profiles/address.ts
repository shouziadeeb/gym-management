import type { Profile } from '@/types/models';

type ProfileAddressSource = Pick<Profile, 'home_location_label' | 'city'> | null | undefined;

/** Location pin address first, then manually entered address text. */
export function resolveProfileAddress(profile: ProfileAddressSource): string | null {
  const locationLabel = profile?.home_location_label?.trim();
  if (locationLabel) return locationLabel;

  const manualAddress = profile?.city?.trim();
  if (manualAddress) return manualAddress;

  return null;
}
