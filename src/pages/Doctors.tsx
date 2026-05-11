import { useState } from 'react'
import { CalendarDays, Clock3, Edit3, Plus, Stethoscope, Trash2, UserCheck } from 'lucide-react'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { dayNames, defaultDoctorSchedules, describeScheduleForDate, normalizeSchedules, todayKey } from '../lib/helpers'
import { useClinic } from '../store/ClinicContext'
import type { Doctor, DoctorSchedule } from '../types'

type DoctorForm = {
  name: string
  specialty: string
  room: string
  roomId: string
  codePrefix: string
  averageVisitMinutes: number
  schedules: DoctorSchedule[]
  active: boolean
}

const makeEmptyForm = (): DoctorForm => ({
  name: '',
  specialty: '',
  room: '',
  roomId: '',
  codePrefix: '',
  averageVisitMinutes: 10,
  schedules: defaultDoctorSchedules(),
  active: true
})

function ScheduleEditor({ schedules, onChange }: { schedules: DoctorSchedule[]; onChange: (schedules: DoctorSchedule[]) => void }) {
  const safe = normalizeSchedules(schedules)
  const scheduleFor = (day: number) => safe.find(s => s.dayOfWeek === day) || {
    id: `schedule-${day}`,
    dayOfWeek: day,
    dayName: dayNames[day],
    startTime: '09:00',
    endTime: '17:00',
    active: false,
    maxBookings: undefined
  }

  const updateDay = (day: number, patch: Partial<DoctorSchedule>) => {
    const current = scheduleFor(day)
    const others = safe.filter(s => s.dayOfWeek !== day)
    onChange(normalizeSchedules([...others, { ...current, ...patch, dayOfWeek: day, dayName: dayNames[day] }]))
  }

  return <div className="schedule-editor">
    <div className="schedule-title"><CalendarDays size={18}/><div><strong>مواعيد عمل الطبيب</strong><span>فعّل الأيام وحدد من الساعة إلى الساعة. الحجز لن يظهر إلا في الأيام المتاحة.</span></div></div>
    <div className="schedule-grid">
      {dayNames.map((name, day) => {
        const s = scheduleFor(day)
        return <div key={name} className={`schedule-row ${s.active ? 'active' : ''}`}>
          <label className="day-toggle"><input type="checkbox" checked={s.active} onChange={e => updateDay(day, { active: e.target.checked })} /><span>{name}</span></label>
          <label>من<input type="time" value={s.startTime} disabled={!s.active} onChange={e => updateDay(day, { startTime: e.target.value })} /></label>
          <label>إلى<input type="time" value={s.endTime} disabled={!s.active} onChange={e => updateDay(day, { endTime: e.target.value })} /></label>
          <label>حد أقصى<input type="number" min={0} value={s.maxBookings || ''} disabled={!s.active} onChange={e => updateDay(day, { maxBookings: Number(e.target.value) || undefined })} placeholder="اختياري" /></label>
        </div>
      })}
    </div>
  </div>
}

export default function Doctors() {
  const { doctors, rooms, bookings, addDoctor, updateDoctor, deleteDoctor, toggleDoctor, selectedDate } = useClinic()
  const [form, setForm] = useState<DoctorForm>(makeEmptyForm())
  const [editing, setEditing] = useState<Doctor | null>(null)
  const [editForm, setEditForm] = useState<DoctorForm>(makeEmptyForm())

  const roomName = (id?: string, fallback = '') => rooms.find(r => r.id === id)?.name || fallback
  const scheduleDate = selectedDate || todayKey()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const computedRoom = roomName(form.roomId, form.room)
    if (!form.name.trim() || !form.specialty.trim() || !computedRoom) return
    addDoctor({ ...form, name: form.name.trim(), specialty: form.specialty.trim(), room: computedRoom, roomId: form.roomId || undefined, codePrefix: form.codePrefix || `DR${doctors.length + 1}`, schedules: normalizeSchedules(form.schedules) })
    setForm(makeEmptyForm())
  }

  const openEdit = (doctor: Doctor) => {
    setEditing(doctor)
    setEditForm({
      name: doctor.name,
      specialty: doctor.specialty,
      room: doctor.room,
      roomId: doctor.roomId || '',
      codePrefix: doctor.codePrefix,
      averageVisitMinutes: doctor.averageVisitMinutes,
      schedules: normalizeSchedules(doctor.schedules),
      active: doctor.active
    })
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const computedRoom = roomName(editForm.roomId, editForm.room)
    if (!editForm.name.trim() || !editForm.specialty.trim() || !computedRoom) return
    updateDoctor(editing.id, { ...editForm, name: editForm.name.trim(), specialty: editForm.specialty.trim(), room: computedRoom, roomId: editForm.roomId || undefined, schedules: normalizeSchedules(editForm.schedules) })
    setEditing(null)
  }

  return <section className="page fade-in">
    <Topbar title="إدارة الأطباء والمواعيد" subtitle="إضافة وتعديل وحذف الأطباء مع جدول عمل أسبوعي، وساعات حجز دقيقة لكل طبيب" />
    <div className="stats-grid"><StatCard title="الأطباء" value={doctors.length} icon={<Stethoscope />} /><StatCard title="المتاحون" value={doctors.filter(d => d.active).length} tone="green" icon={<UserCheck/>} /><StatCard title="يعملون في اليوم المحدد" value={doctors.filter(d => describeScheduleForDate(d, scheduleDate) !== 'الطبيب غير متاح في هذا اليوم' && d.active).length} tone="gold" icon={<Clock3/>} /><StatCard title="حجوزات مرتبطة" value={bookings.length} tone="purple" /></div>
    <div className="split-layout">
      <form className="panel-card" onSubmit={submit}>
        <h2>إضافة طبيب</h2>
        <label>اسم الطبيب<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم الطبيب" /></label>
        <label>التخصص<input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="التخصص" /></label>
        <label>اختيار غرفة محفوظة<select value={form.roomId} onChange={e => setForm({ ...form, roomId: e.target.value, room: roomName(e.target.value, form.room) })}><option value="">بدون ربط / إدخال يدوي</option>{rooms.filter(r => r.active).map(r => <option key={r.id} value={r.id}>{r.name} - {r.floor}</option>)}</select></label>
        <label>الغرفة<input value={form.room} onChange={e => setForm({ ...form, room: e.target.value, roomId: '' })} placeholder="غرفة / عيادة" /></label>
        <label>بادئة أكواد المرضى<input value={form.codePrefix} onChange={e => setForm({ ...form, codePrefix: e.target.value })} placeholder="مثال: DR1 أو CARD" /></label>
        <label>متوسط وقت الكشف بالدقائق<input type="number" min={5} value={form.averageVisitMinutes} onChange={e => setForm({ ...form, averageVisitMinutes: Number(e.target.value) })} /></label>
        <ScheduleEditor schedules={form.schedules} onChange={schedules => setForm({ ...form, schedules })} />
        <button className="primary-btn"><Plus size={18}/> إضافة الطبيب</button>
      </form>
      <div className="table-card"><div className="table-head"><strong>قائمة الأطباء</strong><span>{doctors.length}</span></div>
        {!doctors.length ? <div className="empty-state"><h2>لا يوجد أطباء بعد</h2><p>أضف طبيبًا وغرفة وبادئة أكواد وجدول عمل؛ بعدها يمكن استقبال حجوزات مرتبطة باليوم والساعة.</p></div> : <div className="doctor-cards">{doctors.map(d => {
          const activeBookings = bookings.filter(b => b.doctorId === d.id && b.bookedDate === scheduleDate && ['waiting', 'called', 'in_progress', 'postponed'].includes(b.status)).length
          const schedule = describeScheduleForDate(d, scheduleDate)
          return <div key={d.id} className="doctor-card"><div><strong>{d.name}</strong><span>{d.specialty} • {d.room}</span><small>كود المرضى: {d.codePrefix}-0001 • متوسط الكشف {d.averageVisitMinutes} دقيقة</small><small className="schedule-pill">{schedule}</small><small>قائمة اليوم المحدد: {activeBookings}</small></div><div className="card-actions"><button className={d.active ? 'success-btn small' : 'ghost-btn small'} onClick={() => toggleDoctor(d.id)}>{d.active ? 'متاح' : 'متوقف'}</button><button className="ghost-btn small" onClick={() => openEdit(d)}><Edit3 size={14}/> تعديل</button><button className="danger-btn small" onClick={() => window.confirm('حذف الطبيب سيحذف المرضى والحجوزات التابعة له. هل أنت متأكد؟') && deleteDoctor(d.id)}><Trash2 size={14}/> حذف</button></div></div>
        })}</div>}
      </div>
    </div>
    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}>
      <form className="modal-card ultra-wide-modal" onClick={e => e.stopPropagation()} onSubmit={saveEdit}>
        <div className="modal-title"><div><h2>تعديل الطبيب وجدول العمل</h2><p>تغيير المواعيد يحدد الأيام والساعات المتاحة للحجز. الحجوزات القديمة تبقى محفوظة ويمكن تعديلها.</p></div><Edit3 size={28}/></div>
        <div className="form-grid two">
          <label>اسم الطبيب<input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></label>
          <label>التخصص<input value={editForm.specialty} onChange={e => setEditForm({ ...editForm, specialty: e.target.value })} /></label>
          <label>اختيار غرفة محفوظة<select value={editForm.roomId} onChange={e => setEditForm({ ...editForm, roomId: e.target.value, room: roomName(e.target.value, editForm.room) })}><option value="">بدون ربط / إدخال يدوي</option>{rooms.filter(r => r.active).map(r => <option key={r.id} value={r.id}>{r.name} - {r.floor}</option>)}</select></label>
          <label>الغرفة<input value={editForm.room} onChange={e => setEditForm({ ...editForm, room: e.target.value, roomId: '' })} /></label>
          <label>بادئة أكواد المرضى<input value={editForm.codePrefix} onChange={e => setEditForm({ ...editForm, codePrefix: e.target.value })} /></label>
          <label>متوسط وقت الكشف<input type="number" min={5} value={editForm.averageVisitMinutes} onChange={e => setEditForm({ ...editForm, averageVisitMinutes: Number(e.target.value) })} /></label>
          <label>الحالة<select value={editForm.active ? 'true' : 'false'} onChange={e => setEditForm({ ...editForm, active: e.target.value === 'true' })}><option value="true">متاح</option><option value="false">متوقف</option></select></label>
        </div>
        <ScheduleEditor schedules={editForm.schedules} onChange={schedules => setEditForm({ ...editForm, schedules })} />
        <div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setEditing(null)}>إلغاء</button><button className="primary-btn">حفظ التعديل</button></div>
      </form>
    </div>}
  </section>
}
