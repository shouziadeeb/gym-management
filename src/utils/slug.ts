/** Unique URL-safe slug for gyms.slug (UNIQUE constraint). */
export function buildGymSlug(gymName: string): string {
  const base = gymName
    .toLowerCase()
    .trim()
    .replace(/[^\\w\\s-]/g, '')
    .replace(/[\\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return base ? `${base}-${suffix}` : `gym-${suffix}`;
}

export function toE164(raw: string): string {
  const cleaned = raw.trim().replace(/[^\\d+]/g, '');
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}