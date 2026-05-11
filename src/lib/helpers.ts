import type { Booking, BookingStatus, Doctor, DoctorSchedule, Room } from '../types'

export const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export const toDateKey = (date = new Date()) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const todayKey = () => toDateKey(new Date())

export const parseDateKey = (dateKey?: string) => {
  const safe = dateKey || todayKey()
  const [year, month, day] = safe.split('-').map(Number)
  return new Date(year || new Date().getFullYear(), Math.max(0, (month || 1) - 1), day || 1)
}

export const getDayOfWeek = (dateKey: string) => parseDateKey(dateKey).getDay()

export const formatDate = (dateKey?: string) => dateKey ? parseDateKey(dateKey).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'

export const formatShortDate = (dateKey?: string) => dateKey ? parseDateKey(dateKey).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36).slice(-6)}`

export const sanitizePrefix = (prefix: string) => {
  const cleaned = prefix.trim().replace(/\s+/g, '').replace(/[^A-Za-z0-9\u0600-\u06FF-]/g, '').toUpperCase()
  return cleaned || 'DR'
}

export const makePatientCode = (doctorPrefix: string, patientNumber: number) => `${sanitizePrefix(doctorPrefix)}-${String(patientNumber).padStart(4, '0')}`

export const normalizePhone = (phone: string) => phone.replace(/[\s\-()+]/g, '')

export const formatDateTime = (iso?: string) => iso ? new Date(iso).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export const formatTime = (iso?: string) => iso ? new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'

export const formatBookingDateTime = (booking: Pick<Booking, 'bookedDate' | 'bookedTime' | 'bookedAt'>) => {
  const date = booking.bookedDate ? formatShortDate(booking.bookedDate) : ''
  const time = booking.bookedTime || booking.bookedAt || ''
  return [date, time].filter(Boolean).join(' • ') || '—'
}

export const durationMinutes = (start?: string, end?: string) => {
  if (!start || !end) return 0
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  return Number.isFinite(diff) ? Math.max(0, diff) : 0
}

export const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

export const minutesToTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export const makeSchedule = (dayOfWeek: number, startTime = '09:00', endTime = '17:00', active = true, maxBookings?: number): DoctorSchedule => ({
  id: uid('schedule'),
  dayOfWeek,
  dayName: dayNames[dayOfWeek] || 'غير محدد',
  startTime,
  endTime,
  active,
  maxBookings
})

export const defaultDoctorSchedules = () => [0, 1, 2, 3, 4].map(day => makeSchedule(day, '09:00', '17:00', true))

export const normalizeSchedules = (schedules?: Partial<DoctorSchedule>[]) => {
  if (!schedules?.length) return defaultDoctorSchedules()
  return schedules.map(s => {
    const dayOfWeek = Number(s.dayOfWeek)
    const safeDay = Number.isFinite(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6 ? dayOfWeek : 0
    return {
      id: s.id || uid('schedule'),
      dayOfWeek: safeDay,
      dayName: s.dayName || dayNames[safeDay] || 'غير محدد',
      startTime: s.startTime || '09:00',
      endTime: s.endTime || '17:00',
      active: s.active !== false,
      maxBookings: Number(s.maxBookings) > 0 ? Number(s.maxBookings) : undefined
    }
  }).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
}

export const getScheduleForDate = (doctor?: Pick<Doctor, 'schedules'>, dateKey = todayKey()) => {
  if (!doctor) return undefined
  const day = getDayOfWeek(dateKey)
  return normalizeSchedules(doctor.schedules).find(s => s.dayOfWeek === day && s.active && timeToMinutes(s.endTime) > timeToMinutes(s.startTime))
}

export const isDoctorWorkingOnDate = (doctor?: Pick<Doctor, 'schedules'>, dateKey = todayKey()) => Boolean(getScheduleForDate(doctor, dateKey))

export const generateTimeSlots = (doctor?: Pick<Doctor, 'averageVisitMinutes' | 'schedules'>, dateKey = todayKey(), bookedTimes: string[] = []) => {
  const schedule = getScheduleForDate(doctor, dateKey)
  if (!doctor || !schedule) return []
  const step = Math.max(5, Number(doctor.averageVisitMinutes) || 10)
  const start = timeToMinutes(schedule.startTime)
  const end = timeToMinutes(schedule.endTime)
  const booked = new Set(bookedTimes)
  const slots: { time: string; available: boolean }[] = []
  for (let t = start; t + step <= end; t += step) {
    const time = minutesToTime(t)
    slots.push({ time, available: !booked.has(time) })
  }
  return slots
}

export const describeScheduleForDate = (doctor?: Pick<Doctor, 'schedules'>, dateKey = todayKey()) => {
  const schedule = getScheduleForDate(doctor, dateKey)
  return schedule ? `${schedule.dayName} من ${schedule.startTime} إلى ${schedule.endTime}` : 'الطبيب غير متاح في هذا اليوم'
}

export const sortQueue = (bookings: Booking[]) => [...bookings].sort((a, b) => {
  if (a.priority !== b.priority) return b.priority - a.priority
  return a.queueNumber - b.queueNumber
})

export const activeStatuses: BookingStatus[] = ['waiting', 'called', 'in_progress', 'postponed']

export const estimateMinutes = (bookings: Booking[], booking: Booking, avg = 10) => {
  const before = bookings.filter(b => b.doctorId === booking.doctorId && b.bookedDate === booking.bookedDate && activeStatuses.includes(b.status) && b.queueNumber < booking.queueNumber).length
  return Math.max(0, before * avg)
}

export const shareWhatsApp = (phone: string, message: string) => {
  const p = normalizePhone(phone).replace(/^0/, '20')
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`
}

export const statusRank = (status: BookingStatus) => ({ called: 1, in_progress: 2, waiting: 3, postponed: 4, skipped: 5, finished: 6, cancelled: 7, no_show: 8 } as Record<BookingStatus, number>)[status]

export const getRoomName = (rooms: Room[], doctor?: Pick<Doctor, 'room' | 'roomId'>) => {
  if (!doctor) return ''
  return rooms.find(r => r.id === doctor.roomId)?.name || doctor.room || 'بدون غرفة'
}

export const buildTicketMessage = (template: string, booking: Booking, doctor?: Doctor) => {
  const replacements: Record<string, string | number> = {
    patient: booking.patientName,
    queue: booking.queueNumber,
    code: booking.patientCode || booking.code,
    doctor: booking.doctorName,
    room: booking.roomName || doctor?.room || 'غير محدد',
    type: booking.visitType,
    date: formatShortDate(booking.bookedDate),
    day: dayNames[getDayOfWeek(booking.bookedDate)] || '',
    time: booking.bookedTime || booking.bookedAt
  }
  return Object.entries(replacements).reduce((text, [key, value]) => text.split(`{${key}}`).join(String(value)), template)
}

export const downloadTextFile = (filename: string, content: string, type = 'application/json') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
