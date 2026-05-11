import { BarChart3, CheckCircle2, Clock3, DoorOpen, SkipForward, Timer, UserCheck, UsersRound } from 'lucide-react'
import AddBookingForm from '../components/AddBookingForm'
import BookingTable from '../components/BookingTable'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'
import { statusLabels, statusTone } from '../types'

export default function Admin() {
  const { stats, globalStats, visibleBookings, dayBookings, callNext, selectedDoctor, doctors, rooms, bookings, selectedDateLabel, workingDoctorsForSelectedDate } = useClinic()
  const current = visibleBookings.find(b => ['called', 'in_progress'].includes(b.status))
  const activeRooms = rooms.filter(r => r.active).length || new Set(doctors.filter(d => d.active).map(d => d.room).filter(Boolean)).size
  const liveDoctors = workingDoctorsForSelectedDate.filter(d => dayBookings.some(b => b.doctorId === d.id && ['waiting', 'called', 'in_progress', 'postponed'].includes(b.status))).length
  return <section className="page fade-in">
    <Topbar title="لوحة الاستقبال المركزية" subtitle="إدارة حجوزات اليوم المحدد حسب مواعيد عمل كل طبيب وساعات الحجز المتاحة" />
    <div className="ops-strip">
      <div><span>الطبيب المحدد</span><strong>{selectedDoctor?.name || 'لم يتم اختيار طبيب'}</strong><small>{selectedDoctor ? `${selectedDoctor.specialty} • ${selectedDoctor.room}` : 'أضف طبيبًا للبدء'}</small></div>
      <div><span>المريض الحالي</span><strong>{current ? `#${current.queueNumber}` : '—'}</strong><small>{current?.patientName || 'لا يوجد نداء حالي'}</small></div>
      <div><span>اليوم المحدد</span><strong>{globalStats.total}</strong><small>{selectedDateLabel} • {liveDoctors} طبيب لديهم قائمة انتظار</small></div>
    </div>
    <div className="stats-grid">
      <StatCard title="حجوزات الطبيب" value={stats.total} hint="للطبيب المحدد" icon={<UsersRound />} tone="blue" />
      <StatCard title="المنتظرين" value={stats.waiting + stats.postponed} hint="في قائمة الانتظار" icon={<Clock3 />} tone="green" />
      <StatCard title="داخل/تم النداء" value={stats.called + stats.inProgress} hint="مريض" icon={<UserCheck />} tone="purple" />
      <StatCard title="تم الكشف" value={stats.finished} hint="مريض" icon={<CheckCircle2 />} tone="teal" />
      <StatCard title="الغرف النشطة" value={activeRooms} hint="غرفة" icon={<DoorOpen />} tone="purple" />
      <StatCard title="الرقم الحالي" value={stats.currentNumber || '—'} hint={selectedDoctor?.name || 'لا يوجد طبيب'} icon={<BarChart3 />} tone="gold" />
    </div>
    {!doctors.length && <div className="inline-alert wide">ابدأ من صفحة الغرف ثم صفحة الأطباء: أضف غرفة وطبيبًا وبادئة أكواد وجدول عمل أسبوعي. بعدها يمكن إنشاء حجوزات حسب اليوم والساعة.</div>}
    <div className="toolbar"><AddBookingForm /><button className="success-btn" disabled={!selectedDoctor} onClick={() => callNext()}>نداء التالي</button><span className="toolbar-note"><Timer size={16}/> النداء والحالات تظهر فقط ليوم الحجز المحدد</span></div>
    {visibleBookings.length > 0 && <div className="kanban-strip">
      {visibleBookings.filter(b => ['called', 'in_progress', 'waiting', 'postponed'].includes(b.status)).slice(0, 8).map(b => <div key={b.id} className="mini-ticket"><b>#{b.queueNumber}</b><span>{b.patientName}</span><small>{b.patientCode}</small><em className={`badge ${statusTone[b.status]}`}>{statusLabels[b.status]}</em></div>)}
    </div>}
    <BookingTable bookings={visibleBookings} />
  </section>
}
