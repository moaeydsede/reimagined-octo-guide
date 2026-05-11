import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()
const ADMIN_UID = 'a2uvKrLDoNVPOafbOOM8BlErxek1'

const requireStaff = (uid?: string) => {
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
}

export const createBooking = onCall(async request => {
  requireStaff(request.auth?.uid)
  const { patientName, phone, doctorId, doctorName, visitType, notes } = request.data || {}
  if (!patientName || !phone || !doctorId) throw new HttpsError('invalid-argument', 'Missing booking data')
  const counterRef = db.collection('settings').doc(`counter_${doctorId}`)
  const bookingRef = db.collection('bookings').doc()
  const patientRef = db.collection('patients').doc()
  await db.runTransaction(async tx => {
    const counter = await tx.get(counterRef)
    const next = ((counter.data()?.lastNumber || 0) as number) + 1
    tx.set(counterRef, { lastNumber: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.set(patientRef, { name: patientName, phone, notes: notes || '', createdAt: FieldValue.serverTimestamp() })
    tx.set(bookingRef, {
      patientId: patientRef.id,
      patientName,
      phone,
      doctorId,
      doctorName: doctorName || '',
      queueNumber: next,
      code: `M${next}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      visitType: visitType || 'كشف',
      status: 'waiting',
      priority: 0,
      createdAt: FieldValue.serverTimestamp()
    })
  })
  return { id: bookingRef.id }
})

export const updateBookingStatus = onCall(async request => {
  requireStaff(request.auth?.uid)
  const { id, status } = request.data || {}
  if (!id || !status) throw new HttpsError('invalid-argument', 'Missing status data')
  await db.collection('bookings').doc(id).set({ status, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  await db.collection('activityLogs').add({ bookingId: id, action: status, doneBy: request.auth?.uid, createdAt: FieldValue.serverTimestamp() })
  return { ok: true }
})

export const adminOnly = onCall(async request => {
  if (request.auth?.uid !== ADMIN_UID) throw new HttpsError('permission-denied', 'Admin only')
  return { ok: true }
})
