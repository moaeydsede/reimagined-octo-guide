import { Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, DoorOpen, Monitor, ShieldCheck, Smartphone, Zap } from 'lucide-react'
import Brand from '../components/Brand'
import { useClinic } from '../store/ClinicContext'

export default function Home() {
  const { settings, globalStats } = useClinic()
  return <section className="landing fade-in">
    <div className="hero-card">
      <Brand />
      <h1>{settings.clinicName}</h1>
      <p>منصة احترافية لإدارة حجوزات العيادات ومتابعة الدور لحظيًا، مع تعدد الأطباء والغرف، أكواد مرضى مستقلة لكل طبيب، شاشة انتظار، لوحة طبيب، وتحليلات تشغيلية.</p>
      <div className="hero-actions"><Link className="primary-btn" to="/admin">فتح لوحة الاستقبال <ArrowLeft size={18}/></Link><Link className="ghost-btn" to="/admin/doctors">إعداد الأطباء</Link><Link className="ghost-btn" to="/patient">رابط المريض</Link></div>
      <div className="hero-metrics"><div><b>{globalStats.activeDoctors}</b><span>أطباء نشطون</span></div><div><b>{globalStats.activeRooms}</b><span>غرف نشطة</span></div><div><b>{globalStats.total}</b><span>حجوزات</span></div></div>
    </div>
    <div className="feature-grid">
      <div><Zap/><strong>تشغيل مستقل لكل طبيب</strong><span>كل طبيب لديه قائمة انتظار ورقم دور وأكواد مرضى خاصة به.</span></div>
      <div><DoorOpen/><strong>إدارة غرف متقدمة</strong><span>إضافة وتعديل وحذف الغرف وربطها بالأطباء والحجوزات.</span></div>
      <div><Monitor/><strong>شاشة انتظار احترافية</strong><span>عرض واضح للرقم الحالي والقادمين حسب الطبيب والغرفة.</span></div>
      <div><BarChart3/><strong>تحليلات وتقارير</strong><span>متابعة الأداء حسب الطبيب والغرفة والحالة وساعات الذروة.</span></div>
      <div><ShieldCheck/><strong>جاهز للتأمين</strong><span>مهيأ للربط مع Firebase Auth وFirestore Rules.</span></div>
      <div><Smartphone/><strong>موبايل و PWA</strong><span>واجهة قابلة للتثبيت على الموبايل ويمكن تطويرها لتطبيق أصلي.</span></div>
    </div>
  </section>
}
