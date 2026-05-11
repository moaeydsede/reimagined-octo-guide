export type BookingStatus = 'waiting' | 'called' | 'in_progress' | 'finished' | 'skipped' | 'postponed' | 'cancelled' | 'no_show'

export interface Room {
  id: string
  name: string
  floor: string
  notes?: string
  active: boolean
  createdAt: string
}

export interface DoctorSchedule {
  id: string
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  active: boolean
  maxBookings?: number
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  room: string
  roomId?: string
  codePrefix: string
  averageVisitMinutes: number
  schedules: DoctorSchedule[]
  active: boolean
  createdAt?: string
}

export interface Patient {
  id: string
  code: string
  patientNumber: number
  doctorId: string
  doctorName: string
  name: string
  phone: string
  age?: number
  notes?: string
  createdAt: string
  lastVisitAt?: string
}

export interface Booking {
  id: string
  code: string
  patientCode: string
  patientId: string
  patientName: string
  phone: string
  doctorId: string
  doctorName: string
  roomId?: string
  roomName?: string
  queueNumber: number
  visitType: string
  status: BookingStatus
  priority: number
  createdAt: string
  bookedAt: string
  bookedDate: string
  bookedTime: string
  scheduleStart?: string
  scheduleEnd?: string
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

export interface ClinicSettings {
  clinicName: string
  branchName: string
  workdayStart: string
  workdayEnd: string
  whatsappTemplate: string
  autoSkipPreviousCalled: boolean
}

export interface ClinicState {
  rooms: Room[]
  doctors: Doctor[]
  patients: Patient[]
  bookings: Booking[]
  logs: ActivityLog[]
  settings: ClinicSettings
  currentDoctorId: string
  selectedDate: string
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

export const priorityLabels: Record<number, string> = {
  0: 'عادي',
  1: 'أولوية',
  2: 'عاجل'
}
