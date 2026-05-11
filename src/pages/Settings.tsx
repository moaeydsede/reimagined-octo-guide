import { ShieldCheck, Smartphone, Wifi } from 'lucide-react'
import Topbar from '../components/Topbar'

export default function Settings() {
  return <section className="page fade-in">
    <Topbar title="إعدادات النظام" subtitle="إعدادات تشغيل عيادات المشفى" />
    <div className="settings-grid">
      <div className="panel-card"><ShieldCheck/><h2>الأمان والصلاحيات</h2><p>حماية الإدارة والطبيب وقواعد الوصول إلى البيانات.</p><span>Firebase Auth + Firestore Rules</span></div>
      <div className="panel-card"><Wifi/><h2>التحديث اللحظي</h2><p>الصفحات تتحدث مباشرة عند تغيير الدور والحجز.</p><span>Realtime Queue</span></div>
      <div className="panel-card"><Smartphone/><h2>تطبيق الموبايل</h2><p>واجهة قابلة للتثبيت وعمل اختصار تطبيق.</p><span>PWA + Capacitor Ready</span></div>
    </div>
  </section>
}
