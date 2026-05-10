import { httpsCallable } from 'firebase/functions';
import { Activity, CalendarCheck, Clock3, Forward, PhoneCall, RotateCcw, Stethoscope, UserPlus, Users } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { AppShell, EmptyState, StatCard } from '../components/Layout';
import { functions } from '../firebase/config';
import { useDoctors, useStats, useTodayBookings } from '../hooks/useClinicData';
import type { BookingStatus } from '../types';
import { maskPhone, statusArabic, statusClass } from '../utils';

const createBooking = httpsCallable(functions, 'createBooking');
const callNext = httpsCallable(functions, 'callNext');
const updateBookingStatus = httpsCallable(functions, 'updateBookingStatus');

export function AdminPage() {
  const { doctors } = useDoctors();
  const [doctorId, setDoctorId] = useState('');
  const activeDoctorId = doctorId || doctors[0]?.id || '';
  const { bookings, date } = useTodayBookings(activeDoctorId || undefined);
  const stats = useStats(bookings);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState('');

  const current = useMemo(() => bookings.find((b) => b.status === 'called' || b.status === 'in_progress'), [bookings]);

  async function action(name: string, fn: () => Promise<unknown>) {
    setBusy(name);
    try { await fn(); } finally { setBusy(''); }
  }

  return (
    <AppShell title="لوحة الإدارة - الاستقبال" subtitle={`حجوزات اليوم ${date}`}>
      <div className="stats-grid">
        <StatCard label="حجوزات اليوم" value={stats.total} hint="إجمالي الحجوزات" icon={<CalendarCheck />} />
        <StatCard label="المنتظرين" value={stats.waiting} hint="في قائمة الانتظار" icon={<Users />} />
        <StatCard label="تم الكشف" value={stats.finished} hint="اليوم" icon={<Stethoscope />} />
        <StatCard label="تم التخطي" value={stats.skipped} hint="مريض" icon={<Forward />} />
        <StatCard label="الحالي" value={current?.queueNumber || '-'} hint={current?.patientName || 'لا يوجد'} icon={<Activity />} />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>إدارة الدور</h2>
            <p>اختر الطبيب ثم قم بنداء المريض التالي أو إدارة الحالات.</p>
          </div>
          <div className="toolbar">
            <select value={activeDoctorId} onChange={(e) => setDoctorId(e.target.value)}>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button className="primary-button" onClick={() => setFormOpen(true)}><UserPlus size={17} /> حجز جديد</button>
          </div>
        </div>
        <div className="queue-actions">
          <button className="success-button" disabled={!activeDoctorId || busy === 'next'} onClick={() => action('next', () => callNext({ doctorId: activeDoctorId }))}>نداء التالي</button>
          <button className="muted-button" onClick={() => window.location.reload()}>تحديث</button>
        </div>
        <BookingsTable bookings={bookings} onAction={(bookingId, status) => action(`${bookingId}-${status}`, () => updateBookingStatus({ bookingId, status }))} />
      </section>

      {formOpen && <BookingModal doctors={doctors} defaultDoctorId={activeDoctorId} onClose={() => setFormOpen(false)} onSave={async (payload) => { await createBooking(payload); setFormOpen(false); }} />}
    </AppShell>
  );
}

function BookingsTable({ bookings, onAction }: { bookings: any[]; onAction: (id: string, status: BookingStatus | 'return_waiting') => void }) {
  if (!bookings.length) return <EmptyState title="لا توجد حجوزات" body="ابدأ بإضافة حجز جديد أو تأكد من اختيار الطبيب الصحيح." />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>الدور</th><th>اسم المريض</th><th>الهاتف</th><th>الطبيب</th><th>النوع</th><th>الحالة</th><th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td><strong className="queue-number">{b.queueNumber}</strong></td>
              <td>{b.patientName}</td>
              <td>{maskPhone(b.phone)}</td>
              <td>{b.doctorName}</td>
              <td>{b.visitType}</td>
              <td><span className={statusClass[b.status as BookingStatus]}>{statusArabic[b.status as BookingStatus]}</span></td>
              <td className="actions-cell">
                <button onClick={() => onAction(b.id, 'in_progress')}>دخل الكشف</button>
                <button onClick={() => onAction(b.id, 'finished')}>تم الكشف</button>
                <button onClick={() => onAction(b.id, 'skipped')}>تخطي</button>
                <button onClick={() => onAction(b.id, 'postponed')}>تأجيل</button>
                <button onClick={() => onAction(b.id, 'return_waiting')}>إرجاع</button>
                <a href={`https://wa.me/${String(b.phone).replace(/[^0-9]/g, '')}`} target="_blank"><PhoneCall size={15} /></a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingModal({ doctors, defaultDoctorId, onClose, onSave }: { doctors: any[]; defaultDoctorId: string; onClose: () => void; onSave: (payload: any) => Promise<void> }) {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [doctorId, setDoctorId] = useState(defaultDoctorId);
  const [visitType, setVisitType] = useState('كشف');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ patientName, phone, doctorId, doctorName: selectedDoctor?.name || '', visitType, notes });
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <div className="panel-header"><h2>إضافة حجز جديد</h2><button type="button" className="icon-button" onClick={onClose}>×</button></div>
        <div className="form-grid">
          <label>اسم المريض<input value={patientName} onChange={(e) => setPatientName(e.target.value)} required /></label>
          <label>رقم الهاتف<input value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
          <label>الطبيب<select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
          <label>نوع الزيارة<select value={visitType} onChange={(e) => setVisitType(e.target.value)}><option>كشف</option><option>استشارة</option><option>متابعة</option><option>طوارئ</option></select></label>
          <label className="full">ملاحظات<textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        </div>
        <button className="primary-button" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ وإنشاء رقم دور'}</button>
      </form>
    </div>
  );
}
