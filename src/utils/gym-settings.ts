import type { GymSettings } from '@/types/models';

export function parseGymSettings(raw: unknown): GymSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as GymSettings;
}

export function formatInrFromCents(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  const rupees = value / 100;
  return rupees.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

export function compactList(values: string[] | null | undefined, maxItems = 3): string {
  const list = values ?? [];
  if (!list.length) return 'N/A';
  if (list.length <= maxItems) return list.join(', ');
  const shown = list.slice(0, maxItems).join(', ');
  return `${shown} +${list.length - maxItems} more`;
}

