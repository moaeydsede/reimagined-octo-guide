import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Booking, BookingStatus, Doctor, PatientTicket, QueueState, Role } from '../types';
import { firstName, generateBookingCode, normalizePhone, todayKey } from '../utils';

export const col = {
  doctors: collection(db, 'doctors'),
  bookings: collection(db, 'bookings'),
  tickets: collection(db, 'patientTickets'),
  users: collection(db, 'users'),
  logs: collection(db, 'activityLogs'),
  states: collection(db, 'queueStates')
};

function withId<T>(snap: DocumentData): T {
  return { id: snap.id, ...snap.data() } as T;
}

export function queueStateId(doctorId: string, dateKey = todayKey()) {
  return `${doctorId}_${dateKey}`;
}

export function subscribeDoctors(cb: (doctors: Doctor[]) => void): Unsubscribe {
  return onSnapshot(query(col.doctors, orderBy('name')), (snap) => cb(snap.docs.map((d) => withId<Doctor>(d))));
}

export function subscribeBookings(dateKey: string, doctorId: string | null, cb: (bookings: Booking[]) => void): Unsubscribe {
  const constraints: QueryConstraint[] = doctorId
    ? [where('dateKey', '==', dateKey), where('doctorId', '==', doctorId), orderBy('queueNumber')]
    : [where('dateKey', '==', dateKey), orderBy('queueNumber')];
  return onSnapshot(query(col.bookings, ...constraints), (snap) => cb(snap.docs.map((d) => withId<Booking>(d))));
}

export function subscribeQueueState(doctorId: string, dateKey: string, cb: (state: QueueState | null) => void): Unsubscribe {
  if (!doctorId) return () => undefined;
  return onSnapshot(doc(db, 'queueStates', queueStateId(doctorId, dateKey)), (snap) => cb(snap.exists() ? withId<QueueState>(snap) : null));
}

export function subscribePublicTickets(dateKey: string, doctorId: string | null, cb: (tickets: PatientTicket[]) => void): Unsubscribe {
  const constraints: QueryConstraint[] = doctorId
    ? [where('dateKey', '==', dateKey), where('doctorId', '==', doctorId), orderBy('queueNumber'), limit(80)]
    : [where('dateKey', '==', dateKey), orderBy('queueNumber'), limit(80)];
  return onSnapshot(query(col.tickets, ...constraints), (snap) => cb(snap.docs.map((d) => withId<PatientTicket>(d))));
}

export async function ensureBootstrapAdmin(uid: string, email: string | null) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      email: email || '',
      name: 'مدير النظام',
      role: 'admin' satisfies Role,
      active: true,
      createdAt: serverTimestamp()
    });
  }
}

export async function saveDoctor(payload: Partial<Doctor> & { name: string }) {
  const data = {
    name: payload.name.trim(),
    specialty: payload.specialty || 'عام',
    room: payload.room || 'غرفة الكشف',
    averageVisitMinutes: Number(payload.averageVisitMinutes || 10),
    isActive: payload.isActive ?? true,
    updatedAt: serverTimestamp()
  };
  if (payload.id) {
    await updateDoc(doc(db, 'doctors', payload.id), data);
    return payload.id;
  }
  const ref = await addDoc(col.doctors, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function removeDoctor(id: string) {
  await deleteDoc(doc(db, 'doctors', id));
}

export async function createBooking(payload: {
  patientName: string;
  phone: string;
  doctor: Doctor;
  visitType: string;
  notes?: string;
  dateKey?: string;
  priority?: number;
}) {
  const dateKey = payload.dateKey || todayKey();
  const phone = normalizePhone(payload.phone);
  if (!phone) throw new Error('رقم الهاتف مطلوب');
  if (!payload.patientName.trim()) throw new Error('اسم المريض مطلوب');

  const doctor = payload.doctor;
  const counterRef = doc(db, 'queueCounters', queueStateId(doctor.id, dateKey));
  const stateRef = doc(db, 'queueStates', queueStateId(doctor.id, dateKey));
  const bookingRef = doc(col.bookings);

  let bookingCode = '';
  let queueNumber = 0;

  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    queueNumber = Number(counterSnap.data()?.lastNumber || 0) + 1;
    bookingCode = generateBookingCode(queueNumber);
    const ticketRef = doc(db, 'patientTickets', bookingCode);
    const phoneRef = doc(db, 'publicPhoneLookups', phone);

    const shared = {
      bookingId: bookingRef.id,
      bookingCode,
      patientName: payload.patientName.trim(),
      patientFirstName: firstName(payload.patientName),
      phoneLast4: phone.slice(-4),
      doctorId: doctor.id,
      doctorName: doctor.name,
      room: doctor.room,
      visitType: payload.visitType,
      queueNumber,
      dateKey,
      status: 'waiting' as BookingStatus,
      priority: Number(payload.priority || 0),
      updatedAt: serverTimestamp()
    };

    tx.set(counterRef, {
      doctorId: doctor.id,
      dateKey,
      lastNumber: queueNumber,
      updatedAt: serverTimestamp()
    }, { merge: true });

    tx.set(stateRef, {
      doctorId: doctor.id,
      doctorName: doctor.name,
      room: doctor.room,
      dateKey,
      currentNumber: 0,
      currentPatientName: '',
      currentBookingCode: '',
      currentStatus: 'waiting',
      lastNumber: queueNumber,
      updatedAt: serverTimestamp()
    }, { merge: true });

    tx.set(bookingRef, {
      ...shared,
      patientName: payload.patientName.trim(),
      phone,
      normalizedPhone: phone,
      notes: payload.notes || '',
      createdAt: serverTimestamp(),
      calledAt: null,
      enteredAt: null,
      finishedAt: null,
      statusUpdatedAt: serverTimestamp()
    });

    tx.set(ticketRef, shared);
    tx.set(phoneRef, { phoneKey: phone, codes: arrayUnion(bookingCode), updatedAt: serverTimestamp() }, { merge: true });
  });

  await logAction({ action: 'create_booking', bookingId: bookingRef.id, bookingCode, patientName: payload.patientName, doctorId: doctor.id, doctorName: doctor.name });
  return { bookingId: bookingRef.id, bookingCode, queueNumber };
}

export async function updateBookingStatus(booking: Booking, status: BookingStatus, note?: string) {
  const batch = writeBatch(db);
  const bookingRef = doc(db, 'bookings', booking.id);
  const ticketRef = doc(db, 'patientTickets', booking.bookingCode);
  const stateRef = doc(db, 'queueStates', queueStateId(booking.doctorId, booking.dateKey));

  const statusData: Record<string, unknown> = {
    status,
    statusUpdatedAt: serverTimestamp()
  };
  if (status === 'called') statusData.calledAt = serverTimestamp();
  if (status === 'in_progress') statusData.enteredAt = serverTimestamp();
  if (status === 'finished') statusData.finishedAt = serverTimestamp();

  batch.update(bookingRef, statusData);
  batch.set(ticketRef, { status, updatedAt: serverTimestamp() }, { merge: true });

  if (['called', 'in_progress'].includes(status)) {
    batch.set(stateRef, {
      doctorId: booking.doctorId,
      doctorName: booking.doctorName,
      room: booking.room,
      dateKey: booking.dateKey,
      currentNumber: booking.queueNumber,
      currentPatientName: booking.patientName,
      currentBookingCode: booking.bookingCode,
      currentStatus: status,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  if (status === 'finished') {
    batch.set(stateRef, {
      currentStatus: 'finished',
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  await batch.commit();
  await logAction({ action: `status_${status}`, bookingId: booking.id, bookingCode: booking.bookingCode, patientName: booking.patientName, doctorId: booking.doctorId, doctorName: booking.doctorName, note });
}

export async function callNext(doctorId: string, dateKey: string) {
  const waitingSnap = await getDocs(query(col.bookings, where('doctorId', '==', doctorId), where('dateKey', '==', dateKey), where('status', '==', 'waiting'), orderBy('queueNumber'), limit(1)));
  const targetDoc = waitingSnap.docs[0];
  if (!targetDoc) throw new Error('لا يوجد مرضى في الانتظار لهذا الطبيب');
  const booking = withId<Booking>(targetDoc);
  await updateBookingStatus(booking, 'called');
  return booking;
}

export async function returnToWaiting(booking: Booking) {
  await updateBookingStatus(booking, 'waiting', 'إرجاع إلى الانتظار');
}

export async function logAction(payload: Record<string, unknown>) {
  await addDoc(col.logs, { ...payload, createdAt: serverTimestamp() });
}

export async function lookupTicketByCode(code: string) {
  const clean = code.trim().toUpperCase();
  const snap = await getDoc(doc(db, 'patientTickets', clean));
  return snap.exists() ? withId<PatientTicket>(snap) : null;
}

export async function lookupCodesByPhone(phone: string) {
  const clean = normalizePhone(phone);
  const snap = await getDoc(doc(db, 'publicPhoneLookups', clean));
  return snap.exists() ? (snap.data().codes || []) as string[] : [];
}

export function subscribeTicket(code: string, cb: (ticket: PatientTicket | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'patientTickets', code.trim().toUpperCase()), (snap) => cb(snap.exists() ? withId<PatientTicket>(snap) : null));
}

export async function seedDemoData() {
  const doctorsSnap = await getDocs(query(col.doctors, limit(1)));
  if (!doctorsSnap.empty) return;
  await saveDoctor({ name: 'د. أحمد محمد', specialty: 'باطنة', room: 'غرفة 1', averageVisitMinutes: 10, isActive: true });
  await saveDoctor({ name: 'د. سارة علي', specialty: 'أطفال', room: 'غرفة 2', averageVisitMinutes: 8, isActive: true });
}
