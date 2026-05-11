import { useMemo } from 'react'
import { BarChart3, CheckCircle2, Clock3, DoorOpen, Percent, Stethoscope, UsersRound } from 'lucide-react'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { durationMinutes } from '../lib/helpers'
import { useClinic } from '../store/ClinicContext'
import { statusLabels, statusTone, type BookingStatus } from '../types'

function Bar({ label, value, max, hint }: { label: string; value: number; max: number; hint?: string }) {
  const pct = max ? Math.max(4, Math.round((value / max) * 100)) : 0
  return <div className="bar-row"><div><strong>{label}</strong><small>{hint}</small></div><span>{value}</span><em><i style={{ width: `${pct}%` }} /></em></div>
}

export default function Analytics() {
  const { dayBookings, bookings, doctors, rooms, patients, globalStats, selectedDateLabel } = useClinic()
  const data = useMemo(() => {
    const byDoctor = doctors.map(doctor => ({
      doctor,
      total: dayBookings.filter(b => b.doctorId === doctor.id).length,
      waiting: dayBookings.filter(b => b.doctorId === doctor.id && ['waiting', 'postponed'].includes(b.status)).length,
      finished: dayBookings.filter(b => b.doctorId === doctor.id && b.status === 'finished').length
    })).filter(item => item.total > 0 || item.doctor.active).sort((a, b) => b.total - a.total)
    const byRoom = rooms.map(room => ({
      room,
      total: dayBookings.filter(b => b.roomId === room.id || b.roomName === room.name).length,
      activeDoctors: doctors.filter(d => d.roomId === room.id).length
    })).filter(item => item.total > 0 || item.room.active).sort((a, b) => b.total - a.total)
    const statusCounts = (Object.keys(statusLabels) as BookingStatus[]).map(status => ({ status, total: dayBookings.filter(b => b.status === status).length }))
    const hourly = Array.from({ length: 15 }, (_, i) => i + 8).map(hour => ({ hour, total: dayBookings.filter(b => Number((b.bookedTime || '00:00').slice(0, 2)) === hour).length }))
    const serviceDurations = dayBookings.map(b => durationMinutes(b.enteredAt, b.finishedAt)).filter(Boolean)
    const avgService = serviceDurations.length ? Math.round(serviceDurations.reduce((a, b) => a + b, 0) / serviceDurations.length) : 0
    const attendance = dayBookings.length ? Math.round((globalStats.finished / Math.max(1, dayBookings.length - globalStats.cancelled)) * 100) : 0
    return { byDoctor, byRoom, statusCounts, hourly, avgService, attendance }
  }, [dayBookings, doctors, rooms, globalStats.finished, globalStats.cancelled])

  const maxDoctor = Math.max(1, ...data.byDoctor.map(d => d.total))
  const maxRoom = Math.max(1, ...data.byRoom.map(r => r.total))
  const maxStatus = Math.max(1, ...data.statusCounts.map(s => s.total))
  const maxHour = Math.max(1, ...data.hourly.map(h => h.total))

  return <section className="page fade-in">
    <Topbar title="التحليلات التشغيلية" subtitle={`مؤشرات اليوم المحدد فقط: ${selectedDateLabel}`} />
    <div className="stats-grid">
      <StatCard title="حجوزات اليوم" value={globalStats.total} hint={`من ${bookings.length} إجمالي`} icon={<BarChart3/>} />
      <StatCard title="إجمالي المرضى" value={patients.length} icon={<UsersRound/>} tone="green" />
      <StatCard title="الأطباء العاملون" value={globalStats.activeDoctors} icon={<Stethoscope/>} tone="purple" />
      <StatCard title="الغرف النشطة اليوم" value={globalStats.activeRooms} icon={<DoorOpen/>} tone="gold" />
      <StatCard title="نسبة الإنجاز" value={`${data.attendance}%`} icon={<Percent/>} tone="teal" />
      <StatCard title="متوسط الكشف" value={data.avgService || '—'} hint={data.avgService ? 'دقيقة' : 'بعد إنهاء أول كشف'} icon={<Clock3/>} tone="red" />
    </div>
    <div className="analytics-grid">
      <div className="chart-card"><div className="chart-head"><h2>الأداء حسب الطبيب</h2><span>{data.byDoctor.length} طبيب</span></div>{data.byDoctor.length ? data.byDoctor.map(item => <Bar key={item.doctor.id} label={item.doctor.name} value={item.total} max={maxDoctor} hint={`${item.waiting} منتظر • ${item.finished} تم الكشف`} />) : <div className="empty-state"><p>لا توجد بيانات أطباء في اليوم المحدد.</p></div>}</div>
      <div className="chart-card"><div className="chart-head"><h2>الأداء حسب الغرفة</h2><span>{data.byRoom.length} غرفة</span></div>{data.byRoom.length ? data.byRoom.map(item => <Bar key={item.room.id} label={item.room.name} value={item.total} max={maxRoom} hint={`${item.activeDoctors} طبيب مرتبط`} />) : <div className="empty-state"><p>لا توجد بيانات غرف في اليوم المحدد.</p></div>}</div>
      <div className="chart-card"><div className="chart-head"><h2>توزيع الحالات</h2><span>اليوم المحدد</span></div>{data.statusCounts.map(item => <div key={item.status} className="status-bar"><span className={`badge ${statusTone[item.status]}`}>{statusLabels[item.status]}</span><em><i style={{ width: `${maxStatus ? Math.max(4, Math.round((item.total / maxStatus) * 100)) : 0}%` }} /></em><b>{item.total}</b></div>)}</div>
      <div className="chart-card"><div className="chart-head"><h2>توزيع المواعيد بالساعة</h2><span>حسب ساعة الحجز</span></div><div className="hour-grid">{data.hourly.map(item => <div key={item.hour}><span>{item.hour}</span><em style={{ height: `${maxHour ? Math.max(8, Math.round((item.total / maxHour) * 90)) : 8}px` }} /><b>{item.total}</b></div>)}</div></div>
    </div>
  </section>
}
