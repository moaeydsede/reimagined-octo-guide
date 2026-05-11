import { Bell, CalendarCheck, Home, Plus, Search, Settings, Smartphone } from 'lucide-react'
import { useClinic } from '../store/ClinicContext'
import { statusLabels } from '../types'

export default function Mobile() {
  const { stats, visibleBookings, selectedDoctor } = useClinic()
  return <section className="mobile-showcase fade-in">
    <div className="phone-frame">
      <div className="phone-notch" />
      <div className="mobile-header"><strong>عيادات المشفى</strong><Bell size={18}/></div>
      <div className="mobile-greeting"><span>{selectedDoctor?.room || 'اختر طبيبًا'}</span><h2>لوحة الموبايل</h2></div>
      <div className="mobile-stats"><div><span>الحجوزات</span><b>{stats.total}</b></div><div><span>المنتظرين</span><b>{stats.waiting}</b></div><div><span>الحالي</span><b>{stats.currentNumber || '—'}</b></div><div><span>تم الكشف</span><b>{stats.finished}</b></div></div>
      <div className="mobile-list"><strong>حجوزات اليوم</strong>{visibleBookings.length ? visibleBookings.slice(0, 5).map(b => <div key={b.id}><b>{b.queueNumber}</b><span>{b.patientName}</span><small>{statusLabels[b.status]}</small></div>) : <p>لا توجد حجوزات.</p>}</div>
      <div className="mobile-nav"><Home/><CalendarCheck/><button><Plus/></button><Search/><Settings/></div>
    </div>
    <div className="mobile-copy"><Smartphone size={44}/><h1>برنامج موبايل احترافي</h1><p>واجهة موبايل قابلة للتثبيت، تعرض حجوزات الطبيب والغرفة المحددين بنفس أكواد المرضى المستقلة.</p></div>
  </section>
}
