import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Edit3, MessageCircle, Phone, Printer, RotateCcw, Search, Send, SkipForward, TimerReset, Trash2, XCircle } from 'lucide-react'
import { buildTicketMessage, formatBookingDateTime, formatDate, formatShortDate, generateTimeSlots, getScheduleForDate, shareWhatsApp, todayKey } from '../lib/helpers'
import { useClinic } from '../store/ClinicContext'
import { priorityLabels, statusLabels, statusTone, type Booking, type BookingStatus } from '../types'

const statuses = Object.keys(statusLabels) as BookingStatus[]

export default function BookingTable({ bookings }: { bookings: Booking[] }) {
  const { updateStatus, skip, postpone, returnToQueue, updateBooking, deleteBooking, doctors, settings, bookings: allBookings } = useClinic()
  const [editing, setEditing] = useState<Booking | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all')
  const [form, setForm] = useState({ patientName: '', phone: '', doctorId: '', visitType: 'كشف', bookedDate: todayKey(), bookedTime: '', notes: '', priority: 0, status: 'waiting' as BookingStatus })
  const selectedDoctor = doctors.find(d => d.id === form.doctorId)
  const schedule = getScheduleForDate(selectedDoctor, form.bookedDate)
  const bookedTimes = allBookings
    .filter(b => b.id !== editing?.id && b.doctorId === form.doctorId && b.bookedDate === form.bookedDate && !['cancelled', 'no_show'].includes(b.status))
    .map(b => b.bookedTime)
  const slots = generateTimeSlots(selectedDoctor, form.bookedDate, bookedTimes)
  const availableSlots = slots.filter(s => s.available)

  const filteredBookings = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bookings.filter(b => {
      const matchesText = !q || [b.patientName, b.phone, b.patientCode, b.doctorName, b.roomName, String(b.queueNumber), b.bookedDate, b.bookedTime].join(' ').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter
      return matchesText && matchesStatus
    })
  }, [bookings, query, statusFilter])

  useEffect(() => {
    if (!editing) return
    if (form.bookedTime && availableSlots.some(s => s.time === form.bookedTime)) return
    setForm(prev => ({ ...prev, bookedTime: availableSlots[0]?.time || '' }))
  }, [editing, availableSlots, form.bookedTime])

  const openEdit = (booking: Booking) => {
    setEditing(booking)
    setForm({
      patientName: booking.patientName,
      phone: booking.phone,
      doctorId: booking.doctorId,
      visitType: booking.visitType,
      bookedDate: booking.bookedDate || todayKey(),
      bookedTime: booking.bookedTime || booking.bookedAt,
      notes: booking.notes || '',
      priority: booking.priority,
      status: booking.status
    })
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !form.patientName.trim() || !form.phone.trim() || !form.doctorId || !form.bookedDate || !form.bookedTime || !schedule) return
    updateBooking(editing.id, { ...form, patientName: form.patientName.trim(), phone: form.phone.trim(), notes: form.notes.trim() })
    setEditing(null)
  }

  const printTicket = (booking: Booking) => {
    const doctor = doctors.find(d => d.id === booking.doctorId)
    const html = `
      <html dir="rtl" lang="ar"><head><title>تذكرة الدور</title><style>
      body{font-family:Arial,sans-serif;background:#f7f9ff;margin:0;padding:24px;color:#0f172a}.ticket{max-width:380px;margin:auto;background:#fff;border:1px solid #dbe3f0;border-radius:24px;padding:24px;text-align:center;box-shadow:0 20px 60px #0001}.queue{font-size:86px;font-weight:900;color:#1d63ed;line-height:1}.code{font-size:24px;font-weight:800}.meta{display:grid;gap:8px;text-align:right;margin-top:20px}.meta div{display:flex;justify-content:space-between;border-bottom:1px dashed #dbe3f0;padding:8px 0}small{color:#64748b}@media print{body{background:#fff}.ticket{box-shadow:none}}
      </style></head><body><div class="ticket"><small>${settings.clinicName}</small><h2>تذكرة الدور</h2><div class="queue">${booking.queueNumber}</div><div class="code">${booking.patientCode}</div><div class="meta"><div><b>المريض</b><span>${booking.patientName}</span></div><div><b>الطبيب</b><span>${booking.doctorName}</span></div><div><b>الغرفة</b><span>${booking.roomName || doctor?.room || '—'}</span></div><div><b>الزيارة</b><span>${booking.visitType}</span></div><div><b>اليوم</b><span>${formatDate(booking.bookedDate)}</span></div><div><b>الساعة</b><span>${booking.bookedTime}</span></div></div></div><script>print();close();</script></body></html>`
    const win = window.open('', '_blank', 'width=420,height=720')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  return <div className="table-card">
    <div className="table-head enhanced-head">
      <div><strong>قائمة حجوزات اليوم المحدد</strong><span>{filteredBookings.length} من {bookings.length} حجز</span></div>
      <div className="filters-row">
        <label className="select-wrap"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث بالاسم / الهاتف / الكود / الدور" /></label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | BookingStatus)}><option value="all">كل الحالات</option>{statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select>
      </div>
    </div>
    {!filteredBookings.length ? <div className="empty-state"><h2>لا توجد حجوزات مطابقة لهذا اليوم</h2><p>غيّر التاريخ من الشريط العلوي أو أضف حجزًا جديدًا في يوم عمل الطبيب.</p></div> : <div className="responsive-table">
      <table>
        <thead><tr><th>الدور</th><th>المريض</th><th>الهاتف</th><th>الطبيب / الغرفة</th><th>النوع</th><th>الأولوية</th><th>الموعد</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
        <tbody>
        {filteredBookings.map(b => <tr key={b.id}>
          <td><b className="queue-no">{b.queueNumber}</b></td>
          <td>{b.patientName}<small>كود المريض: {b.patientCode || b.code}</small></td>
          <td><a href={`tel:${b.phone}`}>{b.phone}</a></td>
          <td>{b.doctorName}<small>{b.roomName || doctors.find(d => d.id === b.doctorId)?.room || 'بدون غرفة'}</small></td>
          <td>{b.visitType}</td>
          <td><span className={`badge ${b.priority === 2 ? 'danger' : b.priority === 1 ? 'warning' : 'muted'}`}>{priorityLabels[b.priority] || 'عادي'}</span></td>
          <td><span className="date-cell"><CalendarDays size={14}/>{formatBookingDateTime(b)}</span></td>
          <td><span className={`badge ${statusTone[b.status]}`}>{statusLabels[b.status]}</span></td>
          <td><div className="row-actions">
            <button title="تعديل" onClick={() => openEdit(b)}><Edit3 size={15}/></button>
            <button title="نداء" onClick={() => updateStatus(b.id, 'called')}><Send size={15}/></button>
            <button title="بدأ الكشف" onClick={() => updateStatus(b.id, 'in_progress')}><TimerReset size={15}/></button>
            <button title="تم الكشف" onClick={() => updateStatus(b.id, 'finished')}><Phone size={15}/></button>
            <button title="تخطي" onClick={() => skip(b.id)}><SkipForward size={15}/></button>
            <button title="تأجيل" onClick={() => postpone(b.id)}><XCircle size={15}/></button>
            <button title="إرجاع" onClick={() => returnToQueue(b.id)}><RotateCcw size={15}/></button>
            <button title="طباعة التذكرة" onClick={() => printTicket(b)}><Printer size={15}/></button>
            <button title="حذف" onClick={() => window.confirm('هل تريد حذف هذا الحجز؟') && deleteBooking(b.id)}><Trash2 size={15}/></button>
            <a title="واتساب" href={shareWhatsApp(b.phone, buildTicketMessage(settings.whatsappTemplate, b, doctors.find(d => d.id === b.doctorId)))} target="_blank"><MessageCircle size={15}/></a>
          </div></td>
        </tr>)}
        </tbody>
      </table>
    </div>}
    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}>
      <form className="modal-card wide-modal" onClick={e => e.stopPropagation()} onSubmit={saveEdit}>
        <div className="modal-title"><div><h2>تعديل الحجز والموعد</h2><p>عند تغيير الطبيب أو التاريخ يتم إنشاء رقم دور جديد تابع لهذا الطبيب وهذا اليوم.</p></div><Edit3 size={28}/></div>
        <div className="form-grid two">
          <label>اسم المريض<input value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} /></label>
          <label>رقم الهاتف<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
          <label>الطبيب / الغرفة<select value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value, bookedTime: '' })}>{doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.room}</option>)}</select></label>
          <label>تاريخ الحجز<input type="date" value={form.bookedDate} min={todayKey()} onChange={e => setForm({ ...form, bookedDate: e.target.value, bookedTime: '' })} /></label>
          <label>ساعة الحجز<select value={form.bookedTime} disabled={!schedule || !availableSlots.length} onChange={e => setForm({ ...form, bookedTime: e.target.value })}>{availableSlots.length ? availableSlots.map(s => <option key={s.time} value={s.time}>{s.time}</option>) : <option value="">لا توجد ساعات متاحة</option>}</select></label>
          <label>نوع الزيارة<select value={form.visitType} onChange={e => setForm({ ...form, visitType: e.target.value })}><option>كشف</option><option>استشارة</option><option>متابعة</option><option>حالة عاجلة</option><option>إعادة كشف</option></select></label>
          <label>الأولوية<select value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })}><option value={0}>عادي</option><option value={1}>أولوية</option><option value={2}>عاجل</option></select></label>
          <label>الحالة<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as BookingStatus })}>{statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></label>
        </div>
        <div className="preview-box full"><span>التحقق من جدول الطبيب</span><strong>{schedule ? `${formatDate(form.bookedDate)} من ${schedule.startTime} إلى ${schedule.endTime}` : 'الطبيب لا يعمل في هذا اليوم'}</strong><small>{availableSlots.length ? `يوجد ${availableSlots.length} موعد متاح` : 'لا توجد مواعيد متاحة لهذا الاختيار'}</small></div>
        <label>ملاحظات<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
        <div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setEditing(null)}>إلغاء</button><button className="primary-btn" disabled={!schedule || !form.bookedTime}>حفظ التعديل</button></div>
      </form>
    </div>}
  </div>
}
