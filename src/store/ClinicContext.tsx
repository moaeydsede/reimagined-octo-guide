import React, { createContext, useContext, useMemo, useReducer } from 'react'
import type { ActivityLog, Booking, BookingStatus, ClinicSettings, ClinicState, Doctor, Patient, Room } from '../types'
import { seedBookings, seedDoctors, seedLogs, seedPatients, seedRooms } from '../data/seed'
import {
  defaultDoctorSchedules,
  formatDate,
  getRoomName,
  getScheduleForDate,
  makePatientCode,
  normalizePhone,
  normalizeSchedules,
  sanitizePrefix,
  statusRank,
  todayKey,
  uid
} from '../lib/helpers'

type AddBookingInput = {
  patientName: string
  phone: string
  doctorId: string
  visitType: string
  bookedDate: string
  bookedTime: string
  notes?: string
  priority?: number
}

type AddRoomInput = Omit<Room, 'id' | 'createdAt'>
type UpdateRoomInput = Partial<AddRoomInput>
type AddDoctorInput = Omit<Doctor, 'id' | 'createdAt'>
type UpdateDoctorInput = Partial<Omit<Doctor, 'id' | 'createdAt'>>
type UpdatePatientInput = Partial<Pick<Patient, 'name' | 'phone' | 'age' | 'notes'>>
type UpdateBookingInput = Partial<Pick<Booking, 'patientName' | 'phone' | 'doctorId' | 'visitType' | 'bookedDate' | 'bookedTime' | 'notes' | 'priority' | 'status'>>

type Action =
  | { type: 'ADD_ROOM'; room: AddRoomInput }
  | { type: 'UPDATE_ROOM'; id: string; room: UpdateRoomInput }
  | { type: 'DELETE_ROOM'; id: string }
  | { type: 'TOGGLE_ROOM'; id: string }
  | { type: 'ADD_DOCTOR'; doctor: AddDoctorInput }
  | { type: 'UPDATE_DOCTOR'; id: string; doctor: UpdateDoctorInput }
  | { type: 'DELETE_DOCTOR'; id: string }
  | { type: 'TOGGLE_DOCTOR'; id: string }
  | { type: 'SET_DOCTOR'; id: string }
  | { type: 'SET_DATE'; date: string }
  | { type: 'ADD_BOOKING'; input: AddBookingInput }
  | { type: 'UPDATE_BOOKING'; id: string; input: UpdateBookingInput }
  | { type: 'DELETE_BOOKING'; id: string }
  | { type: 'UPDATE_PATIENT'; id: string; input: UpdatePatientInput }
  | { type: 'DELETE_PATIENT'; id: string }
  | { type: 'UPDATE_STATUS'; id: string; status: BookingStatus; note?: string }
  | { type: 'CALL_NEXT'; doctorId?: string; date?: string }
  | { type: 'SKIP'; id: string }
  | { type: 'POSTPONE'; id: string }
  | { type: 'RETURN'; id: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<ClinicSettings> }
  | { type: 'IMPORT_STATE'; state: ClinicState }
  | { type: 'CLEAR_DATA' }

type ClinicContextType = ClinicState & {
  stats: {
    total: number
    waiting: number
    called: number
    inProgress: number
    finished: number
    skipped: number
    postponed: number
    cancelled: number
    currentNumber: number
    attendance: number
    averageServiceMinutes: number
  }
  globalStats: {
    total: number
    waiting: number
    activeDoctors: number
    activeRooms: number
    finished: number
    cancelled: number
    patients: number
    allBookings: number
  }
  selectedDoctor?: Doctor
  selectedRoom?: Room
  visibleBookings: Booking[]
  dayBookings: Booking[]
  selectedDateLabel: string
  workingDoctorsForSelectedDate: Doctor[]
  addRoom: (room: AddRoomInput) => void
  updateRoom: (id: string, room: UpdateRoomInput) => void
  deleteRoom: (id: string) => void
  toggleRoom: (id: string) => void
  addDoctor: (doctor: AddDoctorInput) => void
  updateDoctor: (id: string, doctor: UpdateDoctorInput) => void
  deleteDoctor: (id: string) => void
  toggleDoctor: (id: string) => void
  setDoctor: (id: string) => void
  setSelectedDate: (date: string) => void
  addBooking: (input: AddBookingInput) => void
  updateBooking: (id: string, input: UpdateBookingInput) => void
  deleteBooking: (id: string) => void
  updatePatient: (id: string, input: UpdatePatientInput) => void
  deletePatient: (id: string) => void
  updateStatus: (id: string, status: BookingStatus, note?: string) => void
  callNext: (doctorId?: string) => void
  skip: (id: string) => void
  postpone: (id: string) => void
  returnToQueue: (id: string) => void
  updateSettings: (settings: Partial<ClinicSettings>) => void
  importState: (state: ClinicState) => void
  clearAllData: () => void
  resetDemo: () => void
  findBooking: (query: string) => Booking | undefined
}

const STORAGE_KEY = 'ayadat-al-mashfa-state-v4-schedules'
const LEGACY_KEYS = ['ayadat-al-mashfa-state-v3-pro', 'ayadat-al-mashfa-state-v2-empty', 'ayadat-al-mashfa-state-v1']

const defaultSettings: ClinicSettings = {
  clinicName: 'عيادات المشفى',
  branchName: 'الفرع الرئيسي',
  workdayStart: '09:00',
  workdayEnd: '22:00',
  whatsappTemplate: 'مرحبًا {patient}، رقم دورك {queue}، كودك {code}. الطبيب: {doctor}، الغرفة: {room}. موعدك {day} {date} الساعة {time}.',
  autoSkipPreviousCalled: true
}

const emptyState: ClinicState = {
  rooms: seedRooms,
  doctors: seedDoctors,
  patients: seedPatients,
  bookings: seedBookings,
  logs: seedLogs,
  settings: defaultSettings,
  currentDoctorId: '',
  selectedDate: todayKey(),
  currentUserRole: 'admin'
}

function dateFromIsoOrToday(iso?: string) {
  if (!iso) return todayKey()
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return todayKey()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function timeFromIsoOrDefault(iso?: string, fallback?: string) {
  if (fallback && /^\d{2}:\d{2}$/.test(fallback)) return fallback
  if (!iso) return '09:00'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '09:00'
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function withDefaults(raw?: Partial<ClinicState>): ClinicState {
  const state = { ...emptyState, ...(raw || {}) } as ClinicState
  const rooms = (state.rooms || []).map(room => ({ ...room, active: room.active !== false, createdAt: room.createdAt || new Date().toISOString() }))
  const doctors = (state.doctors || []).map(doctor => ({
    ...doctor,
    active: doctor.active !== false,
    codePrefix: sanitizePrefix(doctor.codePrefix || 'DR'),
    averageVisitMinutes: Math.max(1, Number(doctor.averageVisitMinutes) || 10),
    schedules: normalizeSchedules(doctor.schedules),
    room: getRoomName(rooms, doctor) || doctor.room || 'بدون غرفة',
    createdAt: doctor.createdAt || new Date().toISOString()
  }))
  const bookings = (state.bookings || []).map(booking => {
    const doctor = doctors.find(d => d.id === booking.doctorId)
    const bookedDate = booking.bookedDate || dateFromIsoOrToday(booking.createdAt)
    const bookedTime = booking.bookedTime || timeFromIsoOrDefault(booking.createdAt, booking.bookedAt)
    const schedule = doctor ? getScheduleForDate(doctor, bookedDate) : undefined
    return {
      ...booking,
      patientCode: booking.patientCode || booking.code,
      roomId: booking.roomId || doctor?.roomId,
      roomName: booking.roomName || doctor?.room || 'بدون غرفة',
      priority: Number(booking.priority) || 0,
      bookedDate,
      bookedTime,
      bookedAt: booking.bookedAt || bookedTime,
      scheduleStart: booking.scheduleStart || schedule?.startTime,
      scheduleEnd: booking.scheduleEnd || schedule?.endTime
    }
  })
  return {
    ...emptyState,
    ...state,
    rooms,
    doctors,
    patients: state.patients || [],
    bookings,
    logs: state.logs || [],
    settings: { ...defaultSettings, ...(state.settings || {}) },
    selectedDate: state.selectedDate || todayKey(),
    currentDoctorId: state.currentDoctorId || doctors[0]?.id || ''
  }
}

const initialState: ClinicState = (() => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) return withDefaults(JSON.parse(cached) as ClinicState)
    for (const key of LEGACY_KEYS) {
      const legacy = localStorage.getItem(key)
      if (legacy) return withDefaults(JSON.parse(legacy) as ClinicState)
    }
  } catch {}
  return withDefaults(emptyState)
})()

function log(action: string, bookingId: string, note?: string): ActivityLog {
  return { id: uid('log'), action, bookingId, note, doneBy: 'الإدارة', createdAt: new Date().toISOString() }
}

function save(state: ClinicState) {
  const next = withDefaults(state)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  return next
}

function nextDoctorPrefix(state: ClinicState) {
  const used = new Set(state.doctors.map(d => sanitizePrefix(d.codePrefix)))
  let n = state.doctors.length + 1
  let prefix = `DR${n}`
  while (used.has(prefix)) {
    n += 1
    prefix = `DR${n}`
  }
  return prefix
}

function uniquePrefix(state: ClinicState, desired: string, doctorId?: string) {
  const base = sanitizePrefix(desired || nextDoctorPrefix(state))
  const used = new Set(state.doctors.filter(d => d.id !== doctorId).map(d => sanitizePrefix(d.codePrefix)))
  if (!used.has(base)) return base
  let n = 2
  let prefix = `${base}${n}`
  while (used.has(prefix)) {
    n += 1
    prefix = `${base}${n}`
  }
  return prefix
}

function roomNameFor(state: ClinicState, doctor: Partial<Doctor>) {
  return state.rooms.find(r => r.id === doctor.roomId)?.name || doctor.room || 'بدون غرفة'
}

function nextQueueNumber(state: ClinicState, doctorId: string, bookedDate: string) {
  return Math.max(0, ...state.bookings.filter(b => b.doctorId === doctorId && b.bookedDate === bookedDate).map(b => b.queueNumber)) + 1
}

function nextPatientNumber(state: ClinicState, doctorId: string) {
  return Math.max(0, ...state.patients.filter(p => p.doctorId === doctorId).map(p => p.patientNumber || 0)) + 1
}

function upsertPatientForDoctor(state: ClinicState, doctor: Doctor, input: { name: string; phone: string; notes?: string }, preferredPatientId?: string) {
  const phone = normalizePhone(input.phone)
  const existing = state.patients.find(p => preferredPatientId && p.id === preferredPatientId && p.doctorId === doctor.id)
    || state.patients.find(p => p.doctorId === doctor.id && normalizePhone(p.phone) === phone)

  if (existing) {
    const patient: Patient = {
      ...existing,
      name: input.name,
      phone: input.phone,
      notes: input.notes ?? existing.notes,
      doctorName: doctor.name,
      lastVisitAt: new Date().toISOString()
    }
    return { patient, patients: state.patients.map(p => p.id === patient.id ? patient : p) }
  }

  const patientNumber = nextPatientNumber(state, doctor.id)
  const patient: Patient = {
    id: uid('patient'),
    code: makePatientCode(doctor.codePrefix, patientNumber),
    patientNumber,
    doctorId: doctor.id,
    doctorName: doctor.name,
    name: input.name,
    phone: input.phone,
    notes: input.notes,
    createdAt: new Date().toISOString(),
    lastVisitAt: new Date().toISOString()
  }
  return { patient, patients: [...state.patients, patient] }
}

function bookingDateTimeIso(bookedDate: string, bookedTime: string) {
  return new Date(`${bookedDate}T${bookedTime || '00:00'}:00`).toISOString()
}

function reducer(state: ClinicState, action: Action): ClinicState {
  switch (action.type) {
    case 'ADD_ROOM': {
      const room: Room = {
        id: uid('room'),
        name: action.room.name.trim(),
        floor: action.room.floor.trim() || 'غير محدد',
        notes: action.room.notes,
        active: action.room.active !== false,
        createdAt: new Date().toISOString()
      }
      return save({ ...state, rooms: [...state.rooms, room] })
    }
    case 'UPDATE_ROOM': {
      const rooms = state.rooms.map(r => r.id === action.id ? { ...r, ...action.room, name: action.room.name?.trim() || r.name, floor: action.room.floor?.trim() || r.floor } : r)
      const updatedRoom = rooms.find(r => r.id === action.id)
      const doctors = state.doctors.map(d => d.roomId === action.id && updatedRoom ? { ...d, room: updatedRoom.name } : d)
      const bookings = state.bookings.map(b => b.roomId === action.id && updatedRoom ? { ...b, roomName: updatedRoom.name } : b)
      return save({ ...state, rooms, doctors, bookings })
    }
    case 'DELETE_ROOM': {
      return save({
        ...state,
        rooms: state.rooms.filter(r => r.id !== action.id),
        doctors: state.doctors.map(d => d.roomId === action.id ? { ...d, roomId: undefined, room: 'بدون غرفة' } : d),
        bookings: state.bookings.map(b => b.roomId === action.id ? { ...b, roomId: undefined, roomName: 'بدون غرفة' } : b)
      })
    }
    case 'TOGGLE_ROOM': return save({ ...state, rooms: state.rooms.map(r => r.id === action.id ? { ...r, active: !r.active } : r) })
    case 'ADD_DOCTOR': {
      const prefix = uniquePrefix(state, action.doctor.codePrefix || nextDoctorPrefix(state))
      const doctor: Doctor = {
        ...action.doctor,
        id: uid('doctor'),
        codePrefix: prefix,
        room: roomNameFor(state, action.doctor),
        averageVisitMinutes: Math.max(1, Number(action.doctor.averageVisitMinutes) || 10),
        schedules: normalizeSchedules(action.doctor.schedules?.length ? action.doctor.schedules : defaultDoctorSchedules()),
        active: action.doctor.active !== false,
        createdAt: new Date().toISOString()
      }
      return save({ ...state, doctors: [...state.doctors, doctor], currentDoctorId: state.currentDoctorId || doctor.id })
    }
    case 'UPDATE_DOCTOR': {
      const original = state.doctors.find(d => d.id === action.id)
      if (!original) return state
      const merged: Doctor = {
        ...original,
        ...action.doctor,
        codePrefix: uniquePrefix(state, action.doctor.codePrefix ?? original.codePrefix, original.id),
        averageVisitMinutes: Math.max(1, Number(action.doctor.averageVisitMinutes ?? original.averageVisitMinutes) || original.averageVisitMinutes),
        schedules: normalizeSchedules(action.doctor.schedules ?? original.schedules),
        room: roomNameFor(state, { ...original, ...action.doctor })
      }
      return save({
        ...state,
        doctors: state.doctors.map(d => d.id === action.id ? merged : d),
        patients: state.patients.map(p => p.doctorId === action.id ? { ...p, doctorName: merged.name } : p),
        bookings: state.bookings.map(b => b.doctorId === action.id ? { ...b, doctorName: merged.name, roomId: merged.roomId, roomName: merged.room } : b)
      })
    }
    case 'DELETE_DOCTOR': {
      const remainingDoctors = state.doctors.filter(d => d.id !== action.id)
      const removedBookingIds = new Set(state.bookings.filter(b => b.doctorId === action.id).map(b => b.id))
      return save({
        ...state,
        doctors: remainingDoctors,
        patients: state.patients.filter(p => p.doctorId !== action.id),
        bookings: state.bookings.filter(b => b.doctorId !== action.id),
        logs: state.logs.filter(l => !removedBookingIds.has(l.bookingId)),
        currentDoctorId: state.currentDoctorId === action.id ? (remainingDoctors[0]?.id || '') : state.currentDoctorId
      })
    }
    case 'TOGGLE_DOCTOR': return save({ ...state, doctors: state.doctors.map(d => d.id === action.id ? { ...d, active: !d.active } : d) })
    case 'SET_DOCTOR': return save({ ...state, currentDoctorId: action.id })
    case 'SET_DATE': return save({ ...state, selectedDate: action.date || todayKey() })
    case 'ADD_BOOKING': {
      const doctor = state.doctors.find(d => d.id === action.input.doctorId && d.active)
      if (!doctor) return state
      const schedule = getScheduleForDate(doctor, action.input.bookedDate)
      if (!schedule) return state
      const patientResult = upsertPatientForDoctor(state, doctor, { name: action.input.patientName, phone: action.input.phone, notes: action.input.notes })
      const nextNumber = nextQueueNumber({ ...state, patients: patientResult.patients }, doctor.id, action.input.bookedDate)
      const now = new Date()
      const booking: Booking = {
        id: uid('booking'),
        code: patientResult.patient.code,
        patientCode: patientResult.patient.code,
        patientId: patientResult.patient.id,
        patientName: patientResult.patient.name,
        phone: patientResult.patient.phone,
        doctorId: doctor.id,
        doctorName: doctor.name,
        roomId: doctor.roomId,
        roomName: doctor.room,
        queueNumber: nextNumber,
        visitType: action.input.visitType,
        priority: Number(action.input.priority) || 0,
        status: 'waiting',
        notes: action.input.notes,
        createdAt: now.toISOString(),
        bookedDate: action.input.bookedDate,
        bookedTime: action.input.bookedTime,
        bookedAt: action.input.bookedTime,
        scheduleStart: schedule.startTime,
        scheduleEnd: schedule.endTime
      }
      return save({
        ...state,
        selectedDate: action.input.bookedDate,
        patients: patientResult.patients,
        bookings: [...state.bookings, booking],
        logs: [...state.logs, log('إضافة حجز جديد', booking.id, `رقم الدور ${booking.queueNumber} - ${formatDate(booking.bookedDate)} الساعة ${booking.bookedTime}`)]
      })
    }
    case 'UPDATE_BOOKING': {
      const booking = state.bookings.find(b => b.id === action.id)
      if (!booking) return state
      const targetDoctor = state.doctors.find(d => d.id === (action.input.doctorId || booking.doctorId))
      if (!targetDoctor) return state
      const patientName = action.input.patientName ?? booking.patientName
      const phone = action.input.phone ?? booking.phone
      const notes = action.input.notes ?? booking.notes
      const bookedDate = action.input.bookedDate ?? booking.bookedDate
      const bookedTime = action.input.bookedTime ?? booking.bookedTime
      const schedule = getScheduleForDate(targetDoctor, bookedDate)
      if (!schedule) return state
      const movedToAnotherDoctor = targetDoctor.id !== booking.doctorId
      const movedToAnotherDate = bookedDate !== booking.bookedDate
      const patientResult = upsertPatientForDoctor(state, targetDoctor, { name: patientName, phone, notes }, movedToAnotherDoctor ? undefined : booking.patientId)
      const queueNumber = (movedToAnotherDoctor || movedToAnotherDate) ? nextQueueNumber({ ...state, patients: patientResult.patients }, targetDoctor.id, bookedDate) : booking.queueNumber
      const status = action.input.status ?? booking.status
      const now = new Date().toISOString()
      const updatedBooking: Booking = {
        ...booking,
        ...action.input,
        status,
        doctorId: targetDoctor.id,
        doctorName: targetDoctor.name,
        roomId: targetDoctor.roomId,
        roomName: targetDoctor.room,
        patientId: patientResult.patient.id,
        patientName: patientResult.patient.name,
        phone: patientResult.patient.phone,
        code: patientResult.patient.code,
        patientCode: patientResult.patient.code,
        queueNumber,
        bookedDate,
        bookedTime,
        bookedAt: bookedTime,
        scheduleStart: schedule.startTime,
        scheduleEnd: schedule.endTime,
        priority: Number(action.input.priority ?? booking.priority) || 0,
        notes,
        calledAt: status === 'called' && !booking.calledAt ? now : booking.calledAt,
        enteredAt: status === 'in_progress' && !booking.enteredAt ? now : booking.enteredAt,
        finishedAt: status === 'finished' && !booking.finishedAt ? now : booking.finishedAt
      }
      return save({
        ...state,
        selectedDate: bookedDate,
        patients: patientResult.patients,
        bookings: state.bookings.map(b => b.id === booking.id ? updatedBooking : b),
        logs: [...state.logs, log('تعديل الحجز', booking.id, `تم تحديث الموعد إلى ${formatDate(updatedBooking.bookedDate)} الساعة ${updatedBooking.bookedTime}`)]
      })
    }
    case 'DELETE_BOOKING': return save({ ...state, bookings: state.bookings.filter(b => b.id !== action.id), logs: [...state.logs, log('حذف الحجز', action.id)] })
    case 'UPDATE_PATIENT': {
      const patient = state.patients.find(p => p.id === action.id)
      if (!patient) return state
      const updatedPatient: Patient = { ...patient, ...action.input }
      return save({
        ...state,
        patients: state.patients.map(p => p.id === action.id ? updatedPatient : p),
        bookings: state.bookings.map(b => b.patientId === action.id ? { ...b, patientName: updatedPatient.name, phone: updatedPatient.phone } : b)
      })
    }
    case 'DELETE_PATIENT': {
      const removedBookingIds = new Set(state.bookings.filter(b => b.patientId === action.id).map(b => b.id))
      return save({
        ...state,
        patients: state.patients.filter(p => p.id !== action.id),
        bookings: state.bookings.filter(b => b.patientId !== action.id),
        logs: state.logs.filter(l => !removedBookingIds.has(l.bookingId))
      })
    }
    case 'UPDATE_STATUS': {
      const now = new Date().toISOString()
      return save({
        ...state,
        bookings: state.bookings.map(b => b.id === action.id ? {
          ...b,
          status: action.status,
          calledAt: action.status === 'called' ? now : b.calledAt,
          enteredAt: action.status === 'in_progress' ? now : b.enteredAt,
          finishedAt: action.status === 'finished' ? now : b.finishedAt
        } : b),
        logs: [...state.logs, log(`تحديث الحالة إلى ${action.status}`, action.id, action.note)]
      })
    }
    case 'CALL_NEXT': {
      if (!action.doctorId) return state
      const date = action.date || state.selectedDate || todayKey()
      const candidates = state.bookings
        .filter(b => b.doctorId === action.doctorId && b.bookedDate === date && ['waiting', 'postponed'].includes(b.status))
        .sort((a, b) => (b.priority - a.priority) || (a.queueNumber - b.queueNumber))
      const next = candidates[0]
      if (!next) return state
      const now = new Date().toISOString()
      return save({
        ...state,
        selectedDate: date,
        bookings: state.bookings.map(b => {
          if (b.id === next.id) return { ...b, status: 'called', calledAt: now }
          if (state.settings.autoSkipPreviousCalled && b.doctorId === action.doctorId && b.bookedDate === date && b.status === 'called') return { ...b, status: 'skipped' }
          return b
        }),
        logs: [...state.logs, log('نداء التالي', next.id, `تم نداء الدور ${next.queueNumber} ليوم ${formatDate(date)}`)]
      })
    }
    case 'SKIP': return reducer(state, { type: 'UPDATE_STATUS', id: action.id, status: 'skipped', note: 'المريض غير موجود' })
    case 'POSTPONE': return reducer(state, { type: 'UPDATE_STATUS', id: action.id, status: 'postponed', note: 'تم التأجيل مؤقتًا' })
    case 'RETURN': return reducer(state, { type: 'UPDATE_STATUS', id: action.id, status: 'waiting', note: 'تم إرجاع المريض للدور' })
    case 'UPDATE_SETTINGS': return save({ ...state, settings: { ...state.settings, ...action.settings } })
    case 'IMPORT_STATE': return save(action.state)
    case 'CLEAR_DATA': return save({ ...emptyState, selectedDate: todayKey() })
    default: return state
  }
}

const ClinicContext = createContext<ClinicContextType | null>(null)

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const selectedDoctor = state.doctors.find(d => d.id === state.currentDoctorId) || state.doctors[0]
  const selectedRoom = selectedDoctor?.roomId ? state.rooms.find(r => r.id === selectedDoctor.roomId) : undefined
  const selectedDate = state.selectedDate || todayKey()
  const dayBookings = useMemo(() => state.bookings
    .filter(b => b.bookedDate === selectedDate)
    .sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.bookedTime.localeCompare(b.bookedTime) || a.queueNumber - b.queueNumber), [state.bookings, selectedDate])
  const visibleBookings = useMemo(() => dayBookings
    .filter(b => selectedDoctor && b.doctorId === selectedDoctor.id)
    .sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.bookedTime.localeCompare(b.bookedTime) || a.queueNumber - b.queueNumber), [dayBookings, selectedDoctor?.id])
  const workingDoctorsForSelectedDate = useMemo(() => state.doctors.filter(d => d.active && getScheduleForDate(d, selectedDate)), [state.doctors, selectedDate])

  const stats = useMemo(() => {
    const total = visibleBookings.length
    const waiting = visibleBookings.filter(b => b.status === 'waiting').length
    const called = visibleBookings.filter(b => b.status === 'called').length
    const inProgress = visibleBookings.filter(b => b.status === 'in_progress').length
    const finished = visibleBookings.filter(b => b.status === 'finished').length
    const skipped = visibleBookings.filter(b => b.status === 'skipped').length
    const postponed = visibleBookings.filter(b => b.status === 'postponed').length
    const cancelled = visibleBookings.filter(b => ['cancelled', 'no_show'].includes(b.status)).length
    const current = visibleBookings.find(b => b.status === 'called' || b.status === 'in_progress')
    const attendance = total ? Math.round((finished / Math.max(1, total - skipped - cancelled)) * 100) : 0
    const serviceTimes = visibleBookings
      .filter(b => b.enteredAt && b.finishedAt)
      .map(b => Math.round((new Date(b.finishedAt!).getTime() - new Date(b.enteredAt!).getTime()) / 60000))
      .filter(n => Number.isFinite(n) && n >= 0)
    const averageServiceMinutes = serviceTimes.length ? Math.round(serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length) : selectedDoctor?.averageVisitMinutes || 0
    return { total, waiting, called, inProgress, finished, skipped, postponed, cancelled, currentNumber: current?.queueNumber || 0, attendance, averageServiceMinutes }
  }, [visibleBookings, selectedDoctor?.averageVisitMinutes])

  const globalStats = useMemo(() => ({
    total: dayBookings.length,
    waiting: dayBookings.filter(b => ['waiting', 'postponed'].includes(b.status)).length,
    activeDoctors: workingDoctorsForSelectedDate.length,
    activeRooms: state.rooms.filter(r => r.active && workingDoctorsForSelectedDate.some(d => d.roomId === r.id)).length || new Set(workingDoctorsForSelectedDate.map(d => d.room).filter(Boolean)).size,
    finished: dayBookings.filter(b => b.status === 'finished').length,
    cancelled: dayBookings.filter(b => ['cancelled', 'no_show'].includes(b.status)).length,
    patients: state.patients.length,
    allBookings: state.bookings.length
  }), [dayBookings, state.bookings, state.rooms, state.patients, workingDoctorsForSelectedDate])

  const value: ClinicContextType = {
    ...state,
    selectedDate,
    stats,
    globalStats,
    selectedDoctor,
    selectedRoom,
    visibleBookings,
    dayBookings,
    selectedDateLabel: formatDate(selectedDate),
    workingDoctorsForSelectedDate,
    addRoom: room => dispatch({ type: 'ADD_ROOM', room }),
    updateRoom: (id, room) => dispatch({ type: 'UPDATE_ROOM', id, room }),
    deleteRoom: id => dispatch({ type: 'DELETE_ROOM', id }),
    toggleRoom: id => dispatch({ type: 'TOGGLE_ROOM', id }),
    addDoctor: doctor => dispatch({ type: 'ADD_DOCTOR', doctor }),
    updateDoctor: (id, doctor) => dispatch({ type: 'UPDATE_DOCTOR', id, doctor }),
    deleteDoctor: id => dispatch({ type: 'DELETE_DOCTOR', id }),
    toggleDoctor: id => dispatch({ type: 'TOGGLE_DOCTOR', id }),
    setDoctor: id => dispatch({ type: 'SET_DOCTOR', id }),
    setSelectedDate: date => dispatch({ type: 'SET_DATE', date }),
    addBooking: input => dispatch({ type: 'ADD_BOOKING', input }),
    updateBooking: (id, input) => dispatch({ type: 'UPDATE_BOOKING', id, input }),
    deleteBooking: id => dispatch({ type: 'DELETE_BOOKING', id }),
    updatePatient: (id, input) => dispatch({ type: 'UPDATE_PATIENT', id, input }),
    deletePatient: id => dispatch({ type: 'DELETE_PATIENT', id }),
    updateStatus: (id, status, note) => dispatch({ type: 'UPDATE_STATUS', id, status, note }),
    callNext: doctorId => dispatch({ type: 'CALL_NEXT', doctorId: doctorId || selectedDoctor?.id, date: selectedDate }),
    skip: id => dispatch({ type: 'SKIP', id }),
    postpone: id => dispatch({ type: 'POSTPONE', id }),
    returnToQueue: id => dispatch({ type: 'RETURN', id }),
    updateSettings: settings => dispatch({ type: 'UPDATE_SETTINGS', settings }),
    importState: state => dispatch({ type: 'IMPORT_STATE', state }),
    clearAllData: () => dispatch({ type: 'CLEAR_DATA' }),
    resetDemo: () => dispatch({ type: 'CLEAR_DATA' }),
    findBooking: query => {
      const q = query.trim()
      const normalized = normalizePhone(q)
      const allBookings = [...state.bookings].sort((a, b) => bookingDateTimeIso(b.bookedDate, b.bookedTime).localeCompare(bookingDateTimeIso(a.bookedDate, a.bookedTime)))
      return allBookings.find(b =>
        b.code.toLowerCase() === q.toLowerCase()
        || b.patientCode?.toLowerCase() === q.toLowerCase()
        || normalizePhone(b.phone) === normalized
        || (q.length > 1 && b.patientName.includes(q))
      )
    }
  }
  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
}

export const useClinic = () => {
  const ctx = useContext(ClinicContext)
  if (!ctx) throw new Error('useClinic must be used inside ClinicProvider')
  return ctx
}
