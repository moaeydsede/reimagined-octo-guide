import { Clock, Stethoscope } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../components/Cards';
import { useDoctors, usePublicTickets, useQueueState } from '../hooks/useClinic';
import { formatClock, todayKey } from '../utils';

export function DisplayPage() {
  const { activeDoctors } = useDoctors();
  const [doctorId, setDoctorId] = useState('all');
  const [clock, setClock] = useState(formatClock());
  useEffect(() => { const t = setInterval(() => setClock(formatClock()), 15000); return () => clearInterval(t); }, []);
  const shown = doctorId === 'all' ? activeDoctors : activeDoctors.filter((d) => d.id === doctorId);

  return (
    <main className="display-page">
      <header className="display-header">
        <div className="display-brand"><div className="brand-icon">+</div><div><strong>Clinic Queue Pro</strong><span>شاشة انتظار المرضى</span></div></div>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}><option value="all">كل الأطباء</option>{activeDoctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <div className="display-clock"><Clock /> {clock}</div>
      </header>
      <section className="display-grid">
        {shown.map((doctor) => <DisplayDoctorCard key={doctor.id} doctorId={doctor.id} />)}
      </section>
    </main>
  );
}

function DisplayDoctorCard({ doctorId }: { doctorId: string }) {
  const date = todayKey();
  const tickets = usePublicTickets(date, doctorId);
  const state = useQueueState(doctorId, date);
  const current = tickets.find((t) => t.bookingCode === state?.currentBookingCode) || tickets.find((t) => ['called', 'in_progress'].includes(t.status));
  const upcoming = useMemo(() => tickets.filter((t) => ['waiting', 'postponed'].includes(t.status)).slice(0, 5), [tickets]);
  const doctorName = state?.doctorName || tickets[0]?.doctorName || 'الطبيب';
  const room = state?.room || tickets[0]?.room || 'غرفة الكشف';
  return (
    <article className="display-card">
      <div className="display-doctor"><Stethoscope /><span>{doctorName}</span><small>{room}</small></div>
      <span>الدور الحالي</span>
      <strong className="display-number">{state?.currentNumber || current?.queueNumber || '-'}</strong>
      <h2>{current?.patientFirstName || state?.currentPatientName || 'لا يوجد نداء حالي'}</h2>
      {current && <StatusBadge status={current.status} />}
      <div className="next-row"><span>الأدوار القادمة</span><div>{upcoming.length ? upcoming.map((t) => <b key={t.id}>{t.queueNumber}</b>) : <em>لا يوجد</em>}</div></div>
    </article>
  );
}
