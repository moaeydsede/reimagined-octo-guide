import { Bell, Calendar, Clock, UserRound } from 'lucide-react'
import { formatShortDate, todayKey } from '../lib/helpers'
import { useClinic } from '../store/ClinicContext'

export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { doctors, selectedDoctor, setDoctor, settings, selectedDate, selectedDateLabel, setSelectedDate } = useClinic()
  const now = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  return <header className="topbar">
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    <div className="topbar-actions">
      <label className="select-wrap"><Calendar size={16}/><input type="date" value={selectedDate} min="2020-01-01" onChange={e => setSelectedDate(e.target.value || todayKey())} title={selectedDateLabel} /></label>
      <span className="date-chip">{formatShortDate(selectedDate)}</span>
      <label className="select-wrap"><Calendar size={16}/><select value={selectedDoctor?.id || ''} disabled={!doctors.length} onChange={e => setDoctor(e.target.value)}>{doctors.length ? doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.room}</option>) : <option value="">لا يوجد أطباء</option>}</select></label>
      <span className="time-chip"><Clock size={16}/>{now}</span>
      <button className="icon-btn" title="الإشعارات"><Bell size={18}/></button>
      <div className="user-chip"><UserRound size={18}/><span>{settings.clinicName}</span></div>
    </div>
  </header>
}
