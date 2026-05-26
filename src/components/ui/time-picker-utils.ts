/** Shared 24-hour time helpers for TimePickerField (native + web). */

export function parse24(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return {
    hour: Number.isFinite(h) ? h : 6,
    minute: Number.isFinite(m) ? m : 0,
  };
}

export function to12(hour24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, period };
}

export function to24(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function format24(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatDisplay(time: string): string {
  if (!time.trim()) return '';
  const { hour, minute } = parse24(time);
  const { hour12, period } = to12(hour);
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

export const TIME_PICKER_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const TIME_PICKER_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const;

export function snapToPickerMinute(minute: number): number {
  return TIME_PICKER_MINUTES.reduce((closest, candidate) =>
    Math.abs(candidate - minute) < Math.abs(closest - minute) ? candidate : closest,
  );
}
