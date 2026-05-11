import { Link } from 'react-router-dom'
import { ArrowLeft, Monitor, ShieldCheck, Smartphone, Zap } from 'lucide-react'
import Brand from '../components/Brand'

export default function Home() {
  return <section className="landing fade-in">
    <div className="hero-card">
      <Brand />
      <h1>عيادات المشفى</h1>
      <p>منصة احترافية لإدارة حجوزات العيادات ومتابعة الدور لحظيًا عبر رابط المريض، لوحة الإدارة، شاشة الطبيب، وشاشة الانتظار.</p>
      <div className="hero-actions"><Link className="primary-btn" to="/admin">فتح لوحة الإدارة <ArrowLeft size={18}/></Link><Link className="ghost-btn" to="/patient">رابط المريض</Link></div>
    </div>
    <div className="feature-grid">
      <div><Zap/><strong>تحديث لحظي</strong><span>كل تغيير يظهر فورًا على شاشة المريض والانتظار.</span></div>
      <div><ShieldCheck/><strong>صلاحيات وأمان</strong><span>تسجيل دخول للإدارة والطبيب وحماية البيانات.</span></div>
      <div><Monitor/><strong>شاشة انتظار</strong><span>عرض احترافي للأدوار الحالية والقادمة.</span></div>
      <div><Smartphone/><strong>برنامج موبايل</strong><span>واجهة PWA قابلة للتثبيت على الموبايل.</span></div>
    </div>
  </section>
}
