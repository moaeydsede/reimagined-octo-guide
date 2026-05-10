import { Activity, BarChart3, CalendarDays, Display, Home, LogOut, Menu, MonitorSmartphone, Settings, Stethoscope, UserCog, UsersRound, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { APP_NAME } from '../config';
import { useAuth } from '../hooks/useAuth';

export function AppShell({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  const { appUser, logout, role } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: 'الرئيسية', icon: <Home size={18} /> },
    { to: '/admin', label: 'الإدارة', icon: <Activity size={18} />, roles: ['admin', 'reception'] },
    { to: '/admin/doctors', label: 'الأطباء', icon: <Stethoscope size={18} />, roles: ['admin', 'reception'] },
    { to: '/doctor', label: 'لوحة الطبيب', icon: <UserCog size={18} />, roles: ['admin', 'reception', 'doctor'] },
    { to: '/reports', label: 'التقارير', icon: <BarChart3 size={18} />, roles: ['admin', 'reception'] },
    { to: '/display', label: 'شاشة الانتظار', icon: <Display size={18} /> },
    { to: '/patient', label: 'رابط المريض', icon: <MonitorSmartphone size={18} /> }
  ].filter((l) => !l.roles || l.roles.includes(role || ''));

  return (
    <div className="app-shell">
      <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="فتح القائمة"><Menu /></button>
      <aside className={`sidebar ${open ? 'show' : ''}`}>
        <button className="close-sidebar" onClick={() => setOpen(false)} aria-label="إغلاق"><X /></button>
        <div className="brand">
          <div className="brand-icon">+</div>
          <div>
            <strong>{APP_NAME}</strong>
            <small>نظام العيادات الذكي</small>
          </div>
        </div>
        <nav className="nav">
          {links.map((link) => <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>{link.icon}<span>{link.label}</span></NavLink>)}
        </nav>
        <div className="sidebar-card">
          <UsersRound size={20} />
          <div>
            <strong>تحديث لحظي</strong>
            <small>Firebase Firestore Live</small>
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="user-mini">
            <div className="avatar">{appUser?.name?.slice(0, 1) || 'م'}</div>
            <div>
              <strong>{appUser?.name || 'مستخدم'}</strong>
              <small>{role === 'admin' ? 'مدير النظام' : role === 'reception' ? 'استقبال' : 'طبيب'}</small>
            </div>
          </div>
          <button className="ghost-button" onClick={logout}><LogOut size={17} /> تسجيل الخروج</button>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow"><CalendarDays size={15} /> {new Date().toLocaleDateString('ar-EG')}</span>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="top-actions">{action}<NavLink className="chip" to="/settings"><Settings size={16} /> إعدادات</NavLink></div>
        </header>
        {children}
      </main>
    </div>
  );
}

export function PublicHeader() {
  return (
    <header className="public-header">
      <div className="brand compact"><div className="brand-icon">+</div><div><strong>{APP_NAME}</strong><small>نظام الحجوزات ومتابعة الدور</small></div></div>
      <div className="public-links">
        <NavLink to="/patient">المريض</NavLink>
        <NavLink to="/display">شاشة الانتظار</NavLink>
        <NavLink to="/login">دخول الإدارة</NavLink>
      </div>
    </header>
  );
}

export function Protected({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { firebaseUser, role, loading } = useAuth();
  if (loading) return <div className="loading-screen">جاري تحميل النظام...</div>;
  if (!firebaseUser) return <Unauthorized title="يجب تسجيل الدخول" body="هذه الصفحة خاصة بالإدارة أو الطبيب." login />;
  if (roles && !roles.includes(role || '')) return <Unauthorized title="ليس لديك صلاحية" body="تواصل مع مدير النظام لتفعيل صلاحياتك." />;
  return <>{children}</>;
}

function Unauthorized({ title, body, login }: { title: string; body: string; login?: boolean }) {
  return (
    <div className="login-page">
      <section className="glass-card auth-message">
        <div className="login-logo">+</div>
        <h1>{title}</h1>
        <p>{body}</p>
        {login && <NavLink className="primary-button" to="/login">تسجيل الدخول</NavLink>}
      </section>
    </div>
  );
}
