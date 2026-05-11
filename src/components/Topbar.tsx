import { Bell, Calendar, UserRound } from 'lucide-react'
import { useClinic } from '../store/ClinicContext'

export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { doctors, selectedDoctor, setDoctor } = useClinic()
  return <header className="topbar">
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    <div className="topbar-actions">
      <label className="select-wrap"><Calendar size={16}/><select value={selectedDoctor?.id || ''} disabled={!doctors.length} onChange={e => setDoctor(e.target.value)}>{doctors.length ? doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.room}</option>) : <option value="">لا يوجد أطباء</option>}</select></label>
      <button className="icon-btn"><Bell size={18}/></button>
      <div className="user-chip"><UserRound size={18}/><span>مدير النظام</span></div>
    </div>
  </header>
}
