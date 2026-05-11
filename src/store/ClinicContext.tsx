import React, { createContext, useContext, useMemo, useReducer } from 'react'
import type { ActivityLog, Booking, BookingStatus, ClinicState, Doctor, Patient } from '../types'
import { makeBookingCode, normalizePhone, normalizePrefix, uid } from '../lib/helpers'

type AddBookingInput = {
  patientName: string
  phone: string
  doctorId: string
  visitType: string
  notes?: string
  priority?: number
}

type AddDoctorInput = Omit<Doctor, 'id' | 'createdAt'>
type UpdateDoctorInput = Partial<Omit<Doctor, 'id'>>
type UpdatePatientInput = Partial<Omit<Patient, 'id'>>
type UpdateBookingInput = Partial<Pick<Booking, 'patientName' | 'phone' | 'visitType' | 'notes' | 'priority' | 'status' | 'doctorId'>>

type Action =
  | { type: 'ADD_DOCTOR'; doctor: AddDoctorInput }
  | { type: 'UPDATE_DOCTOR'; id: string; doctor: UpdateDoctorInput }
  | { type: 'DELETE_DOCTOR'; id: string }
  | { type: 'TOGGLE_DOCTOR'; id: string }
  | { type: 'SET_DOCTOR'; id: string }
  | { type: 'ADD_BOOKING'; input: AddBookingInput }
  | { type: 'UPDATE_BOOKING'; id: string; booking: UpdateBookingInput }
  | { type: 'DELETE_BOOKING'; id: string }
  | { type: 'UPDATE_PATIENT'; id: string; patient: UpdatePatientInput }
  | { type: 'DELETE_PATIENT'; id: string }
  | { type: 'UPDATE_STATUS'; id: string; status: BookingStatus; note?: string }
  | { type: 'CALL_NEXT'; doctorId: string }
  | { type: 'SKIP'; id: string }
  | { type: 'POSTPONE'; id: string }
  | { type: 'RETURN'; id: string }
  | { type: 'CLEAR_ALL' }

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
  addDoctor: (doctor: AddDoctorInput) => void
  updateDoctor: (id: string, doctor: UpdateDoctorInput) => void
  deleteDoctor: (id: string) => void
  toggleDoctor: (id: string) => void
  setDoctor: (id: string) => void
  addBooking: (input: AddBookingInput) => Booking | null
  updateBooking: (id: string, booking: UpdateBookingInput) => void
  deleteBooking: (id: string) => void
  updatePatient: (id: string, patient: UpdatePatientInput) => void
  deletePatient: (id: string) => void
  updateStatus: (id: string, status: BookingStatus, note?: string) => void
  callNext: (doctorId?: string) => void
  skip: (id: string) => void
  postpone: (id: string) => void
  returnToQueue: (id: string) => void
  clearAll: () => void
  resetDemo: () => void
  findBooking: (query: string) => Booking | undefined
}

const STORAGE_KEY = 'ayadat-al-mashfa-state-v3-multidoctor-clean'

const emptyState: ClinicState = {
  doctors: [],
  patients: [],
  bookings: [],
  logs: [],
  currentDoctorId: '',
  currentUserRole: 'admin'
}

const initialState: ClinicState = (() => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) return JSON.parse(cached) as ClinicState
  } catch {}
  return emptyState
})()

function makeLog(action: string, bookingId?: string, note?: string): ActivityLog {
  return { id: uid('log'), action, bookingId, note, doneBy: 'الإدارة', createdAt: new Date().toISOString() }
}

function save(state: ClinicState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  return state
}

function nextDoctorPrefix(state: ClinicState) {
  let number = state.doctors.length + 1
  let prefix = `D${number}`
  while (state.doctors.some(d => d.codePrefix === prefix)) {
    number += 1
    prefix = `D${number}`
  }
  return prefix
}

function nextQueueNumber(state: ClinicState, doctorId: string) {
  return Math.max(0, ...state.bookings.filter(b => b.doctorId === doctorId).map(b => b.queueNumber)) + 1
}

function ensurePatient(state: ClinicState, name: string, phone: string, notes?: string) {
  const cleanPhone = normalizePhone(phone)
  const existing = state.patients.find(p => normalizePhone(p.phone) === cleanPhone)
  if (existing) {
    const patient = { ...existing, name: name.trim() || existing.name, phone, notes: notes || existing.notes }
    return {
      patient,
      patients: state.patients.map(p => p.id === existing.id ? patient : p)
    }
  }
  const patient: Patient = { id: uid('patient'), name: name.trim(), phone, notes, createdAt: new Date().toISOString() }
  return { patient, patients: [...state.patients, patient] }
}

function reducer(state: ClinicState, action: Action): ClinicState {
  switch (action.type) {
    case 'ADD_DOCTOR': {
      const prefix = normalizePrefix(action.doctor.codePrefix || nextDoctorPrefix(state))
      const doctor: Doctor = { ...action.doctor, id: uid('doctor'), codePrefix: prefix, createdAt: new Date().toISOString() }
      return save({ ...state, doctors: [...state.doctors, doctor], currentDoctorId: state.currentDoctorId || doctor.id, logs: [...state.logs, makeLog('إضافة طبيب', undefined, `${doctor.name} - ${doctor.room}`)] })
    }
    case 'UPDATE_DOCTOR': {
      const doctors = state.doctors.map(d => {
        if (d.id !== action.id) return d
        const updated = { ...d, ...action.doctor }
        updated.codePrefix = normalizePrefix(updated.codePrefix || d.codePrefix)
        return updated
      })
      const doctor = doctors.find(d => d.id === action.id)
      const bookings = state.bookings.map(b => b.doctorId === action.id && doctor ? { ...b, doctorName: doctor.name, doctorRoom: doctor.room, doctorCodePrefix: doctor.codePrefix, code: makeBookingCode(doctor.codePrefix, b.queueNumber) } : b)
      return save({ ...state, doctors, bookings, logs: [...state.logs, makeLog('تعديل بيانات طبيب', undefined, doctor?.name)] })
    }
    case 'DELETE_DOCTOR': {
      const doctor = state.doctors.find(d => d.id === action.id)
      const doctors = state.doctors.filter(d => d.id !== action.id)
      const bookingsToRemove = state.bookings.filter(b => b.doctorId === action.id).map(b => b.id)
      const patientsUsed = new Set(state.bookings.filter(b => b.doctorId !== action.id).map(b => b.patientId))
      const patients = state.patients.filter(p => patientsUsed.has(p.id))
      return save({
        ...state,
        doctors,
        patients,
        bookings: state.bookings.filter(b => b.doctorId !== action.id),
        currentDoctorId: state.currentDoctorId === action.id ? (doctors[0]?.id || '') : state.currentDoctorId,
        logs: [...state.logs, makeLog('حذف طبيب وكل حجوزاته', undefined, `${doctor?.name || ''} - ${bookingsToRemove.length} حجز`)]
      })
    }
    case 'TOGGLE_DOCTOR': {
      return save({ ...state, doctors: state.doctors.map(d => d.id === action.id ? { ...d, active: !d.active } : d) })
    }
    case 'SET_DOCTOR': return save({ ...state, currentDoctorId: action.id })
    case 'ADD_BOOKING': {
      const doctor = state.doctors.find(d => d.id === action.input.doctorId)
      if (!doctor) return state
      const number = nextQueueNumber(state, doctor.id)
      const { patient, patients } = ensurePatient(state, action.input.patientName, action.input.phone, action.input.notes)
      const booking: Booking = {
        id: uid('booking'),
        code: makeBookingCode(doctor.codePrefix, number),
        patientId: patient.id,
        patientName: patient.name,
        phone: patient.phone,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorRoom: doctor.room,
        doctorCodePrefix: doctor.codePrefix,
        queueNumber: number,
        visitType: action.input.visitType,
        priority: action.input.priority || 0,
        status: 'waiting',
        notes: action.input.notes,
        createdAt: new Date().toISOString(),
        bookedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }
      return save({ ...state, patients, bookings: [...state.bookings, booking], logs: [...state.logs, makeLog('إضافة حجز جديد', booking.id, `${doctor.codePrefix} رقم ${booking.queueNumber}`)] })
    }
    case 'UPDATE_BOOKING': {
      const booking = state.bookings.find(b => b.id === action.id)
      if (!booking) return state
      const nextDoctor = action.booking.doctorId ? state.doctors.find(d => d.id === action.booking.doctorId) : state.doctors.find(d => d.id === booking.doctorId)
      const phone = action.booking.phone ?? booking.phone
      const patientName = action.booking.patientName ?? booking.patientName
      const patients = state.patients.map(p => p.id === booking.patientId ? { ...p, name: patientName, phone, notes: action.booking.notes ?? p.notes } : p)
      const bookings = state.bookings.map(b => {
        if (b.id !== action.id) return b
        let queueNumber = b.queueNumber
        if (nextDoctor && nextDoctor.id !== b.doctorId) queueNumber = nextQueueNumber(state, nextDoctor.id)
        return {
          ...b,
          ...action.booking,
          patientName,
          phone,
          doctorId: nextDoctor?.id || b.doctorId,
          doctorName: nextDoctor?.name || b.doctorName,
          doctorRoom: nextDoctor?.room || b.doctorRoom,
          doctorCodePrefix: nextDoctor?.codePrefix || b.doctorCodePrefix,
          queueNumber,
          code: makeBookingCode(nextDoctor?.codePrefix || b.doctorCodePrefix, queueNumber)
        }
      })
      return save({ ...state, patients, bookings, logs: [...state.logs, makeLog('تعديل حجز', action.id)] })
    }
    case 'DELETE_BOOKING': {
      const removed = state.bookings.find(b => b.id === action.id)
      const bookings = state.bookings.filter(b => b.id !== action.id)
      const patientIdsInUse = new Set(bookings.map(b => b.patientId))
      const patients = state.patients.filter(p => patientIdsInUse.has(p.id))
      return save({ ...state, bookings, patients, logs: [...state.logs, makeLog('حذف حجز', action.id, removed?.code)] })
    }
    case 'UPDATE_PATIENT': {
      const patients = state.patients.map(p => p.id === action.id ? { ...p, ...action.patient } : p)
      const patient = patients.find(p => p.id === action.id)
      const bookings = state.bookings.map(b => b.patientId === action.id && patient ? { ...b, patientName: patient.name, phone: patient.phone, notes: action.patient.notes ?? b.notes } : b)
      return save({ ...state, patients, bookings, logs: [...state.logs, makeLog('تعديل بيانات مريض', undefined, patient?.name)] })
    }
    case 'DELETE_PATIENT': {
      const patient = state.patients.find(p => p.id === action.id)
      return save({
        ...state,
        patients: state.patients.filter(p => p.id !== action.id),
        bookings: state.bookings.filter(b => b.patientId !== action.id),
        logs: [...state.logs, makeLog('حذف مريض وكل حجوزاته', undefined, patient?.name)]
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
        logs: [...state.logs, makeLog(`تحديث الحالة إلى ${action.status}`, action.id, action.note)]
      })
    }
    case 'CALL_NEXT': {
      const candidates = state.bookings
        .filter(b => b.doctorId === action.doctorId && ['waiting', 'postponed'].includes(b.status))
        .sort((a, b) => (b.priority - a.priority) || (a.queueNumber - b.queueNumber))
      const next = candidates[0]
      if (!next) return state
      const now = new Date().toISOString()
      return save({
        ...state,
        bookings: state.bookings.map(b => b.doctorId === action.doctorId && b.status === 'called' ? { ...b, status: 'skipped' } : b.id === next.id ? { ...b, status: 'called', calledAt: now } : b),
        logs: [...state.logs, makeLog('نداء التالي', next.id, `تم نداء ${next.code}`)]
      })
    }
    case 'SKIP': return reducer(state, { type: 'UPDATE_STATUS', id: action.id, status: 'skipped', note: 'المريض غير موجود' })
    case 'POSTPONE': return reducer(state, { type: 'UPDATE_STATUS', id: action.id, status: 'postponed', note: 'تم التأجيل مؤقتًا' })
    case 'RETURN': return reducer(state, { type: 'UPDATE_STATUS', id: action.id, status: 'waiting', note: 'تم إرجاع المريض للدور' })
    case 'CLEAR_ALL': return save(emptyState)
    default: return state
  }
}

const ClinicContext = createContext<ClinicContextType | null>(null)

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const selectedDoctor = state.doctors.find(d => d.id === state.currentDoctorId) || state.doctors[0]
  const visibleBookings = useMemo(() => state.bookings.filter(b => b.doctorId === selectedDoctor?.id).sort((a, b) => a.queueNumber - b.queueNumber), [state.bookings, selectedDoctor?.id])
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
    addBooking: input => { dispatch({ type: 'ADD_BOOKING', input }); return null },
    updateBooking: (id, booking) => dispatch({ type: 'UPDATE_BOOKING', id, booking }),
    deleteBooking: id => dispatch({ type: 'DELETE_BOOKING', id }),
    updatePatient: (id, patient) => dispatch({ type: 'UPDATE_PATIENT', id, patient }),
    deletePatient: id => dispatch({ type: 'DELETE_PATIENT', id }),
    updateStatus: (id, status, note) => dispatch({ type: 'UPDATE_STATUS', id, status, note }),
    callNext: doctorId => { const id = doctorId || selectedDoctor?.id; if (id) dispatch({ type: 'CALL_NEXT', doctorId: id }) },
    skip: id => dispatch({ type: 'SKIP', id }),
    postpone: id => dispatch({ type: 'POSTPONE', id }),
    returnToQueue: id => dispatch({ type: 'RETURN', id }),
    clearAll: () => dispatch({ type: 'CLEAR_ALL' }),
    resetDemo: () => dispatch({ type: 'CLEAR_ALL' }),
    findBooking: query => {
      const q = query.trim().replace(/\s/g, '')
      return state.bookings.find(b => b.code.toLowerCase() === q.toLowerCase() || normalizePhone(b.phone) === q || b.patientName.includes(query.trim()))
    }
  }
  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
}

export const useClinic = () => {
  const ctx = useContext(ClinicContext)
  if (!ctx) throw new Error('useClinic must be used inside ClinicProvider')
  return ctx
}
