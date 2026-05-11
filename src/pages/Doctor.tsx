import { ClipboardList, Send, Stethoscope, TimerReset } from 'lucide-react'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'
import { statusLabels, statusTone } from '../types'

export default function Doctor() {
  const { selectedDoctor, visibleBookings, callNext, updateStatus } = useClinic()
  const current = visibleBookings.find(b => b.status === 'called' || b.status === 'in_progress')
  const next = visibleBookings.filter(b => ['waiting', 'postponed'].includes(b.status)).slice(0, 6)
  if (!selectedDoctor) return <section className="page fade-in"><Topbar title="لوحة الطبيب" subtitle="اختر أو أضف طبيبًا للبدء" /><div className="empty-state patient-card"><h2>لا يوجد طبيب محدد</h2><p>أضف طبيبًا وغرفة من صفحة الأطباء، ثم ارجع إلى لوحة الطبيب.</p></div></section>
  return <section className="page fade-in">
    <Topbar title={`لوحة الطبيب - ${selectedDoctor.name}`} subtitle={`واجهة غرفة ${selectedDoctor.room} لبدء الكشف وإنهائه وطلب التالي`} />
    <div className="doctor-layout">
      <div className="current-card">
        <span>المريض الحالي</span>
        <strong>{current?.queueNumber || '—'}</strong>
        <h2>{current?.patientName || 'لا يوجد مريض منادى حاليًا'}</h2>
        {current && <p>{current.visitType} • {current.phone} • كود {current.patientCode}</p>}
        <div className="toolbar centered"><button className="primary-btn" disabled={!current} onClick={() => current && updateStatus(current.id, 'in_progress')}><Stethoscope size={18}/> بدأ الكشف</button><button className="danger-btn" disabled={!current} onClick={() => current && updateStatus(current.id, 'finished')}><TimerReset size={18}/> إنهاء الكشف</button><button className="success-btn" onClick={() => callNext(selectedDoctor.id)}><Send size={18}/> طلب التالي</button></div>
      </div>
      <div className="info-column">
        <StatCard title="عدد المنتظرين" value={next.length} icon={<ClipboardList />} />
        <div className="mini-card"><strong>بيانات الطبيب</strong><p>{selectedDoctor.specialty}</p><p>{selectedDoctor.room}</p><p>كود المرضى: {selectedDoctor.codePrefix}-0001</p><p>متوسط الكشف: {selectedDoctor.averageVisitMinutes} دقيقة</p></div>
      </div>
    </div>
    <div className="table-card"><div className="table-head"><strong>القادمون في الدور</strong><span>{next.length}</span></div><div className="queue-list">{next.length ? next.map(b => <div key={b.id} className="queue-item"><b>{b.queueNumber}</b><span>{b.patientName}<small>كود: {b.patientCode}</small></span><small>{b.visitType}</small><em className={`badge ${statusTone[b.status]}`}>{statusLabels[b.status]}</em></div>) : <div className="empty-state"><p>لا توجد حجوزات منتظرة لهذا الطبيب.</p></div>}</div></div>
  </section>
}
