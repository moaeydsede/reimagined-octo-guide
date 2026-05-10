import { httpsCallable } from 'firebase/functions';
import { CheckCircle2, Clock3, PlayCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell, EmptyState } from '../components/Layout';
import { functions } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { useDoctors, useQueue, useTodayBookings } from '../hooks/useClinicData';
import type { BookingStatus } from '../types';
import { statusArabic, statusClass } from '../utils';

const callNext = httpsCallable(functions, 'callNext');
const updateBookingStatus = httpsCallable(functions, 'updateBookingStatus');

export function DoctorPage() {
  const { profile, isAdmin } = useAuth();
  const { doctors } = useDoctors();
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const doctorId = profile?.assignedDoctorId || selectedDoctorId || doctors[0]?.id || '';
  const { bookings } = useTodayBookings(doctorId || undefined);
  const queue = useQueue(doctorId || undefined);
  const [busy, setBusy] = useState(false);
  const doctor = doctors.find((d) => d.id === doctorId);
  const current = useMemo(() => bookings.find((b) => b.status === 'called' || b.status === 'in_progress'), [bookings]);
  const upcoming = bookings.filter((b) => b.status === 'waiting' || b.status === 'postponed').slice(0, 8);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  return (
    <AppShell title={`لوحة الطبيب ${doctor?.name ? `- ${doctor.name}` : ''}`} subtitle="متابعة المريض الحالي والقادمين في الدور">
      {isAdmin && !profile?.assignedDoctorId && (
        <div className="panel mini-toolbar">
          <label>اختر الطبيب<select value={doctorId} onChange={(e) => setSelectedDoctorId(e.target.value)}>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        </div>
      )}
      <section className="doctor-hero panel">
        <div>
          <span className="section-label">المريض الحالي</span>
          <h2>{current ? current.patientName : 'لا يوجد مريض حالي'}</h2>
          <p>الدور الحالي: <strong>{current?.queueNumber || queue?.currentNumber || '-'}</strong></p>
          {current && <span className={statusClass[current.status as BookingStatus]}>{statusArabic[current.status as BookingStatus]}</span>}
        </div>
        <div className="doctor-actions">
          <button className="success-button" disabled={!doctorId || busy} onClick={() => run(() => callNext({ doctorId }))}>طلب التالي</button>
          <button className="primary-button" disabled={!current || busy} onClick={() => run(() => updateBookingStatus({ bookingId: current?.id, status: 'in_progress' }))}><PlayCircle size={17} /> بدأ الكشف</button>
          <button className="danger-button" disabled={!current || busy} onClick={() => run(() => updateBookingStatus({ bookingId: current?.id, status: 'finished' }))}><CheckCircle2 size={17} /> إنهاء الكشف</button>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header"><h2>القادمون</h2><p><Clock3 size={15} /> القائمة تتحدث تلقائيًا</p></div>
        {!upcoming.length ? <EmptyState title="لا يوجد مرضى منتظرون" body="عند إضافة حجوزات جديدة ستظهر هنا تلقائيًا." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>الدور</th><th>المريض</th><th>الحالة</th><th>الوقت المتوقع</th></tr></thead>
              <tbody>{upcoming.map((b, i) => (
                <tr key={b.id}><td><strong className="queue-number">{b.queueNumber}</strong></td><td>{b.patientName}</td><td><span className={statusClass[b.status]}>{statusArabic[b.status]}</span></td><td>~ {(i + 1) * (doctor?.averageVisitMinutes || 10)} دقيقة</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
