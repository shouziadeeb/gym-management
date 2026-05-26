export type ParsedAddress = {
  fullAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
};

/** Parses the comma-separated address format stored on gyms. */
export function parseAddressString(raw: string): ParsedAddress {
  if (!raw.trim()) return {};

  const [fullAddress = '', city = '', state = '', countryAndPin = ''] = raw
    .split(',')
    .map((part) => part.trim());
  const [country = '', pincode = ''] = countryAndPin.split('-').map((part) => part.trim());

  return {
    fullAddress,
    city,
    state,
    country,
    pincode,
  };
}

/** Serializes structured address fields into the gym address string format. */
export function serializeAddressString(address: ParsedAddress): string {
  const parts = [
    address.fullAddress?.trim(),
    address.city?.trim(),
    address.state?.trim(),
    [address.country?.trim(), address.pincode?.trim()].filter(Boolean).join('-'),
  ].filter(Boolean);

  return parts.join(', ');
}
