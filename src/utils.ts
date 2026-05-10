import type { BookingStatus } from './types';

export const statusArabic: Record<BookingStatus, string> = {
  waiting: 'منتظر',
  called: 'تم النداء',
  in_progress: 'داخل الكشف',
  finished: 'تم الكشف',
  skipped: 'تم التخطي',
  postponed: 'مؤجل',
  cancelled: 'ملغي',
  no_show: 'لم يحضر'
};

export const statusClass: Record<BookingStatus, string> = {
  waiting: 'badge waiting',
  called: 'badge called',
  in_progress: 'badge progress',
  finished: 'badge done',
  skipped: 'badge danger',
  postponed: 'badge postponed',
  cancelled: 'badge danger',
  no_show: 'badge danger'
};

export function normalizePhone(input: string) {
  return input.replace(/[^0-9+]/g, '').trim();
}

export function todayCairo() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

export function maskPhone(phone: string) {
  const clean = normalizePhone(phone);
  if (clean.length < 6) return clean;
  return `${clean.slice(0, 3)}xxxxx${clean.slice(-3)}`;
}
