export type BookingStatus =
  | 'waiting'
  | 'called'
  | 'in_progress'
  | 'finished'
  | 'skipped'
  | 'postponed'
  | 'cancelled'
  | 'no_show';

export type UserRole = 'admin' | 'reception' | 'doctor';

export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  room?: string;
  averageVisitMinutes?: number;
  isActive: boolean;
  createdAt?: unknown;
}

export interface Booking {
  id: string;
  patientName: string;
  phone: string;
  doctorId: string;
  doctorName: string;
  visitType: string;
  notes?: string;
  queueNumber: number;
  sortNumber: number;
  bookingCode: string;
  status: BookingStatus;
  servingDate: string;
  createdAt?: unknown;
  calledAt?: unknown;
  enteredAt?: unknown;
  finishedAt?: unknown;
  skippedAt?: unknown;
  postponedAt?: unknown;
}

export interface PublicStatus {
  bookingId: string;
  patientName: string;
  doctorName: string;
  queueNumber: number;
  currentNumber: number;
  remaining: number;
  status: BookingStatus;
  bookingCode: string;
  servingDate: string;
  estimatedMinutes: number;
  updatedAt?: unknown;
}

export interface QueueDoc {
  id: string;
  doctorId: string;
  doctorName: string;
  servingDate: string;
  currentNumber: number;
  lastNumber: number;
  activeBookingId?: string | null;
  status: 'active' | 'closed';
}
