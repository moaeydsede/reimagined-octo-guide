import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { BellRing, Clock, Hash, Loader2, Search, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { AppShell } from '../components/Layout';
import { db, functions } from '../firebase/config';
import type { PublicStatus } from '../types';
import { statusArabic, statusClass } from '../utils';

const lookupBooking = httpsCallable(functions, 'lookupBooking');

export function PatientPage() {
  const [searchValue, setSearchValue] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [status, setStatus] = useState<PublicStatus | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    const unsub = onSnapshot(doc(db, 'publicStatus', bookingId), (snap) => {
      if (snap.exists()) setStatus(snap.data() as PublicStatus);
    });
    return () => unsub();
  }, [bookingId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(''); setStatus(null); setBookingId(''); setLoading(true);
    try {
      const res = await lookupBooking({ search: searchValue });
      const data = res.data as { bookingId: string; status: PublicStatus };
      setBookingId(data.bookingId);
      setStatus(data.status);
    } catch (err) {
      setError('لم يتم العثور على حجز بهذا الرقم أو الكود. تأكد من البيانات أو تواصل مع الاستقبال.');
    } finally { setLoading(false); }
  }

  return (
    <AppShell title="متابعة الدور">
      <div className="patient-page">
        <section className="patient-card glass-card">
          <div className="patient-brand"><ShieldCheck size={28} /> Clinic Queue Pro</div>
          <h1>متابعة الدور</h1>
          <p>أدخل رقم الهاتف المسجل أو كود الحجز لمعرفة دورك الحالي.</p>
          <form onSubmit={submit} className="patient-search">
            <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="رقم الهاتف أو كود الحجز" required />
            <button className="primary-button" disabled={loading}>{loading ? <Loader2 className="spin" size={18} /> : <Search size={18} />} عرض دوري</button>
          </form>
          {error && <div className="alert danger">{error}</div>}
        </section>

        {status && (
          <section className="status-card glass-card">
            <h2>مرحبًا {status.patientName}</h2>
            <p className="doctor-name">{status.doctorName}</p>
            <div className="status-grid">
              <Metric icon={<Hash />} label="رقم دورك" value={status.queueNumber} />
              <Metric icon={<BellRing />} label="الدور الحالي" value={status.currentNumber || '-'} />
              <Metric icon={<Clock />} label="المتبقي أمامك" value={`${status.remaining} مرضى`} />
              <div className="metric"><span>الحالة</span><strong><span className={statusClass[status.status]}>{statusArabic[status.status]}</span></strong></div>
            </div>
            <div className="estimate">الوقت المتوقع: حوالي <strong>{status.estimatedMinutes}</strong> دقيقة</div>
            {status.status === 'called' && <div className="alert success">تم نداء دورك الآن، برجاء التوجه إلى غرفة الكشف.</div>}
            {status.status === 'skipped' && <div className="alert danger">تم تخطي دورك مؤقتًا لعدم التواجد، برجاء التواصل مع الاستقبال.</div>}
            {status.status === 'postponed' && <div className="alert warning">تم تأجيل دورك مؤقتًا، سيتم نداؤك لاحقًا.</div>}
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return <div className="metric">{icon}<span>{label}</span><strong>{value}</strong></div>;
}
