import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, Clock3, PlusCircle } from 'lucide-react'
import { describeScheduleForDate, formatDate, generateTimeSlots, getScheduleForDate, isDoctorWorkingOnDate, todayKey } from '../lib/helpers'
import { useClinic } from '../store/ClinicContext'

const initialVisitTypes = ['كشف', 'استشارة', 'متابعة', 'حالة عاجلة', 'إعادة كشف']

export default function AddBookingForm() {
  const { doctors, rooms, bookings, selectedDate, setSelectedDate, addBooking } = useClinic()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ patientName: '', phone: '', doctorId: '', visitType: 'كشف', bookedDate: selectedDate || todayKey(), bookedTime: '', notes: '', priority: 0 })
  const activeDoctors = useMemo(() => doctors.filter(d => d.active), [doctors])
  const workingDoctors = useMemo(() => activeDoctors.filter(d => isDoctorWorkingOnDate(d, form.bookedDate)), [activeDoctors, form.bookedDate])
  const selectedDoctor = activeDoctors.find(d => d.id === form.doctorId) || workingDoctors[0]
  const selectedRoom = selectedDoctor?.roomId ? rooms.find(r => r.id === selectedDoctor.roomId) : undefined
  const schedule = getScheduleForDate(selectedDoctor, form.bookedDate)
  const dayBookings = bookings.filter(b => b.doctorId === selectedDoctor?.id && b.bookedDate === form.bookedDate && !['cancelled', 'no_show'].includes(b.status))
  const slots = generateTimeSlots(selectedDoctor, form.bookedDate, dayBookings.map(b => b.bookedTime))
  const availableSlots = slots.filter(s => s.available)
  const capacityReached = schedule?.maxBookings ? dayBookings.length >= schedule.maxBookings : false

  useEffect(() => {
    if (!open) return
    if (!form.doctorId || !isDoctorWorkingOnDate(activeDoctors.find(d => d.id === form.doctorId), form.bookedDate)) {
      setForm(prev => ({ ...prev, doctorId: workingDoctors[0]?.id || '', bookedTime: '' }))
    }
  }, [open, activeDoctors, workingDoctors, form.doctorId, form.bookedDate])

  useEffect(() => {
    if (!open) return
    if (!form.bookedTime && availableSlots[0]?.time && !capacityReached) setForm(prev => ({ ...prev, bookedTime: availableSlots[0].time }))
    if (form.bookedTime && !availableSlots.some(s => s.time === form.bookedTime)) setForm(prev => ({ ...prev, bookedTime: availableSlots[0]?.time || '' }))
  }, [open, availableSlots, form.bookedTime, capacityReached])

  const openModal = () => {
    const date = selectedDate || todayKey()
    const doctorsForDate = activeDoctors.filter(d => isDoctorWorkingOnDate(d, date))
    setForm(prev => ({ ...prev, bookedDate: date, doctorId: doctorsForDate[0]?.id || activeDoctors[0]?.id || '', bookedTime: '' }))
    setOpen(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patientName.trim() || !form.phone.trim() || !form.doctorId || !form.bookedDate || !form.bookedTime || !schedule || capacityReached) return
    addBooking({ ...form, patientName: form.patientName.trim(), phone: form.phone.trim(), notes: form.notes.trim() })
    setSelectedDate(form.bookedDate)
    setForm({ patientName: '', phone: '', doctorId: workingDoctors[0]?.id || '', visitType: 'كشف', bookedDate: form.bookedDate, bookedTime: '', notes: '', priority: 0 })
    setOpen(false)
  }

  return <>
    <button className="primary-btn" disabled={!activeDoctors.length} onClick={openModal}><PlusCircle size={18}/> حجز جديد</button>
    {open && <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <form className="modal-card wide-modal" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-title"><div><h2>إضافة حجز بموعد محدد</h2><p>اختر اليوم والتاريخ، وسيظهر فقط الأطباء العاملون في هذا اليوم وساعاتهم المتاحة.</p></div><PlusCircle size={28}/></div>
        {!activeDoctors.length && <div className="inline-alert"><AlertCircle size={18}/> أضف طبيبًا متاحًا أولًا من صفحة الأطباء حتى يمكن إنشاء الحجز.</div>}
        {activeDoctors.length > 0 && !workingDoctors.length && <div className="inline-alert"><AlertCircle size={18}/> لا يوجد طبيب يعمل في هذا التاريخ. غيّر التاريخ أو عدّل جدول عمل الطبيب.</div>}
        <div className="booking-date-strip">
          <label><CalendarDays size={16}/> يوم الحجز<input type="date" value={form.bookedDate} min={todayKey()} onChange={e => setForm({ ...form, bookedDate: e.target.value, doctorId: '', bookedTime: '' })} /></label>
          <div><span>اليوم المختار</span><strong>{formatDate(form.bookedDate)}</strong><small>{selectedDoctor ? describeScheduleForDate(selectedDoctor, form.bookedDate) : 'اختر طبيبًا لعرض ساعات العمل'}</small></div>
        </div>
        <div className="form-grid two">
          <label>اسم المريض<input value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} placeholder="اسم المريض" autoFocus /></label>
          <label>رقم الهاتف<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01000000000" /></label>
          <label>الطبيب<select value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value, bookedTime: '' })}>{activeDoctors.length ? activeDoctors.map(d => <option key={d.id} value={d.id} disabled={!isDoctorWorkingOnDate(d, form.bookedDate)}>{d.name} - {d.specialty} - {d.room}{isDoctorWorkingOnDate(d, form.bookedDate) ? '' : ' - غير متاح'}</option>) : <option value="">لا يوجد أطباء</option>}</select></label>
          <label>نوع الزيارة<select value={form.visitType} onChange={e => setForm({ ...form, visitType: e.target.value })}>{initialVisitTypes.map(type => <option key={type}>{type}</option>)}</select></label>
          <label>الساعة المتاحة<select value={form.bookedTime} disabled={!schedule || capacityReached || !availableSlots.length} onChange={e => setForm({ ...form, bookedTime: e.target.value })}>{availableSlots.length ? availableSlots.map(slot => <option key={slot.time} value={slot.time}>{slot.time}</option>) : <option value="">لا توجد مواعيد متاحة</option>}</select></label>
          <label>الأولوية<select value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })}><option value={0}>عادي</option><option value={1}>أولوية</option><option value={2}>عاجل</option></select></label>
          <div className="preview-box"><span>الغرفة والكود</span><strong>{selectedRoom?.name || selectedDoctor?.room || '—'}</strong><small>بادئة الكود: {selectedDoctor?.codePrefix || '—'}-0001</small><small>حجوزات هذا اليوم: {dayBookings.length}{schedule?.maxBookings ? ` / ${schedule.maxBookings}` : ''}</small></div>
          <div className="preview-box"><span>نطاق العمل</span><strong>{schedule ? `${schedule.startTime} - ${schedule.endTime}` : 'غير متاح'}</strong><small><Clock3 size={13}/> مدة الموعد حسب متوسط الكشف: {selectedDoctor?.averageVisitMinutes || 0} دقيقة</small></div>
        </div>
        {capacityReached && <div className="inline-alert"><AlertCircle size={18}/> تم الوصول للحد الأقصى لحجوزات هذا الطبيب في هذا اليوم.</div>}
        <label>ملاحظات<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات اختيارية" /></label>
        <div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setOpen(false)}>إلغاء</button><button className="primary-btn" disabled={!activeDoctors.length || !schedule || !form.bookedTime || capacityReached}>حفظ وإنشاء رقم دور</button></div>
      </form>
    </div>}
  </>
}
