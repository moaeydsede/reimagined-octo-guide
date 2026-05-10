const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const ADMIN_UID = 'a2uvKrLDoNVPOafbOOM8BlErxek1';
const REGION = 'us-central1';

function todayCairo() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

function normalizePhone(input = '') {
  return String(input).replace(/[^0-9+]/g, '').trim();
}

function phoneKey(phone) {
  return normalizePhone(phone).replace(/[^0-9]/g, '') || `phone_${Date.now()}`;
}

function bookingCode(queueNumber) {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `A${queueNumber}${random}`;
}

async function getUserRole(uid) {
  if (!uid) return null;
  if (uid === ADMIN_UID) return 'admin';
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? snap.data().role : null;
}

async function requireStaff(request, allowed = ['admin', 'reception', 'doctor']) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول.');
  const role = await getUserRole(uid);
  if (!role || !allowed.includes(role)) throw new HttpsError('permission-denied', 'ليس لديك صلاحية لهذا الإجراء.');
  return { uid, role };
}

async function updatePublicStatus(bookingId) {
  const bookingRef = db.collection('bookings').doc(bookingId);
  const bookingSnap = await bookingRef.get();
  if (!bookingSnap.exists) return null;
  const booking = { id: bookingSnap.id, ...bookingSnap.data() };
  const queueId = `${booking.servingDate}_${booking.doctorId}`;
  const queueSnap = await db.collection('queues').doc(queueId).get();
  const queue = queueSnap.exists ? queueSnap.data() : { currentNumber: 0 };

  const remainingSnap = await db.collection('bookings')
    .where('servingDate', '==', booking.servingDate)
    .where('doctorId', '==', booking.doctorId)
    .where('status', 'in', ['waiting', 'postponed'])
    .where('sortNumber', '<', booking.sortNumber)
    .get();

  const estimatedMinutes = Math.max(0, remainingSnap.size * Number(booking.averageVisitMinutes || 10));
  const publicStatus = {
    bookingId,
    patientName: booking.patientName,
    doctorName: booking.doctorName,
    queueNumber: booking.queueNumber,
    currentNumber: queue.currentNumber || 0,
    remaining: remainingSnap.size,
    status: booking.status,
    bookingCode: booking.bookingCode,
    servingDate: booking.servingDate,
    estimatedMinutes,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('publicStatus').doc(bookingId).set(publicStatus, { merge: true });
  return publicStatus;
}

async function updatePublicQueue(doctorId, servingDate) {
  const queueId = `${servingDate}_${doctorId}`;
  const queueSnap = await db.collection('queues').doc(queueId).get();
  const doctorSnap = await db.collection('doctors').doc(doctorId).get();
  if (!queueSnap.exists && !doctorSnap.exists) return;
  const queue = queueSnap.exists ? queueSnap.data() : {};
  const doctor = doctorSnap.exists ? doctorSnap.data() : { name: 'الطبيب' };
  let currentPatientName = '';
  if (queue.activeBookingId) {
    const activeSnap = await db.collection('bookings').doc(queue.activeBookingId).get();
    if (activeSnap.exists) currentPatientName = activeSnap.data().patientName || '';
  }
  const upcomingSnap = await db.collection('bookings')
    .where('servingDate', '==', servingDate)
    .where('doctorId', '==', doctorId)
    .where('status', 'in', ['waiting', 'postponed'])
    .orderBy('sortNumber', 'asc')
    .limit(8)
    .get();
  const upcomingNumbers = upcomingSnap.docs.map((d) => d.data().queueNumber);
  await db.collection('publicQueues').doc(queueId).set({
    doctorId,
    doctorName: queue.doctorName || doctor.name,
    currentNumber: queue.currentNumber || 0,
    currentPatientName,
    upcomingNumbers,
    servingDate,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

exports.createBooking = onCall({ region: REGION }, async (request) => {
  await requireStaff(request, ['admin', 'reception']);
  const data = request.data || {};
  const patientName = String(data.patientName || '').trim();
  const phone = normalizePhone(data.phone || '');
  const doctorId = String(data.doctorId || '').trim();
  const visitType = String(data.visitType || 'كشف').trim();
  const notes = String(data.notes || '').trim();
  if (!patientName || !phone || !doctorId) throw new HttpsError('invalid-argument', 'اسم المريض ورقم الهاتف والطبيب مطلوبة.');

  const servingDate = data.servingDate || todayCairo();
  const doctorRef = db.collection('doctors').doc(doctorId);
  const queueRef = db.collection('queues').doc(`${servingDate}_${doctorId}`);
  const bookingRef = db.collection('bookings').doc();
  const patientRef = db.collection('patients').doc(phoneKey(phone));

  const result = await db.runTransaction(async (tx) => {
    const doctorSnap = await tx.get(doctorRef);
    if (!doctorSnap.exists) throw new HttpsError('not-found', 'الطبيب غير موجود.');
    const doctor = doctorSnap.data();
    const queueSnap = await tx.get(queueRef);
    const lastNumber = (queueSnap.exists ? Number(queueSnap.data().lastNumber || 0) : 0) + 1;
    const code = bookingCode(lastNumber);
    const booking = {
      patientName,
      phone,
      phoneKey: phoneKey(phone),
      doctorId,
      doctorName: doctor.name,
      averageVisitMinutes: Number(doctor.averageVisitMinutes || 10),
      visitType,
      notes,
      queueNumber: lastNumber,
      sortNumber: lastNumber,
      bookingCode: code,
      status: 'waiting',
      servingDate,
      createdBy: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    tx.set(patientRef, { name: patientName, phone, phoneKey: phoneKey(phone), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    tx.set(queueRef, {
      doctorId,
      doctorName: doctor.name,
      servingDate,
      lastNumber,
      currentNumber: queueSnap.exists ? Number(queueSnap.data().currentNumber || 0) : 0,
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    tx.set(bookingRef, booking);
    tx.set(db.collection('activityLogs').doc(), {
      bookingId: bookingRef.id,
      action: 'created',
      doneBy: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { bookingId: bookingRef.id, ...booking };
  });

  await updatePublicStatus(result.bookingId);
  await updatePublicQueue(doctorId, servingDate);
  return { ok: true, booking: result };
});

exports.callNext = onCall({ region: REGION }, async (request) => {
  await requireStaff(request, ['admin', 'reception', 'doctor']);
  const doctorId = String(request.data?.doctorId || '').trim();
  const servingDate = request.data?.servingDate || todayCairo();
  if (!doctorId) throw new HttpsError('invalid-argument', 'doctorId مطلوب.');

  const nextSnap = await db.collection('bookings')
    .where('servingDate', '==', servingDate)
    .where('doctorId', '==', doctorId)
    .where('status', 'in', ['waiting', 'postponed'])
    .orderBy('sortNumber', 'asc')
    .limit(1)
    .get();

  if (nextSnap.empty) throw new HttpsError('not-found', 'لا يوجد مرضى منتظرون.');
  const nextDoc = nextSnap.docs[0];
  const booking = nextDoc.data();
  const queueRef = db.collection('queues').doc(`${servingDate}_${doctorId}`);

  await db.runTransaction(async (tx) => {
    tx.update(nextDoc.ref, {
      status: 'called',
      calledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    tx.set(queueRef, {
      doctorId,
      doctorName: booking.doctorName,
      servingDate,
      currentNumber: booking.queueNumber,
      activeBookingId: nextDoc.id,
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    tx.set(db.collection('activityLogs').doc(), {
      bookingId: nextDoc.id,
      action: 'called',
      doneBy: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  await updatePublicStatus(nextDoc.id);
  await updatePublicQueue(doctorId, servingDate);
  return { ok: true, bookingId: nextDoc.id };
});

exports.updateBookingStatus = onCall({ region: REGION }, async (request) => {
  await requireStaff(request, ['admin', 'reception', 'doctor']);
  const bookingId = String(request.data?.bookingId || '').trim();
  const status = String(request.data?.status || '').trim();
  if (!bookingId || !status) throw new HttpsError('invalid-argument', 'bookingId و status مطلوبان.');

  const bookingRef = db.collection('bookings').doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'الحجز غير موجود.');
  const booking = snap.data();
  const queueRef = db.collection('queues').doc(`${booking.servingDate}_${booking.doctorId}`);
  const queueSnap = await queueRef.get();
  const queue = queueSnap.exists ? queueSnap.data() : {};

  const update = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  let action = status;
  if (status === 'return_waiting') {
    update.status = 'waiting';
    update.sortNumber = Number(queue.currentNumber || booking.queueNumber) + 0.25;
    action = 'returned_to_waiting';
  } else if (status === 'postponed') {
    update.status = 'postponed';
    update.postponedAt = admin.firestore.FieldValue.serverTimestamp();
    update.sortNumber = Number(queue.currentNumber || booking.queueNumber) + Number(request.data?.after || 3) + 0.5;
  } else {
    update.status = status;
    if (status === 'in_progress') update.enteredAt = admin.firestore.FieldValue.serverTimestamp();
    if (status === 'finished') update.finishedAt = admin.firestore.FieldValue.serverTimestamp();
    if (status === 'skipped') update.skippedAt = admin.firestore.FieldValue.serverTimestamp();
    if (status === 'called') update.calledAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await bookingRef.update(update);
  await db.collection('activityLogs').add({
    bookingId,
    action,
    doneBy: request.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  if (queue.activeBookingId === bookingId && ['finished', 'skipped', 'postponed', 'cancelled', 'no_show', 'return_waiting'].includes(status)) {
    await queueRef.set({ activeBookingId: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  await updatePublicStatus(bookingId);
  await updatePublicQueue(booking.doctorId, booking.servingDate);
  return { ok: true };
});

exports.lookupBooking = onCall({ region: REGION }, async (request) => {
  const search = String(request.data?.search || '').trim();
  if (!search) throw new HttpsError('invalid-argument', 'أدخل رقم الهاتف أو كود الحجز.');
  const servingDate = request.data?.servingDate || todayCairo();
  const normalized = normalizePhone(search);
  let snap;

  if (/^A/i.test(search)) {
    snap = await db.collection('bookings')
      .where('servingDate', '==', servingDate)
      .where('bookingCode', '==', search.toUpperCase())
      .limit(1)
      .get();
  } else {
    snap = await db.collection('bookings')
      .where('servingDate', '==', servingDate)
      .where('phone', '==', normalized)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
  }

  if (!snap || snap.empty) throw new HttpsError('not-found', 'لم يتم العثور على الحجز.');
  const bookingId = snap.docs[0].id;
  const status = await updatePublicStatus(bookingId);
  return { bookingId, status };
});
