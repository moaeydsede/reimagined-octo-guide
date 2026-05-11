import { useMemo, useState } from 'react'
import { Edit3, Search, Trash2, UsersRound } from 'lucide-react'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'
import type { Patient } from '../types'

export default function Patients() {
  const { patients, bookings, doctors, updatePatient, deletePatient } = useClinic()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Patient | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', age: '', notes: '' })

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return patients
    return patients.filter(p => p.name.includes(q) || p.phone.includes(q) || p.code.toLowerCase().includes(q.toLowerCase()) || p.doctorName.includes(q))
  }, [patients, query])

  const openEdit = (patient: Patient) => {
    setEditing(patient)
    setForm({ name: patient.name, phone: patient.phone, age: patient.age ? String(patient.age) : '', notes: patient.notes || '' })
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !form.name || !form.phone) return
    updatePatient(editing.id, { name: form.name, phone: form.phone, age: form.age ? Number(form.age) : undefined, notes: form.notes })
    setEditing(null)
  }

  return <section className="page fade-in">
    <Topbar title="إدارة المرضى" subtitle="تعديل وحذف المرضى، مع عرض كود مستقل تابع للطبيب" />
    <div className="stats-grid"><StatCard title="إجمالي المرضى" value={patients.length} icon={<UsersRound />} /><StatCard title="الأطباء المرتبطون" value={new Set(patients.map(p => p.doctorId)).size} tone="green" /><StatCard title="حجوزات مرتبطة" value={bookings.length} tone="gold" /></div>
    <div className="table-card">
      <div className="table-head"><strong>قائمة المرضى</strong><label className="select-wrap"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث بالاسم أو الهاتف أو الكود" /></label></div>
      {!filtered.length ? <div className="empty-state"><h2>لا يوجد مرضى</h2><p>سيتم إنشاء كود المريض تلقائيًا عند إضافة أول حجز للطبيب.</p></div> : <div className="responsive-table"><table>
        <thead><tr><th>كود المريض</th><th>الاسم</th><th>الهاتف</th><th>الطبيب</th><th>الغرفة</th><th>الحجوزات</th><th>الإجراءات</th></tr></thead>
        <tbody>{filtered.map(p => <tr key={p.id}><td><b className="queue-no code-pill">{p.code}</b></td><td>{p.name}<small>{p.notes || 'بدون ملاحظات'}</small></td><td><a href={`tel:${p.phone}`}>{p.phone}</a></td><td>{p.doctorName}</td><td>{doctors.find(d => d.id === p.doctorId)?.room || '—'}</td><td>{bookings.filter(b => b.patientId === p.id).length}</td><td><div className="row-actions"><button title="تعديل" onClick={() => openEdit(p)}><Edit3 size={15}/></button><button title="حذف" onClick={() => window.confirm('حذف المريض سيحذف حجوزاته المرتبطة. هل أنت متأكد؟') && deletePatient(p.id)}><Trash2 size={15}/></button></div></td></tr>)}</tbody>
      </table></div>}
    </div>
    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}>
      <form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={saveEdit}>
        <h2>تعديل بيانات المريض</h2>
        <div className="inline-alert">كود المريض ثابت للطبيب ولا يتغير عند تعديل الاسم أو الهاتف: {editing.code}</div>
        <label>اسم المريض<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label>رقم الهاتف<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
        <label>العمر<input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></label>
        <label>ملاحظات<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
        <div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setEditing(null)}>إلغاء</button><button className="primary-btn">حفظ التعديل</button></div>
      </form>
    </div>}
  </section>
}
