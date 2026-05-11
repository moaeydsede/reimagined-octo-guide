import { useMemo, useState } from 'react'
import { Edit3, Search, Trash2, UsersRound } from 'lucide-react'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'
import type { Patient } from '../types'

export default function Patients() {
  const { patients, bookings, updatePatient, deletePatient } = useClinic()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Patient | null>(null)
  const filtered = useMemo(() => patients.filter(p => `${p.name} ${p.phone}`.toLowerCase().includes(query.toLowerCase())), [patients, query])
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    updatePatient(editing.id, editing)
    setEditing(null)
  }
  return <section className="page fade-in">
    <Topbar title="إدارة المرضى" subtitle="تعديل أو حذف المرضى، وكل مريض تظهر حجوزاته المرتبطة بكل طبيب" />
    <div className="stats-grid"><StatCard title="المرضى" value={patients.length} icon={<UsersRound />} tone="blue" /><StatCard title="الحجوزات" value={bookings.length} tone="green" /></div>
    <div className="table-card">
      <div className="table-head"><strong>قائمة المرضى</strong><label className="select-wrap"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث باسم المريض أو الهاتف" /></label></div>
      <div className="responsive-table"><table><thead><tr><th>اسم المريض</th><th>الهاتف</th><th>عدد الحجوزات</th><th>آخر طبيب</th><th>إجراءات</th></tr></thead><tbody>{filtered.length === 0 && <tr><td colSpan={5} className="empty-table">لا توجد بيانات مرضى</td></tr>}{filtered.map(p => {
        const patientBookings = bookings.filter(b => b.patientId === p.id)
        const last = patientBookings[patientBookings.length - 1]
        return <tr key={p.id}><td>{p.name}<small>{p.notes || '—'}</small></td><td><a href={`tel:${p.phone}`}>{p.phone}</a></td><td>{patientBookings.length}</td><td>{last ? `${last.doctorName} - ${last.code}` : '—'}</td><td><div className="row-actions"><button title="تعديل" onClick={() => setEditing(p)}><Edit3 size={15}/></button><button title="حذف" onClick={() => window.confirm('حذف المريض سيحذف كل حجوزاته، هل تريد المتابعة؟') && deletePatient(p.id)}><Trash2 size={15}/></button></div></td></tr>
      })}</tbody></table></div>
    </div>
    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}><form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={save}><h2>تعديل بيانات المريض</h2><label>اسم المريض<input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></label><label>رقم الهاتف<input value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></label><label>العمر<input type="number" value={editing.age || ''} onChange={e => setEditing({ ...editing, age: Number(e.target.value) || undefined })} /></label><label>ملاحظات<textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></label><div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setEditing(null)}>إلغاء</button><button className="primary-btn">حفظ التعديل</button></div></form></div>}
  </section>
}
