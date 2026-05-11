import { BarChart3, CheckCircle2, Clock3, SkipForward, Timer, UsersRound } from 'lucide-react'
import AddBookingForm from '../components/AddBookingForm'
import BookingTable from '../components/BookingTable'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'

export default function Admin() {
  const { stats, visibleBookings, callNext, selectedDoctor, resetDemo } = useClinic()
  return <section className="page fade-in">
    <Topbar title="لوحة الإدارة والاستقبال" subtitle="إدارة الحجوزات، نداء الأدوار، التخطي، التأجيل، والمتابعة اللحظية" />
    <div className="stats-grid">
      <StatCard title="إجمالي الحجوزات" value={stats.total} hint="اليوم" icon={<UsersRound />} tone="blue" />
      <StatCard title="المنتظرين" value={stats.waiting} hint="في قائمة الانتظار" icon={<Clock3 />} tone="green" />
      <StatCard title="تم الكشف" value={stats.finished} hint="مريض" icon={<CheckCircle2 />} tone="teal" />
      <StatCard title="المتخطين" value={stats.skipped} hint="مريض" icon={<SkipForward />} tone="red" />
      <StatCard title="المؤجلين" value={stats.postponed} hint="مؤقت" icon={<Timer />} tone="purple" />
      <StatCard title="الرقم الحالي" value={stats.currentNumber || '—'} hint={selectedDoctor?.name} icon={<BarChart3 />} tone="gold" />
    </div>
    <div className="toolbar"><AddBookingForm /><button className="success-btn" onClick={() => callNext()}>نداء التالي</button><button className="ghost-btn" onClick={resetDemo}>تحديث البيانات</button></div>
    <BookingTable bookings={visibleBookings} />
  </section>
}
