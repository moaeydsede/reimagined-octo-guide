import type { Timestamp } from 'firebase/firestore';

export type Role = 'admin' | 'reception' | 'doctor';
export type BookingStatus = 'waiting' | 'called' | 'in_progress' | 'finished' | 'skipped' | 'postponed' | 'cancelled' | 'no_show';
export type VisitType = 'كشف' | 'استشارة' | 'متابعة' | 'طوارئ' | 'حجز أونلاين';

export interface AppUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: Role;
  doctorId?: string;
  active: boolean;
  createdAt?: Timestamp;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  room: string;
  averageVisitMinutes: number;
  isActive: boolean;
  createdAt?: Timestamp;
}

export interface Booking {
  id: string;
  patientName: string;
  phone: string;
  normalizedPhone: string;
  doctorId: string;
  doctorName: string;
  room: string;
  visitType: VisitType | string;
  notes?: string;
  queueNumber: number;
  bookingCode: string;
  dateKey: string;
  status: BookingStatus;
  priority: number;
  createdAt?: Timestamp;
  calledAt?: Timestamp | null;
  enteredAt?: Timestamp | null;
  finishedAt?: Timestamp | null;
  statusUpdatedAt?: Timestamp;
}

export interface PatientTicket {
  id: string;
  bookingId: string;
  bookingCode: string;
  patientName: string;
  patientFirstName: string;
  phoneLast4: string;
  doctorId: string;
  doctorName: string;
  room: string;
  visitType: string;
  queueNumber: number;
  dateKey: string;
  status: BookingStatus;
  priority: number;
  updatedAt?: Timestamp;
}

export interface QueueState {
  id: string;
  doctorId: string;
  doctorName: string;
  room: string;
  dateKey: string;
  currentNumber: number;
  currentPatientName?: string;
  currentBookingCode?: string;
  currentStatus?: BookingStatus;
  lastNumber?: number;
  updatedAt?: Timestamp;
}

export interface ActivityLog {
  id: string;
  action: string;
  bookingId?: string;
  bookingCode?: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  note?: string;
  createdBy?: string;
  createdAt?: Timestamp;
}
