import { useState } from 'react'
import { Edit3, MessageCircle, Phone, RotateCcw, Send, SkipForward, TimerReset, Trash2, XCircle } from 'lucide-react'
import { shareWhatsApp } from '../lib/helpers'
import { useClinic } from '../store/ClinicContext'
import { statusLabels, statusTone, type Booking, type BookingStatus } from '../types'

function EditBookingModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { doctors, updateBooking } = useClinic()
  const [form, setForm] = useState({
    patientName: booking.patientName,
    phone: booking.phone,
    doctorId: booking.doctorId,
    visitType: booking.visitType,
    priority: booking.priority,
    status: booking.status,
    notes: booking.notes || ''
  })
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    updateBooking(booking.id, form)
    onClose()
  }
  return <div className="modal-backdrop" onClick={onClose}>
    <form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={submit}>
      <h2>تعديل الحجز</h2>
      <label>اسم المريض<input value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} /></label>
      <label>رقم الهاتف<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
      <label>الطبيب<select value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}>{doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.room} - {d.codePrefix}</option>)}</select></label>
      <label>نوع الزيارة<select value={form.visitType} onChange={e => setForm({ ...form, visitType: e.target.value })}><option>كشف</option><option>استشارة</option><option>متابعة</option><option>حالة عاجلة</option></select></label>
      <label>الحالة<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as BookingStatus })}>{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label>الأولوية<select value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })}><option value={0}>عادي</option><option value={1}>أولوية</option><option value={2}>عاجل</option></select></label>
      <label>ملاحظات<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
      <div className="modal-actions"><button type="button" className="ghost-btn" onClick={onClose}>إلغاء</button><button className="primary-btn">حفظ التعديل</button></div>
    </form>
  </div>
}

export default function BookingTable({ bookings }: { bookings: Booking[] }) {
  const { updateStatus, skip, postpone, returnToQueue, deleteBooking } = useClinic()
  const [editing, setEditing] = useState<Booking | null>(null)
  return <div className="table-card">
    <div className="table-head"><strong>قائمة الحجوزات</strong><span>{bookings.length} حجز</span></div>
    <div className="responsive-table">
      <table>
        <thead><tr><th>الكود</th><th>الدور</th><th>اسم المريض</th><th>الهاتف</th><th>الطبيب / الغرفة</th><th>النوع</th><th>الوقت</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
        <tbody>
        {bookings.length === 0 && <tr><td colSpan={9} className="empty-table">لا توجد حجوزات لهذا الطبيب حتى الآن</td></tr>}
        {bookings.map(b => <tr key={b.id}>
          <td><b className="code-pill">{b.code}</b></td>
          <td><b className="queue-no">{b.queueNumber}</b></td>
          <td>{b.patientName}<small>كود الطبيب: {b.doctorCodePrefix}</small></td>
          <td><a href={`tel:${b.phone}`}>{b.phone}</a></td>
          <td>{b.doctorName}<small>{b.doctorRoom}</small></td>
          <td>{b.visitType}</td>
          <td>{b.bookedAt}</td>
          <td><span className={`badge ${statusTone[b.status]}`}>{statusLabels[b.status]}</span></td>
          <td><div className="row-actions">
            <button title="نداء" onClick={() => updateStatus(b.id, 'called')}><Send size={15}/></button>
            <button title="بدأ الكشف" onClick={() => updateStatus(b.id, 'in_progress')}><TimerReset size={15}/></button>
            <button title="تم الكشف" onClick={() => updateStatus(b.id, 'finished')}><Phone size={15}/></button>
            <button title="تخطي" onClick={() => skip(b.id)}><SkipForward size={15}/></button>
            <button title="تأجيل" onClick={() => postpone(b.id)}><XCircle size={15}/></button>
            <button title="إرجاع" onClick={() => returnToQueue(b.id)}><RotateCcw size={15}/></button>
            <button title="تعديل" onClick={() => setEditing(b)}><Edit3 size={15}/></button>
            <button title="حذف" onClick={() => window.confirm('حذف هذا الحجز؟') && deleteBooking(b.id)}><Trash2 size={15}/></button>
            <a title="واتساب" href={shareWhatsApp(b.phone, `مرحبًا ${b.patientName}، كود حجزك ${b.code}، رقم دورك ${b.queueNumber} لدى ${b.doctorName} في ${b.doctorRoom}.`)} target="_blank"><MessageCircle size={15}/></a>
          </div></td>
        </tr>)}
        </tbody>
      </table>
    </div>
    {editing && <EditBookingModal booking={editing} onClose={() => setEditing(null)} />}
  </div>
}
