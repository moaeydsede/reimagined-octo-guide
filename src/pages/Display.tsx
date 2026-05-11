import { CalendarDays, Monitor, Stethoscope } from 'lucide-react'
import { useClinic } from '../store/ClinicContext'

export default function Display() {
  const { selectedDoctor, visibleBookings, settings, selectedDateLabel } = useClinic()
  const current = visibleBookings.find(b => b.status === 'called' || b.status === 'in_progress')
  const upcoming = visibleBookings.filter(b => ['waiting', 'postponed'].includes(b.status)).slice(0, 6)
  return <section className="display-screen fade-in">
    <div className="display-top"><div><strong>{settings.clinicName}</strong><span>{settings.branchName} • شاشة انتظار المرضى</span></div><div><Monitor size={42}/></div></div>
    <div className="display-main">
      <span>{selectedDoctor ? `${selectedDoctor.name} • ${selectedDoctor.room}` : 'اختر طبيبًا من الشريط العلوي'}</span>
      <small className="display-date"><CalendarDays size={18}/> {selectedDateLabel}</small>
      <strong>{current?.queueNumber || '—'}</strong>
      <h1>{current?.patientName || 'لا يوجد نداء الآن'}</h1>
      <p>{current ? `كود المريض ${current.patientCode} • موعد ${current.bookedTime}` : 'سيظهر رقم الدور فور نداء المريض من الاستقبال أو الطبيب لليوم المحدد'}</p>
    </div>
    <div className="display-bottom-grid">
      <div className="upcoming-strip"><span>الأرقام القادمة اليوم</span><div>{upcoming.length ? upcoming.map(b => <b key={b.id}>{b.queueNumber}</b>) : <small>لا توجد أرقام منتظرة</small>}</div></div>
      <div className="display-room"><Stethoscope/><span>الغرفة</span><strong>{selectedDoctor?.room || '—'}</strong></div>
    </div>
  </section>
}
