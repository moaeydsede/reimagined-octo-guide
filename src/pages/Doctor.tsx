import { CalendarDays, ClipboardList, PlayCircle, Send, Stethoscope, TimerReset } from 'lucide-react'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { describeScheduleForDate, estimateMinutes } from '../lib/helpers'
import { useClinic } from '../store/ClinicContext'
import { statusLabels, statusTone } from '../types'

export default function Doctor() {
  const { selectedDoctor, visibleBookings, callNext, updateStatus, bookings, stats, selectedDate, selectedDateLabel } = useClinic()
  const current = visibleBookings.find(b => b.status === 'called' || b.status === 'in_progress')
  const next = visibleBookings.filter(b => ['waiting', 'postponed'].includes(b.status)).slice(0, 8)
  if (!selectedDoctor) return <section className="page fade-in"><Topbar title="لوحة الطبيب" subtitle="اختر أو أضف طبيبًا للبدء" /><div className="empty-state patient-card"><h2>لا يوجد طبيب محدد</h2><p>أضف طبيبًا وغرفة وجدول عمل من صفحة الأطباء، ثم ارجع إلى لوحة الطبيب.</p></div></section>
  const expectedMinutes = current ? estimateMinutes(bookings, current, selectedDoctor.averageVisitMinutes) : 0
  const schedule = describeScheduleForDate(selectedDoctor, selectedDate)
  return <section className="page fade-in">
    <Topbar title={`لوحة الطبيب - ${selectedDoctor.name}`} subtitle={`حجوزات ${selectedDateLabel} فقط • ${schedule}`} />
    <div className="doctor-layout">
      <div className="current-card pro-current">
        <span>المريض الحالي في اليوم المحدد</span>
        <strong>{current?.queueNumber || '—'}</strong>
        <h2>{current?.patientName || 'لا يوجد مريض منادى حاليًا'}</h2>
        {current && <p>{current.visitType} • {current.phone} • كود {current.patientCode} • موعد {current.bookedTime} • {statusLabels[current.status]}</p>}
        <div className="toolbar centered"><button className="primary-btn" disabled={!current} onClick={() => current && updateStatus(current.id, 'in_progress')}><Stethoscope size={18}/> بدأ الكشف</button><button className="danger-btn" disabled={!current} onClick={() => current && updateStatus(current.id, 'finished')}><TimerReset size={18}/> إنهاء الكشف</button><button className="success-btn" onClick={() => callNext(selectedDoctor.id)}><Send size={18}/> طلب التالي</button></div>
      </div>
      <div className="info-column">
        <StatCard title="عدد المنتظرين" value={next.length} icon={<ClipboardList />} />
        <StatCard title="متوسط الكشف" value={stats.averageServiceMinutes || selectedDoctor.averageVisitMinutes} hint="دقيقة" icon={<TimerReset />} tone="gold" />
        <div className="mini-card"><strong>بيانات اليوم</strong><p><CalendarDays size={14}/> {selectedDateLabel}</p><p>{selectedDoctor.specialty}</p><p>{selectedDoctor.room}</p><p>كود المرضى: {selectedDoctor.codePrefix}-0001</p><p>جدول العمل: {schedule}</p><p>وقت تقريبي للحالي: {expectedMinutes} دقيقة</p></div>
      </div>
    </div>
    <div className="table-card"><div className="table-head"><strong>القادمون في الدور لهذا اليوم</strong><span>{next.length}</span></div><div className="queue-list">{next.length ? next.map(b => <div key={b.id} className="queue-item"><b>{b.queueNumber}</b><span>{b.patientName}<small>كود: {b.patientCode}</small></span><small>{b.visitType} • {b.bookedTime}</small><em className={`badge ${statusTone[b.status]}`}>{statusLabels[b.status]}</em></div>) : <div className="empty-state"><PlayCircle size={36}/><p>لا توجد حجوزات منتظرة لهذا الطبيب في اليوم المحدد.</p></div>}</div></div>
  </section>
}
