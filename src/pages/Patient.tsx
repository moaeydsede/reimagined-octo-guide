import { useState } from 'react'
import { Clock, Search, ShieldCheck, Ticket, UserCheck } from 'lucide-react'
import Brand from '../components/Brand'
import StatCard from '../components/StatCard'
import { estimateMinutes } from '../lib/helpers'
import { useClinic } from '../store/ClinicContext'
import { statusLabels } from '../types'

export default function Patient() {
  const { findBooking, visibleBookings, doctors, bookings } = useClinic()
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const booking = searched ? findBooking(query) : undefined
  const doctor = booking ? doctors.find(d => d.id === booking.doctorId) : undefined
  const current = booking ? bookings.find(b => b.doctorId === booking.doctorId && ['called', 'in_progress'].includes(b.status)) : visibleBookings.find(b => ['called', 'in_progress'].includes(b.status))
  const remaining = booking ? bookings.filter(b => b.doctorId === booking.doctorId && ['waiting', 'called', 'in_progress', 'postponed'].includes(b.status) && b.queueNumber < booking.queueNumber).length : 0
  const minutes = booking ? estimateMinutes(bookings, booking, doctor?.averageVisitMinutes || 10) : 0
  return <section className="patient-page fade-in">
    <div className="patient-card search-panel">
      <Brand />
      <h1>متابعة الدور</h1>
      <p>أدخل رقم الهاتف أو كود الحجز لمعرفة رقم دورك والرقم الحالي.</p>
      <div className="search-box"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="رقم الهاتف أو كود الحجز" onKeyDown={e => e.key === 'Enter' && setSearched(true)} /><button onClick={() => setSearched(true)}><Search size={18}/> عرض دوري</button></div>
    </div>
    {searched && !booking && <div className="patient-card empty-state"><ShieldCheck size={40}/><h2>لم يتم العثور على حجز</h2><p>تأكد من رقم الهاتف أو كود الحجز المسجل في الاستقبال.</p></div>}
    {booking && <div className="patient-result">
      <div className="patient-card result-header"><span>مرحبًا {booking.patientName}</span><strong>{statusLabels[booking.status]}</strong><p>{doctor?.name} • {doctor?.room}</p></div>
      <div className="stats-grid patient-stats">
        <StatCard title="رقم دورك" value={booking.queueNumber} icon={<Ticket />} tone="green" />
        <StatCard title="الرقم الحالي" value={current?.queueNumber || '—'} icon={<UserCheck />} tone="blue" />
        <StatCard title="المتبقي أمامك" value={remaining} hint="مريض" icon={<Clock />} tone="gold" />
        <StatCard title="الوقت المتوقع" value={minutes} hint="دقيقة" icon={<Clock />} tone="purple" />
      </div>
      <div className="patient-alert">{booking.status === 'called' ? 'تم نداء دورك الآن، برجاء التوجه إلى غرفة الكشف.' : booking.status === 'skipped' ? 'تم تخطي دورك مؤقتًا لعدم التواجد، برجاء التواصل مع الاستقبال.' : booking.status === 'postponed' ? 'تم تأجيل دورك مؤقتًا وسيتم نداؤك لاحقًا.' : 'سيتم تنبيهك عند اقتراب دورك.'}</div>
    </div>}
  </section>
}
