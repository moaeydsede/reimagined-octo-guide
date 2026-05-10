import type { Booking, BookingStatus, PatientTicket, QueueState } from './types';

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function arabicToEnglishDigits(value: string) {
  const map: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };
  return value.replace(/[٠-٩۰-۹]/g, (d) => map[d] || d);
}

export function normalizePhone(value: string) {
  return arabicToEnglishDigits(value).replace(/[^0-9]/g, '');
}

export function maskPhone(value: string) {
  const phone = normalizePhone(value);
  if (phone.length <= 4) return phone;
  return `${phone.slice(0, 3)}${'*'.repeat(Math.max(phone.length - 7, 3))}${phone.slice(-4)}`;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function generateBookingCode(queueNumber: number) {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `Q${queueNumber}-${random}`;
}

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

export const statusTone: Record<BookingStatus, string> = {
  waiting: 'warning',
  called: 'info',
  in_progress: 'success',
  finished: 'done',
  skipped: 'danger',
  postponed: 'purple',
  cancelled: 'danger',
  no_show: 'danger'
};

export function estimateRemaining(ticket: PatientTicket | Booking, state?: QueueState | null) {
  const current = state?.currentNumber || 0;
  const remaining = Math.max(0, Number(ticket.queueNumber || 0) - current);
  return remaining;
}

export function estimateMinutes(remaining: number, avg = 10) {
  return Math.max(0, Math.ceil(remaining * avg));
}

export function isActiveStatus(status: BookingStatus) {
  return ['waiting', 'called', 'in_progress', 'postponed', 'skipped'].includes(status);
}

export function formatClock(date = new Date()) {
  return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

export function absoluteAppUrl(path: string) {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function safeError(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'حدث خطأ غير متوقع';
}
