import { Activity, ArrowLeft, Display, LockKeyhole, MonitorSmartphone, Stethoscope } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { PublicHeader } from '../components/Shell';

export function LandingPage() {
  return (
    <div className="public-shell landing-bg">
      <PublicHeader />
      <main className="hero">
        <section className="hero-copy">
          <span className="eyebrow"><Activity size={16} /> تحديث لحظي للعيادات</span>
          <h1>سيستم حجوزات ومتابعة دور المرضى باحترافية كاملة</h1>
          <p>رابط للمريض، لوحة للإدارة، شاشة للطبيب، وشاشة انتظار عامة. النظام يعمل على GitHub Pages + Firebase مع تصميم عربي RTL وتطبيق موبايل PWA.</p>
          <div className="hero-actions">
            <NavLink className="primary-button" to="/patient">فتح رابط المريض <ArrowLeft size={18} /></NavLink>
            <NavLink className="muted-button" to="/login">دخول الإدارة</NavLink>
          </div>
        </section>
        <section className="hero-grid">
          <NavLink className="portal-card blue" to="/patient"><MonitorSmartphone /><strong>رابط المريض</strong><span>متابعة الدور برقم الهاتف أو كود الحجز</span></NavLink>
          <NavLink className="portal-card dark" to="/admin"><LockKeyhole /><strong>لوحة الإدارة</strong><span>حجوزات، نداء، تخطي، تأجيل وتقارير</span></NavLink>
          <NavLink className="portal-card green" to="/doctor"><Stethoscope /><strong>لوحة الطبيب</strong><span>المريض الحالي والقادمون</span></NavLink>
          <NavLink className="portal-card purple" to="/display"><Display /><strong>شاشة الانتظار</strong><span>عرض عام للأدوار الحالية</span></NavLink>
        </section>
      </main>
    </div>
  );
}
