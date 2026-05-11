import { Database, ShieldCheck, Smartphone, Trash2, Wifi } from 'lucide-react'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'

export default function Settings() {
  const { clearAllData, doctors, patients, bookings } = useClinic()
  const clear = () => {
    if (window.confirm('سيتم حذف كل الأطباء والمرضى والحجوزات نهائيًا من هذا المتصفح. هل تريد المتابعة؟')) clearAllData()
  }
  return <section className="page fade-in">
    <Topbar title="إعدادات النظام" subtitle="إعدادات تشغيل عيادات المشفى ومسح البيانات" />
    <div className="settings-grid">
      <div className="panel-card"><ShieldCheck/><h2>الأمان والصلاحيات</h2><p>حماية الإدارة والطبيب وقواعد الوصول إلى البيانات.</p><span>Firebase Auth + Firestore Rules</span></div>
      <div className="panel-card"><Wifi/><h2>التحديث اللحظي</h2><p>الصفحات تتحدث مباشرة عند تغيير الدور والحجز لكل طبيب وغرفة.</p><span>Realtime Queue</span></div>
      <div className="panel-card"><Smartphone/><h2>تطبيق الموبايل</h2><p>واجهة قابلة للتثبيت وعمل اختصار تطبيق.</p><span>PWA + Capacitor Ready</span></div>
      <div className="panel-card danger-zone"><Database/><h2>حالة البيانات الحالية</h2><p>الأطباء: {doctors.length} • المرضى: {patients.length} • الحجوزات: {bookings.length}</p><span>Local Storage</span></div>
      <div className="panel-card danger-zone"><Trash2/><h2>مسح كل البيانات</h2><p>يحذف جميع الأطباء والمرضى والحجوزات والسجل، ويجعل النظام فارغًا بالكامل.</p><button className="danger-btn" onClick={clear}><Trash2 size={18}/> مسح كل البيانات</button></div>
    </div>
  </section>
}
