import { ClipboardList, Send, Stethoscope, TimerReset } from 'lucide-react'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'
import { statusLabels, statusTone } from '../types'

export default function Doctor() {
  const { selectedDoctor, visibleBookings, callNext, updateStatus } = useClinic()
  const current = visibleBookings.find(b => b.status === 'called' || b.status === 'in_progress')
  const next = visibleBookings.filter(b => ['waiting', 'postponed'].includes(b.status)).slice(0, 6)
  return <section className="page fade-in">
    <Topbar title={`لوحة الطبيب - ${selectedDoctor?.name || ''}`} subtitle="واجهة الطبيب لبدء الكشف وإنهائه وطلب التالي" />
    <div className="doctor-layout">
      <div className="current-card">
        <span>المريض الحالي</span>
        <strong>{current?.queueNumber || '—'}</strong>
        <h2>{current?.patientName || 'لا يوجد مريض منادى حاليًا'}</h2>
        {current && <p>{current.visitType} • {current.phone}</p>}
        <div className="toolbar centered"><button className="primary-btn" onClick={() => current && updateStatus(current.id, 'in_progress')}><Stethoscope size={18}/> بدأ الكشف</button><button className="danger-btn" onClick={() => current && updateStatus(current.id, 'finished')}><TimerReset size={18}/> إنهاء الكشف</button><button className="success-btn" onClick={() => callNext(selectedDoctor.id)}><Send size={18}/> طلب التالي</button></div>
      </div>
      <div className="info-column">
        <StatCard title="عدد المنتظرين" value={next.length} icon={<ClipboardList />} />
        <div className="mini-card"><strong>بيانات الطبيب</strong><p>{selectedDoctor?.specialty}</p><p>{selectedDoctor?.room}</p><p>متوسط الكشف: {selectedDoctor?.averageVisitMinutes} دقيقة</p></div>
      </div>
    </div>
    <div className="table-card"><div className="table-head"><strong>القادمون في الدور</strong><span>{next.length}</span></div><div className="queue-list">{next.map(b => <div key={b.id} className="queue-item"><b>{b.queueNumber}</b><span>{b.patientName}</span><small>{b.visitType}</small><em className={`badge ${statusTone[b.status]}`}>{statusLabels[b.status]}</em></div>)}</div></div>
  </section>
}
