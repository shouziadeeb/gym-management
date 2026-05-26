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

export function centsToInputAmount(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return String(value / 100);
}

export function formatMoneyFromCents(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return `$${(value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatWorkingDays(days: string[] | null | undefined): string {
  if (!days || days.length === 0) return 'N/A';
  if (days.length === 7) return 'Every day';
  return days.join(', ');
}

export function formatTime12h(time: string | null | undefined): string {
  if (!time?.trim()) return '--';
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(Number.isFinite(m) ? m : 0).padStart(2, '0')} ${period}`;
}

