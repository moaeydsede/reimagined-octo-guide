import { BarChart3, CheckCircle2, Clock3, UsersRound, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Section, StatCard, StatusBadge } from '../components/Cards';
import { AppShell } from '../components/Shell';
import { useBookings, useDoctors, useStats } from '../hooks/useClinic';
import { todayKey } from '../utils';

export function ReportsPage() {
  const [date, setDate] = useState(todayKey());
  const { activeDoctors } = useDoctors();
  const [doctorId, setDoctorId] = useState('all');
  const selected = doctorId === 'all' ? null : doctorId;
  const { bookings } = useBookings(date, selected);
  const stats = useStats(bookings);
  const peak = bookings.reduce<Record<string, number>>((acc, b) => {
    const hour = b.createdAt?.toDate?.().getHours?.() ?? 0;
    acc[`${hour}:00`] = (acc[`${hour}:00`] || 0) + 1;
    return acc;
  }, {});
  const peakEntries = Object.entries(peak) as [string, number][];
  const max = Math.max(1, ...Object.values(peak));

  return (
    <AppShell title="التقارير والإحصائيات" subtitle="متابعة أداء اليوم والحضور والتخطي والانتظار">
      <div className="stats-grid compact-stats">
        <StatCard label="إجمالي الحجوزات" value={stats.total} hint="حسب الفلتر" icon={<UsersRound />} />
        <StatCard label="نسبة الحضور" value={`${stats.attendance}%`} hint="تقريبية" icon={<CheckCircle2 />} />
        <StatCard label="منتظرين" value={stats.waiting} hint="لم يتم النداء" icon={<Clock3 />} />
        <StatCard label="لم يحضر/تخطي" value={stats.skipped + stats.noShow} hint="تحتاج متابعة" icon={<XCircle />} />
      </div>
      <Section title="فلترة التقرير" action={<><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /><select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}><option value="all">كل الأطباء</option>{activeDoctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></>}>
        <div className="report-grid">
          <div className="chart-card">
            <h3><BarChart3 size={18} /> توزيع الحجوزات خلال اليوم</h3>
            <div className="bar-chart">{peakEntries.sort().map(([hour, value]) => <div className="bar-row" key={hour}><span>{hour}</span><div><i style={{ width: `${(value / max) * 100}%` }} /></div><b>{value}</b></div>)}</div>
          </div>
          <div className="chart-card">
            <h3>توزيع الحالات</h3>
            <div className="status-summary">
              {(['waiting','called','in_progress','finished','skipped','postponed','cancelled','no_show'] as const).map((s) => <div key={s}><StatusBadge status={s} /><strong>{bookings.filter((b) => b.status === s).length}</strong></div>)}
            </div>
          </div>
        </div>
      </Section>
    </AppShell>
  );
}
