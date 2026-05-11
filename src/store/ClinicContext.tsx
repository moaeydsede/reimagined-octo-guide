import React, { createContext, useContext, useMemo, useReducer } from 'react'
import type { ActivityLog, Booking, BookingStatus, ClinicState, Doctor, Patient } from '../types'
import { seedBookings, seedDoctors, seedLogs, seedPatients } from '../data/seed'
import { makeBookingCode, uid } from '../lib/helpers'

type AddBookingInput = {
  patientName: string
  phone: string
  doctorId: string
  visitType: string
  notes?: string
  priority?: number
}

type Action =
  | { type: 'ADD_DOCTOR'; doctor: Omit<Doctor, 'id'> }
  | { type: 'TOGGLE_DOCTOR'; id: string }
  | { type: 'SET_DOCTOR'; id: string }
  | { type: 'ADD_BOOKING'; input: AddBookingInput }
  | { type: 'UPDATE_STATUS'; id: string; status: BookingStatus; note?: string }
  | { type: 'CALL_NEXT'; doctorId: string }
  | { type: 'SKIP'; id: string }
  | { type: 'POSTPONE'; id: string }
  | { type: 'RETURN'; id: string }
  | { type: 'RESET_DEMO' }

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
  selectedDoctor: Doctor
  visibleBookings: Booking[]
  addDoctor: (doctor: Omit<Doctor, 'id'>) => void
  toggleDoctor: (id: string) => void
  setDoctor: (id: string) => void
  addBooking: (input: AddBookingInput) => Booking | null
  updateStatus: (id: string, status: BookingStatus, note?: string) => void
  callNext: (doctorId?: string) => void
  skip: (id: string) => void
  postpone: (id: string) => void
  returnToQueue: (id: string) => void
  resetDemo: () => void
  findBooking: (query: string) => Booking | undefined
}

const STORAGE_KEY = 'ayadat-al-mashfa-state-v1'

const initialState: ClinicState = (() => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) return JSON.parse(cached) as ClinicState
  } catch {}
  return {
    doctors: seedDoctors,
    patients: seedPatients,
    bookings: seedBookings,
    logs: seedLogs,
    currentDoctorId: seedDoctors[0].id,
    currentUserRole: 'admin'
  }
})()

function log(action: string, bookingId: string, note?: string): ActivityLog {
  return { id: uid('log'), action, bookingId, note, doneBy: 'الإدارة', createdAt: new Date().toISOString() }
}

function save(state: ClinicState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  return state
}

function reducer(state: ClinicState, action: Action): ClinicState {
  switch (action.type) {
    case 'ADD_DOCTOR': {
      const doctor = { ...action.doctor, id: uid('doctor') }
      return save({ ...state, doctors: [...state.doctors, doctor], currentDoctorId: state.currentDoctorId || doctor.id })
    }
    case 'TOGGLE_DOCTOR': {
      return save({ ...state, doctors: state.doctors.map(d => d.id === action.id ? { ...d, active: !d.active } : d) })
    }
    case 'SET_DOCTOR': return save({ ...state, currentDoctorId: action.id })
    case 'ADD_BOOKING': {
      const doctor = state.doctors.find(d => d.id === action.input.doctorId) || state.doctors[0]
      if (!doctor) return state
      const nextNumber = Math.max(0, ...state.bookings.filter(b => b.doctorId === doctor.id).map(b => b.queueNumber)) + 1
      const patient: Patient = { id: uid('patient'), name: action.input.patientName, phone: action.input.phone, notes: action.input.notes }
      const booking: Booking = {
        id: uid('booking'),
        code: makeBookingCode(nextNumber),
        patientId: patient.id,
        patientName: patient.name,
        phone: patient.phone,
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
        patients: [...state.patients, patient],
        bookings: [...state.bookings, booking],
        logs: [...state.logs, log('إضافة حجز جديد', booking.id, `رقم الدور ${booking.queueNumber}`)]
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
    case 'RESET_DEMO': return save({ ...initialState, doctors: seedDoctors, patients: seedPatients, bookings: seedBookings, logs: seedLogs, currentDoctorId: seedDoctors[0].id })
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
    toggleDoctor: id => dispatch({ type: 'TOGGLE_DOCTOR', id }),
    setDoctor: id => dispatch({ type: 'SET_DOCTOR', id }),
    addBooking: input => {
      dispatch({ type: 'ADD_BOOKING', input })
      return null
    },
    updateStatus: (id, status, note) => dispatch({ type: 'UPDATE_STATUS', id, status, note }),
    callNext: doctorId => dispatch({ type: 'CALL_NEXT', doctorId: doctorId || selectedDoctor.id }),
    skip: id => dispatch({ type: 'SKIP', id }),
    postpone: id => dispatch({ type: 'POSTPONE', id }),
    returnToQueue: id => dispatch({ type: 'RETURN', id }),
    resetDemo: () => dispatch({ type: 'RESET_DEMO' }),
    findBooking: query => {
      const q = query.trim().replace(/\s/g, '')
      return state.bookings.find(b => b.code.toLowerCase() === q.toLowerCase() || b.phone.replace(/\s/g, '') === q || b.patientName.includes(query.trim()))
    }
  }
  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
}

export const useClinic = () => {
  const ctx = useContext(ClinicContext)
  if (!ctx) throw new Error('useClinic must be used inside ClinicProvider')
  return ctx
}
