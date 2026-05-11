import React, { createContext, useContext, useMemo, useReducer } from 'react'
import type { ActivityLog, Booking, BookingStatus, ClinicState, Doctor, Patient } from '../types'
import { seedBookings, seedDoctors, seedLogs, seedPatients } from '../data/seed'
import { makePatientCode, normalizePhone, sanitizePrefix, uid } from '../lib/helpers'

type AddBookingInput = {
  patientName: string
  phone: string
  doctorId: string
  visitType: string
  notes?: string
  priority?: number
}

type UpdateBookingInput = Partial<Pick<Booking, 'patientName' | 'phone' | 'doctorId' | 'visitType' | 'notes' | 'priority' | 'status'>>
type UpdateDoctorInput = Partial<Omit<Doctor, 'id'>>
type UpdatePatientInput = Partial<Pick<Patient, 'name' | 'phone' | 'age' | 'notes'>>

type Action =
  | { type: 'ADD_DOCTOR'; doctor: Omit<Doctor, 'id'> }
  | { type: 'UPDATE_DOCTOR'; id: string; doctor: UpdateDoctorInput }
  | { type: 'DELETE_DOCTOR'; id: string }
  | { type: 'TOGGLE_DOCTOR'; id: string }
  | { type: 'SET_DOCTOR'; id: string }
  | { type: 'ADD_BOOKING'; input: AddBookingInput }
  | { type: 'UPDATE_BOOKING'; id: string; input: UpdateBookingInput }
  | { type: 'DELETE_BOOKING'; id: string }
  | { type: 'UPDATE_PATIENT'; id: string; input: UpdatePatientInput }
  | { type: 'DELETE_PATIENT'; id: string }
  | { type: 'UPDATE_STATUS'; id: string; status: BookingStatus; note?: string }
  | { type: 'CALL_NEXT'; doctorId?: string }
  | { type: 'SKIP'; id: string }
  | { type: 'POSTPONE'; id: string }
  | { type: 'RETURN'; id: string }
  | { type: 'CLEAR_DATA' }

type ClinicContextType = ClinicState & {
  stats: {
    total: number
    waiting: number
    finished: number
    skipped: number
    postponed: number
    currentNumber: number
    attendance: number
  }
  selectedDoctor?: Doctor
  visibleBookings: Booking[]
  addDoctor: (doctor: Omit<Doctor, 'id'>) => void
  updateDoctor: (id: string, doctor: UpdateDoctorInput) => void
  deleteDoctor: (id: string) => void
  toggleDoctor: (id: string) => void
  setDoctor: (id: string) => void
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
  clearAllData: () => void
  resetDemo: () => void
  findBooking: (query: string) => Booking | undefined
}

const STORAGE_KEY = 'ayadat-al-mashfa-state-v2-empty'

const emptyState: ClinicState = {
  doctors: seedDoctors,
  patients: seedPatients,
  bookings: seedBookings,
  logs: seedLogs,
  currentDoctorId: '',
  currentUserRole: 'admin'
}

const initialState: ClinicState = (() => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached) as ClinicState
      return {
        ...emptyState,
        ...parsed,
        doctors: parsed.doctors || [],
        patients: parsed.patients || [],
        bookings: parsed.bookings || [],
        logs: parsed.logs || [],
        currentDoctorId: parsed.currentDoctorId || parsed.doctors?.[0]?.id || ''
      }
    }
  } catch {}
  return emptyState
})()

function log(action: string, bookingId: string, note?: string): ActivityLog {
  return { id: uid('log'), action, bookingId, note, doneBy: 'الإدارة', createdAt: new Date().toISOString() }
}

function save(state: ClinicState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  return state
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

function nextQueueNumber(state: ClinicState, doctorId: string) {
  return Math.max(0, ...state.bookings.filter(b => b.doctorId === doctorId).map(b => b.queueNumber)) + 1
}

function nextPatientNumber(state: ClinicState, doctorId: string) {
  return Math.max(0, ...state.patients.filter(p => p.doctorId === doctorId).map(p => p.patientNumber || 0)) + 1
}

function upsertPatientForDoctor(state: ClinicState, doctor: Doctor, input: { name: string; phone: string; notes?: string }, preferredPatientId?: string) {
  const phone = normalizePhone(input.phone)
  const existing = state.patients.find(p => preferredPatientId && p.id === preferredPatientId && p.doctorId === doctor.id)
    || state.patients.find(p => p.doctorId === doctor.id && normalizePhone(p.phone) === phone)

  if (existing) {
    const patient: Patient = { ...existing, name: input.name, phone: input.phone, notes: input.notes ?? existing.notes, doctorName: doctor.name }
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
    createdAt: new Date().toISOString()
  }
  return { patient, patients: [...state.patients, patient] }
}

function reducer(state: ClinicState, action: Action): ClinicState {
  switch (action.type) {
    case 'ADD_DOCTOR': {
      const prefix = sanitizePrefix(action.doctor.codePrefix || nextDoctorPrefix(state))
      const doctor = { ...action.doctor, codePrefix: prefix, id: uid('doctor') }
      return save({ ...state, doctors: [...state.doctors, doctor], currentDoctorId: state.currentDoctorId || doctor.id })
    }
    case 'UPDATE_DOCTOR': {
      const original = state.doctors.find(d => d.id === action.id)
      if (!original) return state
      const updatedDoctor: Doctor = {
        ...original,
        ...action.doctor,
        codePrefix: sanitizePrefix(action.doctor.codePrefix ?? original.codePrefix),
        averageVisitMinutes: Math.max(1, Number(action.doctor.averageVisitMinutes ?? original.averageVisitMinutes) || original.averageVisitMinutes)
      }
      return save({
        ...state,
        doctors: state.doctors.map(d => d.id === action.id ? updatedDoctor : d),
        patients: state.patients.map(p => p.doctorId === action.id ? { ...p, doctorName: updatedDoctor.name } : p),
        bookings: state.bookings.map(b => b.doctorId === action.id ? { ...b, doctorName: updatedDoctor.name } : b)
      })
    }
    case 'DELETE_DOCTOR': {
      const remainingDoctors = state.doctors.filter(d => d.id !== action.id)
      return save({
        ...state,
        doctors: remainingDoctors,
        patients: state.patients.filter(p => p.doctorId !== action.id),
        bookings: state.bookings.filter(b => b.doctorId !== action.id),
        logs: state.logs.filter(l => !state.bookings.some(b => b.doctorId === action.id && b.id === l.bookingId)),
        currentDoctorId: state.currentDoctorId === action.id ? (remainingDoctors[0]?.id || '') : state.currentDoctorId
      })
    }
    case 'TOGGLE_DOCTOR': {
      return save({ ...state, doctors: state.doctors.map(d => d.id === action.id ? { ...d, active: !d.active } : d) })
    }
    case 'SET_DOCTOR': return save({ ...state, currentDoctorId: action.id })
    case 'ADD_BOOKING': {
      const doctor = state.doctors.find(d => d.id === action.input.doctorId)
      if (!doctor) return state
      const patientResult = upsertPatientForDoctor(state, doctor, { name: action.input.patientName, phone: action.input.phone, notes: action.input.notes })
      const nextNumber = nextQueueNumber({ ...state, patients: patientResult.patients }, doctor.id)
      const booking: Booking = {
        id: uid('booking'),
        code: patientResult.patient.code,
        patientCode: patientResult.patient.code,
        patientId: patientResult.patient.id,
        patientName: patientResult.patient.name,
        phone: patientResult.patient.phone,
        doctorId: doctor.id,
        doctorName: doctor.name,
        queueNumber: nextNumber,
        visitType: action.input.visitType,
        priority: action.input.priority || 0,
        status: 'waiting',
        notes: action.input.notes,
        createdAt: new Date().toISOString(),
        bookedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }
      return save({
        ...state,
        patients: patientResult.patients,
        bookings: [...state.bookings, booking],
        logs: [...state.logs, log('إضافة حجز جديد', booking.id, `رقم الدور ${booking.queueNumber} - كود المريض ${booking.patientCode}`)]
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
      const movedToAnotherDoctor = targetDoctor.id !== booking.doctorId
      const patientResult = upsertPatientForDoctor(state, targetDoctor, { name: patientName, phone, notes }, movedToAnotherDoctor ? undefined : booking.patientId)
      const queueNumber = movedToAnotherDoctor ? nextQueueNumber({ ...state, patients: patientResult.patients }, targetDoctor.id) : booking.queueNumber
      const updatedBooking: Booking = {
        ...booking,
        ...action.input,
        doctorId: targetDoctor.id,
        doctorName: targetDoctor.name,
        patientId: patientResult.patient.id,
        patientName: patientResult.patient.name,
        phone: patientResult.patient.phone,
        code: patientResult.patient.code,
        patientCode: patientResult.patient.code,
        queueNumber,
        priority: Number(action.input.priority ?? booking.priority) || 0,
        notes
      }
      return save({
        ...state,
        patients: patientResult.patients,
        bookings: state.bookings.map(b => b.id === booking.id ? updatedBooking : b),
        logs: [...state.logs, log('تعديل الحجز', booking.id, `تم تحديث بيانات الدور ${updatedBooking.queueNumber}`)]
      })
    }
    case 'DELETE_BOOKING': {
      return save({ ...state, bookings: state.bookings.filter(b => b.id !== action.id), logs: [...state.logs, log('حذف الحجز', action.id)] })
    }
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
      return save({
        ...state,
        patients: state.patients.filter(p => p.id !== action.id),
        bookings: state.bookings.filter(b => b.patientId !== action.id),
        logs: state.logs.filter(l => !state.bookings.some(b => b.patientId === action.id && b.id === l.bookingId))
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
      const candidates = state.bookings
        .filter(b => b.doctorId === action.doctorId && ['waiting', 'postponed'].includes(b.status))
        .sort((a, b) => (b.priority - a.priority) || (a.queueNumber - b.queueNumber))
      const next = candidates[0]
      if (!next) return state
      const now = new Date().toISOString()
      return save({
        ...state,
        bookings: state.bookings.map(b => b.doctorId === action.doctorId && b.status === 'called' ? { ...b, status: 'skipped' } : b.id === next.id ? { ...b, status: 'called', calledAt: now } : b),
        logs: [...state.logs, log('نداء التالي', next.id, `تم نداء الدور ${next.queueNumber}`)]
      })
    }
    case 'SKIP': return reducer(state, { type: 'UPDATE_STATUS', id: action.id, status: 'skipped', note: 'المريض غير موجود' })
    case 'POSTPONE': return reducer(state, { type: 'UPDATE_STATUS', id: action.id, status: 'postponed', note: 'تم التأجيل مؤقتًا' })
    case 'RETURN': return reducer(state, { type: 'UPDATE_STATUS', id: action.id, status: 'waiting', note: 'تم إرجاع المريض للدور' })
    case 'CLEAR_DATA': return save(emptyState)
    default: return state
  }
}

const ClinicContext = createContext<ClinicContextType | null>(null)

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const selectedDoctor = state.doctors.find(d => d.id === state.currentDoctorId) || state.doctors[0]
  const visibleBookings = useMemo(() => state.bookings.filter(b => selectedDoctor && b.doctorId === selectedDoctor.id).sort((a, b) => a.queueNumber - b.queueNumber), [state.bookings, selectedDoctor?.id])
  const stats = useMemo(() => {
    const total = visibleBookings.length
    const waiting = visibleBookings.filter(b => b.status === 'waiting').length
    const finished = visibleBookings.filter(b => b.status === 'finished').length
    const skipped = visibleBookings.filter(b => b.status === 'skipped').length
    const postponed = visibleBookings.filter(b => b.status === 'postponed').length
    const current = visibleBookings.find(b => b.status === 'called' || b.status === 'in_progress')
    const attendance = total ? Math.round((finished / Math.max(1, total - skipped)) * 100) : 0
    return { total, waiting, finished, skipped, postponed, currentNumber: current?.queueNumber || 0, attendance }
  }, [visibleBookings])

  const value: ClinicContextType = {
    ...state,
    stats,
    selectedDoctor,
    visibleBookings,
    addDoctor: doctor => dispatch({ type: 'ADD_DOCTOR', doctor }),
    updateDoctor: (id, doctor) => dispatch({ type: 'UPDATE_DOCTOR', id, doctor }),
    deleteDoctor: id => dispatch({ type: 'DELETE_DOCTOR', id }),
    toggleDoctor: id => dispatch({ type: 'TOGGLE_DOCTOR', id }),
    setDoctor: id => dispatch({ type: 'SET_DOCTOR', id }),
    addBooking: input => dispatch({ type: 'ADD_BOOKING', input }),
    updateBooking: (id, input) => dispatch({ type: 'UPDATE_BOOKING', id, input }),
    deleteBooking: id => dispatch({ type: 'DELETE_BOOKING', id }),
    updatePatient: (id, input) => dispatch({ type: 'UPDATE_PATIENT', id, input }),
    deletePatient: id => dispatch({ type: 'DELETE_PATIENT', id }),
    updateStatus: (id, status, note) => dispatch({ type: 'UPDATE_STATUS', id, status, note }),
    callNext: doctorId => dispatch({ type: 'CALL_NEXT', doctorId: doctorId || selectedDoctor?.id }),
    skip: id => dispatch({ type: 'SKIP', id }),
    postpone: id => dispatch({ type: 'POSTPONE', id }),
    returnToQueue: id => dispatch({ type: 'RETURN', id }),
    clearAllData: () => dispatch({ type: 'CLEAR_DATA' }),
    resetDemo: () => dispatch({ type: 'CLEAR_DATA' }),
    findBooking: query => {
      const q = query.trim()
      const normalized = normalizePhone(q)
      const allBookings = [...state.bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
