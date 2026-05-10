import { CheckCircle2, Clock3, PlayCircle, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { EmptyState, Section, StatCard, StatusBadge } from '../components/Cards';
import { AppShell } from '../components/Shell';
import { useBookings, useDoctors, useQueueState, useStats } from '../hooks/useClinic';
import { callNext, updateBookingStatus } from '../services/clinic';
import { safeError, todayKey } from '../utils';

export function DoctorPage() {
  const date = todayKey();
  const { activeDoctors } = useDoctors();
  const [doctorId, setDoctorId] = useState('');
  const selectedDoctor = activeDoctors.find((d) => d.id === (doctorId || activeDoctors[0]?.id));
  const { bookings } = useBookings(date, selectedDoctor?.id || null);
  const state = useQueueState(selectedDoctor?.id || '', date);
  const stats = useStats(bookings);
  const [error, setError] = useState('');
  const current = bookings.find((b) => ['called', 'in_progress'].includes(b.status)) || bookings.find((b) => b.bookingCode === state?.currentBookingCode);
  const upcoming = bookings.filter((b) => ['waiting', 'postponed'].includes(b.status)).slice(0, 8);

  async function run(fn: () => Promise<unknown>) {
    setError('');
    try { await fn(); }
    catch (err) { setError(safeError(err)); }
  }

  return (
    <AppShell title="لوحة الطبيب" subtitle="واجهة مبسطة للطبيب لمتابعة المريض الحالي والقادمين">
      <div className="stats-grid compact-stats">
        <StatCard label="المتبقي" value={stats.waiting + stats.postponed} hint="في الدور" icon={<Clock3 />} />
        <StatCard label="الحالي" value={state?.currentNumber || '-'} hint={state?.currentPatientName || 'لا يوجد'} icon={<Stethoscope />} />
        <StatCard label="تم الكشف" value={stats.finished} hint="اليوم" icon={<CheckCircle2 />} />
      </div>
      <Section title="المريض الحالي" subtitle="اضغط بدأ الكشف عند دخول المريض، ثم إنهاء بعد الكشف." action={<select value={selectedDoctor?.id || ''} onChange={(e) => setDoctorId(e.target.value)}>{activeDoctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>}>
        {error && <div className="alert warning">{error}</div>}
        {!selectedDoctor ? <EmptyState title="لا يوجد طبيب" body="أضف طبيب من لوحة الإدارة أولًا." /> : <div className="doctor-current">
          <div className="current-number">{current?.queueNumber || state?.currentNumber || '-'}</div>
          <div><h2>{current?.patientName || state?.currentPatientName || 'لا يوجد مريض حالي'}</h2><p>{selectedDoctor.name} · {selectedDoctor.room}</p>{current && <StatusBadge status={current.status} />}</div>
          <div className="doctor-actions">
            <button className="primary-button" onClick={() => selectedDoctor && run(() => callNext(selectedDoctor.id, date))}><PlayCircle size={18} /> طلب التالي</button>
            <button className="success-button" disabled={!current} onClick={() => current && run(() => updateBookingStatus(current, 'in_progress'))}>بدأ الكشف</button>
            <button className="danger-button" disabled={!current} onClick={() => current && run(() => updateBookingStatus(current, 'finished'))}>إنهاء الكشف</button>
          </div>
        </div>}
      </Section>
      <Section title="القادمون" subtitle="قائمة مختصرة للحالات المنتظرة والمؤجلة.">
        {!upcoming.length ? <EmptyState title="لا يوجد قادمون" body="لا يوجد مرضى في الانتظار حاليًا." /> : <div className="table-wrap"><table><thead><tr><th>الدور</th><th>المريض</th><th>النوع</th><th>الحالة</th><th>الوقت المتوقع</th></tr></thead><tbody>{upcoming.map((b, i) => <tr key={b.id}><td><strong className="queue-number">{b.queueNumber}</strong></td><td>{b.patientName}</td><td>{b.visitType}</td><td><StatusBadge status={b.status} /></td><td>{(i + 1) * (selectedDoctor?.averageVisitMinutes || 10)} دقيقة</td></tr>)}</tbody></table></div>}
      </Section>
    </AppShell>
  );
}
