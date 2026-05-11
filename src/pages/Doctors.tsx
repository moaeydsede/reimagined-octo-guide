import { useState } from 'react'
import { Plus, Stethoscope } from 'lucide-react'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'

export default function Doctors() {
  const { doctors, addDoctor, toggleDoctor } = useClinic()
  const [form, setForm] = useState({ name: '', specialty: '', room: '', averageVisitMinutes: 10, active: true })
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form.name || !form.specialty) return; addDoctor(form); setForm({ name: '', specialty: '', room: '', averageVisitMinutes: 10, active: true }) }
  return <section className="page fade-in">
    <Topbar title="إدارة الأطباء" subtitle="إضافة الأطباء والغرف ومتوسط وقت الكشف" />
    <div className="stats-grid"><StatCard title="الأطباء" value={doctors.length} icon={<Stethoscope />} /><StatCard title="المتاحون" value={doctors.filter(d => d.active).length} tone="green" /></div>
    <div className="split-layout">
      <form className="panel-card" onSubmit={submit}><h2>إضافة طبيب</h2><label>اسم الطبيب<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="د. أحمد محمد" /></label><label>التخصص<input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="باطنة / أطفال / عظام" /></label><label>الغرفة<input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="غرفة 1" /></label><label>متوسط وقت الكشف<input type="number" value={form.averageVisitMinutes} onChange={e => setForm({ ...form, averageVisitMinutes: Number(e.target.value) })} /></label><button className="primary-btn"><Plus size={18}/> إضافة الطبيب</button></form>
      <div className="table-card"><div className="table-head"><strong>قائمة الأطباء</strong><span>{doctors.length}</span></div><div className="doctor-cards">{doctors.map(d => <div key={d.id} className="doctor-card"><div><strong>{d.name}</strong><span>{d.specialty} • {d.room}</span><small>{d.averageVisitMinutes} دقيقة للكشف</small></div><button className={d.active ? 'success-btn small' : 'ghost-btn small'} onClick={() => toggleDoctor(d.id)}>{d.active ? 'متاح' : 'متوقف'}</button></div>)}</div></div>
    </div>
  </section>
}
