import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, ClipboardList, Display, Home, LogOut, MonitorSmartphone, Stethoscope, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const isStaffArea = location.pathname.startsWith('/admin') || location.pathname.startsWith('/doctor');

  if (!isStaffArea) {
    return <main className="public-shell">{children}</main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/admin" className="brand">
          <span className="brand-icon">+</span>
          <span>
            <strong>Clinic Queue Pro</strong>
            <small>نظام الدور والحجوزات</small>
          </span>
        </Link>
        <nav className="nav">
          <NavLink to="/admin"><Home size={18} /> لوحة الإدارة</NavLink>
          <NavLink to="/admin/bookings"><ClipboardList size={18} /> الحجوزات</NavLink>
          <NavLink to="/admin/doctors"><Stethoscope size={18} /> الأطباء</NavLink>
          <NavLink to="/doctor"><CalendarDays size={18} /> لوحة الطبيب</NavLink>
          <NavLink to="/patient"><MonitorSmartphone size={18} /> رابط المريض</NavLink>
          <NavLink to="/display"><Display size={18} /> شاشة الانتظار</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-mini">
            <span className="avatar">{(profile?.displayName || user?.email || 'م').slice(0, 1)}</span>
            <div>
              <strong>{profile?.displayName || user?.email || 'مستخدم'}</strong>
              <small>{profile?.role === 'admin' ? 'مدير النظام' : profile?.role || 'Staff'}</small>
            </div>
          </div>
          <button className="ghost-button" onClick={logout}><LogOut size={16} /> تسجيل الخروج</button>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="top-actions">
            <Link className="chip" to="/patient">رابط المريض</Link>
            <Link className="chip" to="/display">شاشة الانتظار</Link>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: string | number; hint?: string; icon?: ReactNode }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon || <Users size={20} />}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}
