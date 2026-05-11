import { DatabaseZap, ShieldCheck, Smartphone, Trash2, Wifi } from 'lucide-react'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'

export default function Settings() {
  const { clearAll, doctors, patients, bookings } = useClinic()
  return <section className="page fade-in">
    <Topbar title="إعدادات النظام" subtitle="إعدادات تشغيل عيادات المشفى وإدارة بيانات التشغيل" />
    <div className="settings-grid">
      <div className="panel-card"><ShieldCheck/><h2>الأمان والصلاحيات</h2><p>حماية الإدارة والطبيب وقواعد الوصول إلى البيانات.</p><span>Firebase Auth + Firestore Rules</span></div>
      <div className="panel-card"><Wifi/><h2>التحديث اللحظي</h2><p>الصفحات تتحدث مباشرة عند تغيير الدور والحجز.</p><span>Realtime Queue</span></div>
      <div className="panel-card"><Smartphone/><h2>تطبيق الموبايل</h2><p>واجهة قابلة للتثبيت وعمل اختصار تطبيق.</p><span>PWA + Capacitor Ready</span></div>
      <div className="panel-card danger-panel"><DatabaseZap/><h2>البيانات الحالية</h2><p>الأطباء: {doctors.length} • المرضى: {patients.length} • الحجوزات: {bookings.length}</p><button className="danger-btn" onClick={() => window.confirm('سيتم حذف كل الأطباء والمرضى والحجوزات. هل أنت متأكد؟') && clearAll()}><Trash2 size={18}/> مسح كل البيانات</button></div>
    </div>
  </section>
}
