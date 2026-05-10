import { CalendarClock, ClipboardCopy, Clock3, Hash, Loader2, Search, ShieldCheck, Smartphone, Stethoscope, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router-dom';
import { MiniMetric, StatusBadge } from '../components/Cards';
import { PublicHeader } from '../components/Shell';
import { useQueueState } from '../hooks/useClinic';
import { lookupCodesByPhone, lookupTicketByCode, subscribeTicket } from '../services/clinic';
import type { PatientTicket } from '../types';
import { absoluteAppUrl, estimateMinutes, estimateRemaining, normalizePhone, safeError, todayKey } from '../utils';

export function PatientPage() {
  const [input, setInput] = useState('');
  const [ticket, setTicket] = useState<PatientTicket | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [activeCode, setActiveCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const queueState = useQueueState(ticket?.doctorId || '', ticket?.dateKey || todayKey());
  const remaining = useMemo(() => ticket ? estimateRemaining(ticket, queueState) : 0, [ticket, queueState]);
  const minutes = useMemo(() => estimateMinutes(remaining, 10), [remaining]);

  useEffect(() => {
    if (!activeCode) return undefined;
    return subscribeTicket(activeCode, setTicket);
  }, [activeCode]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setTicket(null); setCodes([]); setActiveCode('');
    try {
      const raw = input.trim();
      const phone = normalizePhone(raw);
      if (raw.toUpperCase().startsWith('Q')) {
        const found = await lookupTicketByCode(raw);
        if (!found) throw new Error('لم يتم العثور على الحجز بهذا الكود');
        setActiveCode(found.bookingCode);
      } else if (phone.length >= 7) {
        const resultCodes = await lookupCodesByPhone(phone);
        if (!resultCodes.length) throw new Error('لا يوجد حجز نشط بهذا الرقم');
        setCodes(resultCodes.slice(-5).reverse());
        setActiveCode(resultCodes[resultCodes.length - 1]);
      } else {
        throw new Error('اكتب رقم هاتف صحيح أو كود الحجز');
      }
    } catch (err) { setError(safeError(err)); }
    finally { setBusy(false); }
  }

  return (
    <div className="public-shell patient-bg">
      <PublicHeader />
      <main className="patient-page">
        <section className="glass-card patient-card">
          <div className="patient-illustration"><Smartphone /><ShieldCheck /></div>
          <h1>متابعة الدور</h1>
          <p>أدخل رقم الهاتف المسجل في الحجز أو كود الحجز لمعرفة رقم دورك والرقم الحالي.</p>
          <form className="patient-search" onSubmit={submit}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="رقم الهاتف أو كود الحجز Q24-ABCD" />
            <button className="primary-button" disabled={busy}>{busy ? <Loader2 className="spin" /> : <Search size={18} />} عرض دوري</button>
          </form>
          {error && <div className="alert danger">{error}</div>}
          {codes.length > 1 && <div className="code-picker"><span>اختر الحجز:</span>{codes.map((c) => <button key={c} onClick={() => setActiveCode(c)} className={activeCode === c ? 'active' : ''}>{c}</button>)}</div>}
        </section>

        {ticket && <section className="glass-card status-card">
          <h2>مرحبًا {ticket.patientFirstName}</h2>
          <p className="doctor-name"><Stethoscope size={16} /> {ticket.doctorName} · {ticket.room}</p>
          <div className="status-grid">
            <MiniMetric label="رقم دورك" value={ticket.queueNumber} icon={<Hash />} />
            <MiniMetric label="الدور الحالي" value={queueState?.currentNumber || 0} icon={<CalendarClock />} />
            <MiniMetric label="المتبقي أمامك" value={`${remaining} مريض`} icon={<UsersRound />} />
            <MiniMetric label="الحالة" value={<StatusBadge status={ticket.status} />} icon={<Clock3 />} />
          </div>
          <div className="estimate">الوقت المتوقع: <strong>{minutes === 0 ? 'دورك قريب الآن' : `حوالي ${minutes} دقيقة`}</strong></div>
          {ticket.status === 'called' && <div className="alert success">تم نداء دورك الآن، برجاء التوجه إلى غرفة الكشف.</div>}
          {ticket.status === 'skipped' && <div className="alert warning">تم تخطي دورك مؤقتًا لعدم التواجد، برجاء التواصل مع الاستقبال.</div>}
          {ticket.status === 'postponed' && <div className="alert warning">تم تأجيل دورك مؤقتًا، سيتم نداؤك لاحقًا.</div>}
          <div className="ticket-actions">
            <button className="muted-button" onClick={() => navigator.clipboard?.writeText(ticket.bookingCode)}><ClipboardCopy size={16} /> نسخ كود الحجز</button>
            <button className="muted-button" onClick={() => navigator.clipboard?.writeText(absoluteAppUrl('/patient'))}>نسخ رابط المتابعة</button>
          </div>
        </section>}
        <p className="privacy-note">حماية الخصوصية: الرابط يعرض بيانات متابعة الدور فقط ولا يعرض الملف الطبي.</p>
        <NavLink className="text-link" to="/login">دخول الإدارة أو الطبيب</NavLink>
      </main>
    </div>
  );
}
