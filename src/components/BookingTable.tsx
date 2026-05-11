import { useState } from 'react'
import { Edit3, MessageCircle, Phone, RotateCcw, Send, SkipForward, TimerReset, Trash2, XCircle } from 'lucide-react'
import { shareWhatsApp } from '../lib/helpers'
import { useClinic } from '../store/ClinicContext'
import { statusLabels, statusTone, type Booking, type BookingStatus } from '../types'

const statuses = Object.keys(statusLabels) as BookingStatus[]

export default function BookingTable({ bookings }: { bookings: Booking[] }) {
  const { updateStatus, skip, postpone, returnToQueue, updateBooking, deleteBooking, doctors } = useClinic()
  const [editing, setEditing] = useState<Booking | null>(null)
  const [form, setForm] = useState({ patientName: '', phone: '', doctorId: '', visitType: 'كشف', notes: '', priority: 0, status: 'waiting' as BookingStatus })

  const openEdit = (booking: Booking) => {
    setEditing(booking)
    setForm({
      patientName: booking.patientName,
      phone: booking.phone,
      doctorId: booking.doctorId,
      visitType: booking.visitType,
      notes: booking.notes || '',
      priority: booking.priority,
      status: booking.status
    })
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !form.patientName || !form.phone || !form.doctorId) return
    updateBooking(editing.id, form)
    setEditing(null)
  }

  return <div className="table-card">
    <div className="table-head"><strong>قائمة الحجوزات</strong><span>{bookings.length} حجز</span></div>
    {!bookings.length ? <div className="empty-state"><h2>لا توجد حجوزات لهذا الطبيب</h2><p>ابدأ بإضافة حجز جديد، وسيظهر كود المريض الخاص بالطبيب تلقائيًا.</p></div> : <div className="responsive-table">
      <table>
        <thead><tr><th>الدور</th><th>المريض</th><th>الهاتف</th><th>الطبيب / الغرفة</th><th>النوع</th><th>الوقت</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
        <tbody>
        {bookings.map(b => <tr key={b.id}>
          <td><b className="queue-no">{b.queueNumber}</b></td>
          <td>{b.patientName}<small>كود المريض: {b.patientCode || b.code}</small></td>
          <td><a href={`tel:${b.phone}`}>{b.phone}</a></td>
          <td>{b.doctorName}<small>{doctors.find(d => d.id === b.doctorId)?.room || 'بدون غرفة'}</small></td>
          <td>{b.visitType}</td>
          <td>{b.bookedAt}</td>
          <td><span className={`badge ${statusTone[b.status]}`}>{statusLabels[b.status]}</span></td>
          <td><div className="row-actions">
            <button title="تعديل" onClick={() => openEdit(b)}><Edit3 size={15}/></button>
            <button title="نداء" onClick={() => updateStatus(b.id, 'called')}><Send size={15}/></button>
            <button title="بدأ الكشف" onClick={() => updateStatus(b.id, 'in_progress')}><TimerReset size={15}/></button>
            <button title="تم الكشف" onClick={() => updateStatus(b.id, 'finished')}><Phone size={15}/></button>
            <button title="تخطي" onClick={() => skip(b.id)}><SkipForward size={15}/></button>
            <button title="تأجيل" onClick={() => postpone(b.id)}><XCircle size={15}/></button>
            <button title="إرجاع" onClick={() => returnToQueue(b.id)}><RotateCcw size={15}/></button>
            <button title="حذف" onClick={() => window.confirm('هل تريد حذف هذا الحجز؟') && deleteBooking(b.id)}><Trash2 size={15}/></button>
            <a title="واتساب" href={shareWhatsApp(b.phone, `مرحبًا ${b.patientName}، رقم دورك ${b.queueNumber}، كودك ${b.patientCode || b.code}.`)} target="_blank"><MessageCircle size={15}/></a>
          </div></td>
        </tr>)}
        </tbody>
      </table>
    </div>}
    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}>
      <form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={saveEdit}>
        <h2>تعديل الحجز</h2>
        <label>اسم المريض<input value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} /></label>
        <label>رقم الهاتف<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
        <label>الطبيب / الغرفة<select value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}>{doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.room}</option>)}</select></label>
        <label>نوع الزيارة<select value={form.visitType} onChange={e => setForm({ ...form, visitType: e.target.value })}><option>كشف</option><option>استشارة</option><option>متابعة</option><option>حالة عاجلة</option></select></label>
        <label>الأولوية<select value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })}><option value={0}>عادي</option><option value={1}>أولوية</option><option value={2}>عاجل</option></select></label>
        <label>الحالة<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as BookingStatus })}>{statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></label>
        <label>ملاحظات<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
        <div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setEditing(null)}>إلغاء</button><button className="primary-btn">حفظ التعديل</button></div>
      </form>
    </div>}
  </div>
}
