import { useEffect, useState } from 'react'
import { useClinic } from '../store/ClinicContext'

export default function Display() {
  const { doctors, selectedDoctor, visibleBookings, bookings, setDoctor } = useClinic()
  const [time, setTime] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id) }, [])
  const current = visibleBookings.find(b => b.status === 'called' || b.status === 'in_progress')
  const upcoming = visibleBookings.filter(b => ['waiting', 'postponed'].includes(b.status)).slice(0, 5)
  return <section className="display-screen fade-in">
    <div className="display-top"><div><strong>عيادات المشفى</strong><span>{selectedDoctor ? `${selectedDoctor.name} - ${selectedDoctor.room} - كود ${selectedDoctor.codePrefix}` : 'لم يتم اختيار طبيب'}</span></div><div>{time.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div></div>
    {doctors.length > 0 && <div className="display-doctor-tabs">{doctors.map(d => <button key={d.id} className={selectedDoctor?.id === d.id ? 'active' : ''} onClick={() => setDoctor(d.id)}>{d.name}<small>{d.room}</small></button>)}</div>}
    <div className="display-main">
      <span>الدور الحالي</span>
      <strong>{current?.queueNumber || '—'}</strong>
      <h1>{current?.patientName || 'في انتظار النداء'}</h1>
      <p>{current ? `برجاء التوجه إلى ${current.doctorRoom}` : 'اختر الطبيب من الأعلى أو ابدأ نداء الدور من الإدارة'}</p>
    </div>
    <div className="upcoming-strip"><span>الأدوار القادمة للطبيب المحدد</span><div>{upcoming.length ? upcoming.map(b => <b key={b.id}>{b.queueNumber}</b>) : <em>لا توجد أدوار قادمة</em>}</div></div>
    <div className="room-overview">{doctors.map(d => {
      const active = bookings.find(b => b.doctorId === d.id && ['called', 'in_progress'].includes(b.status))
      const wait = bookings.filter(b => b.doctorId === d.id && ['waiting', 'postponed'].includes(b.status)).length
      return <div key={d.id}><strong>{d.room}</strong><span>{d.name}</span><b>{active?.code || '—'}</b><small>{wait} منتظر</small></div>
    })}</div>
  </section>
}
