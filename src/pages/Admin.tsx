import { BarChart3, CheckCircle2, Clock3, DoorOpen, SkipForward, Timer, UsersRound } from 'lucide-react'
import AddBookingForm from '../components/AddBookingForm'
import BookingTable from '../components/BookingTable'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'

export default function Admin() {
  const { stats, visibleBookings, callNext, selectedDoctor, doctors, bookings } = useClinic()
  const activeRooms = doctors.filter(d => d.active).length
  return <section className="page fade-in">
    <Topbar title="لوحة الإدارة والاستقبال" subtitle="إدارة أكثر من طبيب وأكثر من غرفة مع كود مستقل لكل طبيب" />
    <div className="stats-grid">
      <StatCard title="إجمالي حجوزات الطبيب" value={stats.total} hint={selectedDoctor?.name || 'أضف طبيبًا أولًا'} icon={<UsersRound />} tone="blue" />
      <StatCard title="المنتظرين" value={stats.waiting} hint="في قائمة الانتظار" icon={<Clock3 />} tone="green" />
      <StatCard title="تم الكشف" value={stats.finished} hint="مريض" icon={<CheckCircle2 />} tone="teal" />
      <StatCard title="المتخطين" value={stats.skipped} hint="مريض" icon={<SkipForward />} tone="red" />
      <StatCard title="المؤجلين" value={stats.postponed} hint="مؤقت" icon={<Timer />} tone="purple" />
      <StatCard title="الغرف النشطة" value={activeRooms} hint={`${bookings.length} حجز إجمالي`} icon={<DoorOpen />} tone="gold" />
      <StatCard title="الرقم الحالي" value={stats.currentNumber || '—'} hint={selectedDoctor?.codePrefix || '—'} icon={<BarChart3 />} tone="blue" />
    </div>
    {doctors.length === 0 && <div className="panel-card empty-state"><h2>النظام فارغ الآن</h2><p>ابدأ بإضافة طبيب من صفحة الأطباء، ثم أضف الحجوزات. لا توجد أي أسماء تجريبية داخل النظام.</p></div>}
    <div className="toolbar"><AddBookingForm /><button className="success-btn" onClick={() => callNext()} disabled={!selectedDoctor}>نداء التالي للطبيب المحدد</button></div>
    <BookingTable bookings={visibleBookings} />
  </section>
}
