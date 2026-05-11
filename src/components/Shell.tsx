import { BarChart3, CalendarDays, DoorOpen, Home, LayoutDashboard, LogIn, Monitor, Settings, Smartphone, Stethoscope, UsersRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import Brand from './Brand'

const links = [
  { to: '/', label: 'الرئيسية', icon: Home },
  { to: '/admin', label: 'الاستقبال', icon: LayoutDashboard },
  { to: '/doctor', label: 'الطبيب', icon: Stethoscope },
  { to: '/analytics', label: 'التحليلات', icon: BarChart3 },
  { to: '/patient', label: 'المريض', icon: UsersRound },
  { to: '/display', label: 'شاشة الانتظار', icon: Monitor },
  { to: '/mobile', label: 'الموبايل', icon: Smartphone },
  { to: '/admin/doctors', label: 'الأطباء', icon: CalendarDays },
  { to: '/admin/rooms', label: 'الغرف', icon: DoorOpen },
  { to: '/admin/patients', label: 'المرضى', icon: UsersRound },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
  { to: '/login', label: 'تسجيل الدخول', icon: LogIn }
]

export default function Shell() {
  return <div className="app-shell">
    <aside className="sidebar">
      <Brand />
      <nav>
        {links.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'}>
          <item.icon size={19} />
          <span>{item.label}</span>
        </NavLink>)}
      </nav>
      <div className="sidebar-card">
        <strong>نسخة احترافية</strong>
        <span>غرف، أطباء، أكواد مرضى مستقلة، تحليلات، تصدير واستيراد.</span>
      </div>
    </aside>
    <main className="main-panel"><Outlet /></main>
  </div>
}
