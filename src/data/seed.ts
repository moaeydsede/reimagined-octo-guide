import type { Booking, Doctor, Patient, ActivityLog } from '../types'

const today = new Date().toISOString().slice(0, 10)

export const seedDoctors: Doctor[] = [
  { id: 'doc-ahmed', name: 'د. أحمد محمد', specialty: 'باطنة عامة', room: 'غرفة 1', averageVisitMinutes: 10, active: true },
  { id: 'doc-sara', name: 'د. سارة علي', specialty: 'أطفال', room: 'غرفة 2', averageVisitMinutes: 12, active: true },
  { id: 'doc-mahmoud', name: 'د. محمود حسن', specialty: 'عظام', room: 'غرفة 3', averageVisitMinutes: 15, active: true }
]

export const seedPatients: Patient[] = [
  { id: 'p1', name: 'محمد أحمد', phone: '01012345678', age: 34 },
  { id: 'p2', name: 'سارة علي', phone: '01198765432', age: 28 },
  { id: 'p3', name: 'أحمد سمير', phone: '01234567890', age: 41 },
  { id: 'p4', name: 'منى خالد', phone: '01011112222', age: 22 },
  { id: 'p5', name: 'يوسف محمود', phone: '01122223333', age: 49 }
]

export const seedBookings: Booking[] = [
  { id: 'b18', code: 'A18X9', patientId: 'p1', patientName: 'محمد أحمد', phone: '01012345678', doctorId: 'doc-ahmed', doctorName: 'د. أحمد محمد', queueNumber: 18, visitType: 'كشف', status: 'called', priority: 0, createdAt: `${today}T10:00:00`, bookedAt: '10:00 ص', calledAt: new Date().toISOString() },
  { id: 'b19', code: 'A19X9', patientId: 'p2', patientName: 'سارة علي', phone: '01198765432', doctorId: 'doc-ahmed', doctorName: 'د. أحمد محمد', queueNumber: 19, visitType: 'استشارة', status: 'waiting', priority: 0, createdAt: `${today}T10:10:00`, bookedAt: '10:10 ص' },
  { id: 'b20', code: 'A20X9', patientId: 'p3', patientName: 'أحمد سمير', phone: '01234567890', doctorId: 'doc-ahmed', doctorName: 'د. أحمد محمد', queueNumber: 20, visitType: 'متابعة', status: 'waiting', priority: 0, createdAt: `${today}T10:20:00`, bookedAt: '10:20 ص' },
  { id: 'b21', code: 'A21X9', patientId: 'p4', patientName: 'منى خالد', phone: '01011112222', doctorId: 'doc-ahmed', doctorName: 'د. أحمد محمد', queueNumber: 21, visitType: 'كشف', status: 'postponed', priority: 0, createdAt: `${today}T10:30:00`, bookedAt: '10:30 ص', postponeAfter: 3 },
  { id: 'b22', code: 'A22X9', patientId: 'p5', patientName: 'يوسف محمود', phone: '01122223333', doctorId: 'doc-ahmed', doctorName: 'د. أحمد محمد', queueNumber: 22, visitType: 'كشف', status: 'waiting', priority: 0, createdAt: `${today}T10:40:00`, bookedAt: '10:40 ص' }
]

export const seedLogs: ActivityLog[] = [
  { id: 'log1', bookingId: 'b18', action: 'نداء المريض', doneBy: 'النظام', createdAt: new Date().toISOString(), note: 'تم نداء الدور 18' }
]
