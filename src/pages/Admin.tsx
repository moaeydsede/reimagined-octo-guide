import { BarChart3, CheckCircle2, Clock3, DoorOpen, SkipForward, Timer, UsersRound } from 'lucide-react'
import AddBookingForm from '../components/AddBookingForm'
import BookingTable from '../components/BookingTable'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'

export default function Admin() {
  const { stats, visibleBookings, callNext, selectedDoctor, doctors } = useClinic()
  const activeRooms = new Set(doctors.filter(d => d.active).map(d => d.room).filter(Boolean)).size
  return <section className="page fade-in">
    <Topbar title="لوحة الإدارة والاستقبال" subtitle="إدارة حجوزات كل طبيب وغرفة بشكل مستقل مع أكواد مرضى خاصة بكل طبيب" />
    <div className="stats-grid">
      <StatCard title="إجمالي الحجوزات" value={stats.total} hint="للطبيب المحدد" icon={<UsersRound />} tone="blue" />
      <StatCard title="المنتظرين" value={stats.waiting} hint="في قائمة الانتظار" icon={<Clock3 />} tone="green" />
      <StatCard title="تم الكشف" value={stats.finished} hint="مريض" icon={<CheckCircle2 />} tone="teal" />
      <StatCard title="المتخطين" value={stats.skipped} hint="مريض" icon={<SkipForward />} tone="red" />
      <StatCard title="الغرف النشطة" value={activeRooms} hint="غرفة" icon={<DoorOpen />} tone="purple" />
      <StatCard title="الرقم الحالي" value={stats.currentNumber || '—'} hint={selectedDoctor?.name || 'لا يوجد طبيب'} icon={<BarChart3 />} tone="gold" />
    </div>
    {!doctors.length && <div className="inline-alert wide">ابدأ من صفحة الأطباء: أضف طبيبًا، غرفة، وبادئة أكواد. بعدها يمكنك إنشاء حجوزات فارغة بدون أي بيانات تجريبية.</div>}
    <div className="toolbar"><AddBookingForm /><button className="success-btn" disabled={!selectedDoctor} onClick={() => callNext()}>نداء التالي</button><span className="toolbar-note"><Timer size={16}/> كل طبيب له دور وكود مرضى مستقلان</span></div>
    <BookingTable bookings={visibleBookings} />
  </section>
}
