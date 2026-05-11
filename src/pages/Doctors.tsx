import { useState } from 'react'
import { Edit3, Plus, Stethoscope, Trash2 } from 'lucide-react'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'
import type { Doctor } from '../types'

const emptyForm = { name: '', specialty: '', room: '', codePrefix: '', averageVisitMinutes: 10, active: true }

export default function Doctors() {
  const { doctors, addDoctor, updateDoctor, deleteDoctor, toggleDoctor } = useClinic()
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<Doctor | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.specialty || !form.room) return
    addDoctor({ ...form, codePrefix: form.codePrefix || `DR${doctors.length + 1}` })
    setForm(emptyForm)
  }

  const openEdit = (doctor: Doctor) => {
    setEditing(doctor)
    setEditForm({
      name: doctor.name,
      specialty: doctor.specialty,
      room: doctor.room,
      codePrefix: doctor.codePrefix,
      averageVisitMinutes: doctor.averageVisitMinutes,
      active: doctor.active
    })
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !editForm.name || !editForm.specialty || !editForm.room) return
    updateDoctor(editing.id, editForm)
    setEditing(null)
  }

  return <section className="page fade-in">
    <Topbar title="إدارة الأطباء والغرف" subtitle="إضافة وتعديل وحذف الأطباء، مع بادئة أكواد مستقلة لكل طبيب وغرفة" />
    <div className="stats-grid"><StatCard title="الأطباء" value={doctors.length} icon={<Stethoscope />} /><StatCard title="المتاحون" value={doctors.filter(d => d.active).length} tone="green" /><StatCard title="الغرف المستخدمة" value={new Set(doctors.map(d => d.room).filter(Boolean)).size} tone="gold" /></div>
    <div className="split-layout">
      <form className="panel-card" onSubmit={submit}>
        <h2>إضافة طبيب</h2>
        <label>اسم الطبيب<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم الطبيب" /></label>
        <label>التخصص<input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="التخصص" /></label>
        <label>الغرفة<input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="غرفة / عيادة" /></label>
        <label>بادئة أكواد المرضى<input value={form.codePrefix} onChange={e => setForm({ ...form, codePrefix: e.target.value })} placeholder="مثال: DR1 أو CARD" /></label>
        <label>متوسط وقت الكشف<input type="number" min={1} value={form.averageVisitMinutes} onChange={e => setForm({ ...form, averageVisitMinutes: Number(e.target.value) })} /></label>
        <button className="primary-btn"><Plus size={18}/> إضافة الطبيب</button>
      </form>
      <div className="table-card"><div className="table-head"><strong>قائمة الأطباء</strong><span>{doctors.length}</span></div>
        {!doctors.length ? <div className="empty-state"><h2>لا يوجد أطباء بعد</h2><p>أضف طبيبًا وغرفة وبادئة أكواد؛ بعدها يمكن استقبال حجوزات مستقلة لهذا الطبيب.</p></div> : <div className="doctor-cards">{doctors.map(d => <div key={d.id} className="doctor-card"><div><strong>{d.name}</strong><span>{d.specialty} • {d.room}</span><small>كود المرضى: {d.codePrefix}-0001 • متوسط الكشف {d.averageVisitMinutes} دقيقة</small></div><div className="card-actions"><button className={d.active ? 'success-btn small' : 'ghost-btn small'} onClick={() => toggleDoctor(d.id)}>{d.active ? 'متاح' : 'متوقف'}</button><button className="ghost-btn small" onClick={() => openEdit(d)}><Edit3 size={14}/> تعديل</button><button className="danger-btn small" onClick={() => window.confirm('حذف الطبيب سيحذف المرضى والحجوزات التابعة له. هل أنت متأكد؟') && deleteDoctor(d.id)}><Trash2 size={14}/> حذف</button></div></div>)}</div>}
      </div>
    </div>
    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}>
      <form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={saveEdit}>
        <h2>تعديل الطبيب</h2>
        <label>اسم الطبيب<input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></label>
        <label>التخصص<input value={editForm.specialty} onChange={e => setEditForm({ ...editForm, specialty: e.target.value })} /></label>
        <label>الغرفة<input value={editForm.room} onChange={e => setEditForm({ ...editForm, room: e.target.value })} /></label>
        <label>بادئة أكواد المرضى<input value={editForm.codePrefix} onChange={e => setEditForm({ ...editForm, codePrefix: e.target.value })} /></label>
        <label>متوسط وقت الكشف<input type="number" min={1} value={editForm.averageVisitMinutes} onChange={e => setEditForm({ ...editForm, averageVisitMinutes: Number(e.target.value) })} /></label>
        <label>الحالة<select value={editForm.active ? 'true' : 'false'} onChange={e => setEditForm({ ...editForm, active: e.target.value === 'true' })}><option value="true">متاح</option><option value="false">متوقف</option></select></label>
        <div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setEditing(null)}>إلغاء</button><button className="primary-btn">حفظ التعديل</button></div>
      </form>
    </div>}
  </section>
}
