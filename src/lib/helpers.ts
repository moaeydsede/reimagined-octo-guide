import type { Booking, BookingStatus } from '../types'

export const todayKey = () => new Date().toISOString().slice(0, 10)

export const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`

export const normalizePhone = (phone: string) => phone.replace(/[\s\-()+]/g, '')

export const normalizePrefix = (prefix: string) => {
  const value = prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  return value || 'DR'
}

export const makeBookingCode = (doctorPrefix: string, queueNumber: number) => {
  return `${normalizePrefix(doctorPrefix)}-${String(queueNumber).padStart(3, '0')}`
}

export const sortQueue = (bookings: Booking[]) => [...bookings].sort((a, b) => {
  if (a.priority !== b.priority) return b.priority - a.priority
  return a.queueNumber - b.queueNumber
})

export const activeStatuses: BookingStatus[] = ['waiting', 'called', 'in_progress', 'postponed', 'skipped']

export const estimateMinutes = (bookings: Booking[], booking: Booking, avg = 10) => {
  const before = bookings.filter(b => b.doctorId === booking.doctorId && activeStatuses.includes(b.status) && b.queueNumber < booking.queueNumber && b.status !== 'skipped').length
  return Math.max(0, before * avg)
}

export const shareWhatsApp = (phone: string, message: string) => {
  const p = normalizePhone(phone).replace(/^0/, '20')
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`
}

export const statusRank = (status: BookingStatus) => ({ called: 1, in_progress: 2, waiting: 3, postponed: 4, skipped: 5, finished: 6, cancelled: 7, no_show: 8 } as Record<BookingStatus, number>)[status]
