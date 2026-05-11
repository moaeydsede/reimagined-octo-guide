import { useState } from 'react'
import { Edit3, Plus, Stethoscope, Trash2 } from 'lucide-react'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'
import type { Doctor } from '../types'

const blank = { name: '', specialty: '', room: '', codePrefix: '', averageVisitMinutes: 10, active: true }

export default function Doctors() {
  const { doctors, addDoctor, updateDoctor, deleteDoctor, toggleDoctor, setDoctor, bookings } = useClinic()
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState<Doctor | null>(null)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.specialty || !form.room) return
    addDoctor(form)
    setForm(blank)
  }
  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    updateDoctor(editing.id, editing)
    setEditing(null)
  }
  return <section className="page fade-in">
    <Topbar title="إدارة الأطباء والغرف" subtitle="كل طبيب له غرفة مستقلة وكود خاص للحجوزات مثل D1-001 أو ENT-001" />
    <div className="stats-grid"><StatCard title="الأطباء" value={doctors.length} icon={<Stethoscope />} /><StatCard title="المتاحون" value={doctors.filter(d => d.active).length} tone="green" /><StatCard title="الغرف" value={new Set(doctors.map(d => d.room)).size} tone="gold" /><StatCard title="الحجوزات" value={bookings.length} tone="blue" /></div>
    <div className="split-layout">
      <form className="panel-card" onSubmit={submit}><h2>إضافة طبيب</h2><label>اسم الطبيب<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم الطبيب" /></label><label>التخصص<input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="باطنة / أطفال / عظام" /></label><label>الغرفة<input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="غرفة 1" /></label><label>كود الطبيب<input value={form.codePrefix} onChange={e => setForm({ ...form, codePrefix: e.target.value.toUpperCase() })} placeholder="D1 أو ENT أو PED" /></label><label>متوسط وقت الكشف<input type="number" min="1" value={form.averageVisitMinutes} onChange={e => setForm({ ...form, averageVisitMinutes: Number(e.target.value) })} /></label><button className="primary-btn"><Plus size={18}/> إضافة الطبيب</button></form>
      <div className="table-card"><div className="table-head"><strong>قائمة الأطباء</strong><span>{doctors.length}</span></div><div className="doctor-cards">{doctors.length === 0 && <div className="empty-table">لا يوجد أطباء حتى الآن</div>}{doctors.map(d => <div key={d.id} className="doctor-card"><div><strong>{d.name}</strong><span>{d.specialty} • {d.room}</span><small>كود الحجوزات: {d.codePrefix} • {d.averageVisitMinutes} دقيقة للكشف • {bookings.filter(b => b.doctorId === d.id).length} حجز</small></div><div className="row-actions"><button className={d.active ? 'success-btn small' : 'ghost-btn small'} onClick={() => toggleDoctor(d.id)}>{d.active ? 'متاح' : 'متوقف'}</button><button title="اختيار" onClick={() => setDoctor(d.id)}><Stethoscope size={15}/></button><button title="تعديل" onClick={() => setEditing(d)}><Edit3 size={15}/></button><button title="حذف" onClick={() => window.confirm('حذف الطبيب سيحذف حجوزاته المرتبطة، هل تريد المتابعة؟') && deleteDoctor(d.id)}><Trash2 size={15}/></button></div></div>)}</div></div>
    </div>
    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}><form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={saveEdit}><h2>تعديل الطبيب</h2><label>اسم الطبيب<input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></label><label>التخصص<input value={editing.specialty} onChange={e => setEditing({ ...editing, specialty: e.target.value })} /></label><label>الغرفة<input value={editing.room} onChange={e => setEditing({ ...editing, room: e.target.value })} /></label><label>كود الطبيب<input value={editing.codePrefix} onChange={e => setEditing({ ...editing, codePrefix: e.target.value.toUpperCase() })} /></label><label>متوسط وقت الكشف<input type="number" min="1" value={editing.averageVisitMinutes} onChange={e => setEditing({ ...editing, averageVisitMinutes: Number(e.target.value) })} /></label><div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setEditing(null)}>إلغاء</button><button className="primary-btn">حفظ التعديل</button></div></form></div>}
  </section>
}
