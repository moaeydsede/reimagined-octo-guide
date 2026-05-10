import { Activity, CalendarCheck, ClipboardCopy, Clock3, Loader2, MessageCircle, PauseCircle, PhoneCall, Plus, RotateCcw, Search, SkipForward, Stethoscope, UserPlus, UsersRound } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { StatCard, StatusBadge, EmptyState, Section } from '../components/Cards';
import { Modal } from '../components/Modal';
import { AppShell } from '../components/Shell';
import { useBookings, useDoctors, useQueueState, useStats } from '../hooks/useClinic';
import { callNext, createBooking, returnToWaiting, seedDemoData, updateBookingStatus } from '../services/clinic';
import type { Booking, Doctor, VisitType } from '../types';
import { absoluteAppUrl, maskPhone, safeError, todayKey } from '../utils';

export function AdminPage() {
  const [date, setDate] = useState(todayKey());
  const { activeDoctors, loading: doctorsLoading } = useDoctors();
  const [doctorId, setDoctorId] = useState('');
  const selectedDoctor = activeDoctors.find((d) => d.id === (doctorId || activeDoctors[0]?.id));
  const activeDoctorId = selectedDoctor?.id || '';
  const { bookings } = useBookings(date, activeDoctorId || null);
  const queueState = useQueueState(activeDoctorId, date);
  const stats = useStats(bookings);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => bookings.filter((b) => {
    const matchesSearch = !search || `${b.patientName} ${b.phone} ${b.bookingCode} ${b.queueNumber}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [bookings, search, statusFilter]);

  async function run(name: string, fn: () => Promise<unknown>) {
    setBusy(name);
    setMessage('');
    try { await fn(); }
    catch (err) { setMessage(safeError(err)); }
    finally { setBusy(''); }
  }

  return (
    <AppShell title="لوحة الإدارة والاستقبال" subtitle="إدارة الحجوزات والدور والتخطي والتأجيل بتحديث لحظي">
      <div className="stats-grid">
        <StatCard label="حجوزات اليوم" value={stats.total} hint="إجمالي" icon={<CalendarCheck />} />
        <StatCard label="المنتظرين" value={stats.waiting} hint="داخل الدور" icon={<UsersRound />} />
        <StatCard label="الحالي" value={queueState?.currentNumber || '-'} hint={queueState?.currentPatientName || 'لا يوجد'} icon={<Activity />} />
        <StatCard label="تم الكشف" value={stats.finished} hint="مكتمل" icon={<Stethoscope />} />
        <StatCard label="متوسط انتظار" value={`${Math.max(stats.waiting * (selectedDoctor?.averageVisitMinutes || 10), 0)} د`} hint="تقريبي" icon={<Clock3 />} />
      </div>

      <Section title="إدارة الدور" subtitle="اختر الطبيب ثم قم بنداء التالي أو تحكم بحالة كل مريض." action={
        <>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select value={activeDoctorId} onChange={(e) => setDoctorId(e.target.value)}>
            {activeDoctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button className="primary-button" onClick={() => setModal(true)} disabled={!activeDoctorId}><Plus size={17} /> حجز جديد</button>
        </>
      }>
        {doctorsLoading ? <div className="loading-inline"><Loader2 className="spin" /> تحميل الأطباء...</div> : !activeDoctors.length ? (
          <EmptyState title="لا يوجد أطباء" body="افتح صفحة الأطباء وأضف أول طبيب، أو اضغط إنشاء بيانات تجريبية." />
        ) : (
          <>
            <div className="queue-actions">
              <button className="success-button" disabled={!activeDoctorId || busy === 'next'} onClick={() => run('next', () => callNext(activeDoctorId, date))}>نداء التالي</button>
              <button className="muted-button" onClick={() => run('seed', seedDemoData)}>إنشاء بيانات تجريبية</button>
              <div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم / الهاتف / الكود / رقم الدور" /></div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">كل الحالات</option>
                <option value="waiting">منتظر</option>
                <option value="called">تم النداء</option>
                <option value="in_progress">داخل الكشف</option>
                <option value="finished">تم الكشف</option>
                <option value="skipped">تم التخطي</option>
                <option value="postponed">مؤجل</option>
              </select>
            </div>
            {message && <div className="alert warning">{message}</div>}
            <BookingsTable bookings={filtered} busy={busy} onAction={(name, fn) => run(name, fn)} />
          </>
        )}
      </Section>

      {modal && selectedDoctor && <BookingModal doctors={activeDoctors} defaultDoctorId={selectedDoctor.id} onClose={() => setModal(false)} onSaved={(result) => { setModal(false); setMessage(`تم إنشاء الحجز بنجاح - الدور ${result.queueNumber} - الكود ${result.bookingCode}`); }} />}
    </AppShell>
  );
}

function BookingsTable({ bookings, busy, onAction }: { bookings: Booking[]; busy: string; onAction: (name: string, fn: () => Promise<unknown>) => void }) {
  if (!bookings.length) return <EmptyState title="لا توجد حجوزات" body="أضف حجز جديد أو غيّر الفلاتر الحالية." />;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>الدور</th><th>المريض</th><th>الهاتف</th><th>الطبيب</th><th>النوع</th><th>الكود</th><th>الحالة</th><th>التحكم</th></tr></thead>
        <tbody>
          {bookings.map((b) => <tr key={b.id}>
            <td><strong className="queue-number">{b.queueNumber}</strong></td>
            <td><strong>{b.patientName}</strong><small className="row-sub">{b.room}</small></td>
            <td>{maskPhone(b.phone)}</td>
            <td>{b.doctorName}</td>
            <td>{b.visitType}</td>
            <td><button className="tiny-button" onClick={() => navigator.clipboard?.writeText(b.bookingCode)}><ClipboardCopy size={14} />{b.bookingCode}</button></td>
            <td><StatusBadge status={b.status} /></td>
            <td className="actions-cell">
              <button disabled={busy === `${b.id}-called`} onClick={() => onAction(`${b.id}-called`, () => updateBookingStatus(b, 'called'))}>نداء</button>
              <button disabled={busy === `${b.id}-in`} onClick={() => onAction(`${b.id}-in`, () => updateBookingStatus(b, 'in_progress'))}>دخل</button>
              <button disabled={busy === `${b.id}-done`} onClick={() => onAction(`${b.id}-done`, () => updateBookingStatus(b, 'finished'))}>تم</button>
              <button disabled={busy === `${b.id}-skip`} onClick={() => onAction(`${b.id}-skip`, () => updateBookingStatus(b, 'skipped'))}><SkipForward size={14} />تخطي</button>
              <button disabled={busy === `${b.id}-postpone`} onClick={() => onAction(`${b.id}-postpone`, () => updateBookingStatus(b, 'postponed'))}><PauseCircle size={14} />تأجيل</button>
              <button disabled={busy === `${b.id}-return`} onClick={() => onAction(`${b.id}-return`, () => returnToWaiting(b))}><RotateCcw size={14} />إرجاع</button>
              <a title="واتساب" href={`https://wa.me/${b.phone}?text=${encodeURIComponent(`مرحبًا ${b.patientName}، رقم دورك ${b.queueNumber} وكود الحجز ${b.bookingCode}. رابط المتابعة: ${absoluteAppUrl('/patient')}`)}`} target="_blank"><MessageCircle size={15} /></a>
              <a title="اتصال" href={`tel:${b.phone}`}><PhoneCall size={15} /></a>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}

function BookingModal({ doctors, defaultDoctorId, onClose, onSaved }: { doctors: Doctor[]; defaultDoctorId: string; onClose: () => void; onSaved: (result: { queueNumber: number; bookingCode: string }) => void }) {
  const [doctorId, setDoctorId] = useState(defaultDoctorId);
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitType, setVisitType] = useState<VisitType>('كشف');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const doctor = doctors.find((d) => d.id === doctorId) || doctors[0];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const result = await createBooking({ patientName, phone, doctor, visitType, notes, priority });
      onSaved(result);
    } catch (err) { setError(safeError(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="إضافة حجز جديد" onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <label>اسم المريض<input value={patientName} onChange={(e) => setPatientName(e.target.value)} required placeholder="مثال: محمد أحمد" /></label>
        <label>رقم الهاتف<input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="01000000000" /></label>
        <label>الطبيب<select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name} - {d.room}</option>)}</select></label>
        <label>نوع الزيارة<select value={visitType} onChange={(e) => setVisitType(e.target.value as VisitType)}><option>كشف</option><option>استشارة</option><option>متابعة</option><option>طوارئ</option><option>حجز أونلاين</option></select></label>
        <label>الأولوية<select value={priority} onChange={(e) => setPriority(Number(e.target.value))}><option value={0}>عادي</option><option value={1}>أولوية</option><option value={2}>طارئ</option></select></label>
        <label className="full">ملاحظات<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات داخلية فقط" /></label>
        {error && <div className="alert danger full">{error}</div>}
        <button className="primary-button full" disabled={saving}>{saving ? <Loader2 className="spin" /> : <UserPlus size={18} />} حفظ وإنشاء رقم دور</button>
      </form>
    </Modal>
  );
}
