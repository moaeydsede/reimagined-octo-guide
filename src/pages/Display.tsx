import { useEffect, useState } from 'react'
import { useClinic } from '../store/ClinicContext'

export default function Display() {
  const { selectedDoctor, visibleBookings } = useClinic()
  const [time, setTime] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id) }, [])
  const current = visibleBookings.find(b => b.status === 'called' || b.status === 'in_progress')
  const upcoming = visibleBookings.filter(b => ['waiting', 'postponed'].includes(b.status)).slice(0, 5)
  return <section className="display-screen fade-in">
    <div className="display-top"><div><strong>عيادات المشفى</strong><span>{selectedDoctor ? `${selectedDoctor.name} - ${selectedDoctor.room}` : 'لا يوجد طبيب محدد'}</span></div><div>{time.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div></div>
    <div className="display-main">
      <span>الدور الحالي</span>
      <strong>{current?.queueNumber || '—'}</strong>
      <h1>{current?.patientName || 'في انتظار النداء'}</h1>
      <p>{selectedDoctor ? `برجاء التوجه إلى ${selectedDoctor.room}` : 'أضف طبيبًا وحجوزات للعرض'}</p>
    </div>
    <div className="upcoming-strip"><span>الأدوار القادمة</span><div>{upcoming.length ? upcoming.map(b => <b key={b.id}>{b.queueNumber}</b>) : <small>لا توجد أدوار قادمة</small>}</div></div>
  </section>
}
