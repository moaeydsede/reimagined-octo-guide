export type BookingStatus = 'waiting' | 'called' | 'in_progress' | 'finished' | 'skipped' | 'postponed' | 'cancelled' | 'no_show'

export interface Doctor {
  id: string
  name: string
  specialty: string
  room: string
  averageVisitMinutes: number
  active: boolean
}

export interface Patient {
  id: string
  name: string
  phone: string
  age?: number
  notes?: string
}

export interface Booking {
  id: string
  code: string
  patientId: string
  patientName: string
  phone: string
  doctorId: string
  doctorName: string
  queueNumber: number
  visitType: string
  status: BookingStatus
  priority: number
  createdAt: string
  bookedAt: string
  calledAt?: string
  enteredAt?: string
  finishedAt?: string
  notes?: string
  postponeAfter?: number
}

export interface ActivityLog {
  id: string
  bookingId: string
  action: string
  doneBy: string
  createdAt: string
  note?: string
}

export interface ClinicState {
  doctors: Doctor[]
  patients: Patient[]
  bookings: Booking[]
  logs: ActivityLog[]
  currentDoctorId: string
  currentUserRole: 'admin' | 'doctor' | 'patient' | 'guest'
}

export const statusLabels: Record<BookingStatus, string> = {
  waiting: 'منتظر',
  called: 'تم النداء',
  in_progress: 'داخل الكشف',
  finished: 'تم الكشف',
  skipped: 'تم التخطي',
  postponed: 'مؤجل',
  cancelled: 'ملغي',
  no_show: 'لم يحضر'
}

export const statusTone: Record<BookingStatus, string> = {
  waiting: 'warning',
  called: 'primary',
  in_progress: 'purple',
  finished: 'success',
  skipped: 'danger',
  postponed: 'violet',
  cancelled: 'muted',
  no_show: 'danger'
}
