import { useRef, useState } from 'react'
import { Database, Download, ShieldCheck, Smartphone, Trash2, Upload, Wifi } from 'lucide-react'
import Topbar from '../components/Topbar'
import { downloadTextFile } from '../lib/helpers'
import { useClinic } from '../store/ClinicContext'
import type { ClinicState } from '../types'

export default function Settings() {
  const { clearAllData, doctors, patients, bookings, rooms, logs, settings, updateSettings, importState, currentDoctorId, selectedDate, currentUserRole } = useClinic()
  const [form, setForm] = useState(settings)
  const fileRef = useRef<HTMLInputElement>(null)
  const clear = () => {
    if (window.confirm('سيتم حذف كل الأطباء والغرف والمرضى والحجوزات نهائيًا من هذا المتصفح. هل تريد المتابعة؟')) clearAllData()
  }
  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings(form)
  }
  const exportData = () => {
    const backup: ClinicState = { rooms, doctors, patients, bookings, logs, settings, currentDoctorId, selectedDate, currentUserRole }
    downloadTextFile(`clinic-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2))
  }
  const importData = async (file?: File) => {
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as ClinicState
      if (!Array.isArray(parsed.doctors) || !Array.isArray(parsed.bookings)) throw new Error('invalid')
      if (window.confirm('سيتم استبدال البيانات الحالية بملف النسخة الاحتياطية. هل تريد المتابعة؟')) importState(parsed)
    } catch {
      alert('ملف غير صحيح. اختر ملف نسخة احتياطية بصيغة JSON من النظام.')
    }
  }
  return <section className="page fade-in">
    <Topbar title="إعدادات النظام" subtitle="إعدادات تشغيل العيادة، النسخ الاحتياطي، ومسح البيانات" />
    <div className="settings-grid">
      <div className="panel-card"><ShieldCheck/><h2>الأمان والصلاحيات</h2><p>جاهز للربط مع Firebase Auth وقواعد Firestore عند النشر السحابي.</p><span>Firebase Ready</span></div>
      <div className="panel-card"><Wifi/><h2>التحديث اللحظي</h2><p>الواجهة موحدة لكل الشاشات، وتعمل من التخزين المحلي ويمكن ربطها بالسحابة.</p><span>Realtime UX</span></div>
      <div className="panel-card"><Smartphone/><h2>تطبيق الموبايل</h2><p>واجهة PWA قابلة للتثبيت، مع Capacitor للاندرويد و iOS عند الحاجة.</p><span>PWA + Capacitor</span></div>
      <div className="panel-card danger-zone"><Database/><h2>حالة البيانات الحالية</h2><p>الغرف: {rooms.length} • الأطباء: {doctors.length} • المرضى: {patients.length} • الحجوزات: {bookings.length}</p><span>Local Storage</span></div>
      <div className="panel-card backup-card"><Download/><h2>نسخة احتياطية</h2><p>تحميل كل بيانات النظام كملف JSON يمكن استيراده لاحقًا.</p><button className="primary-btn" onClick={exportData}><Download size={18}/> تصدير البيانات</button></div>
      <div className="panel-card backup-card"><Upload/><h2>استيراد البيانات</h2><p>استعادة نسخة احتياطية محفوظة سابقًا.</p><input ref={fileRef} type="file" accept="application/json" hidden onChange={e => importData(e.target.files?.[0])} /><button className="ghost-btn" onClick={() => fileRef.current?.click()}><Upload size={18}/> اختيار ملف</button></div>
      <div className="panel-card danger-zone"><Trash2/><h2>مسح كل البيانات</h2><p>يحذف جميع الغرف والأطباء والمرضى والحجوزات والسجل، ويجعل النظام فارغًا بالكامل.</p><button className="danger-btn" onClick={clear}><Trash2 size={18}/> مسح كل البيانات</button></div>
    </div>
    <form className="panel-card settings-form" onSubmit={saveSettings}>
      <h2>بيانات العيادة والرسائل</h2>
      <div className="form-grid two">
        <label>اسم العيادة<input value={form.clinicName} onChange={e => setForm({ ...form, clinicName: e.target.value })} /></label>
        <label>اسم الفرع<input value={form.branchName} onChange={e => setForm({ ...form, branchName: e.target.value })} /></label>
        <label>بداية اليوم<input type="time" value={form.workdayStart} onChange={e => setForm({ ...form, workdayStart: e.target.value })} /></label>
        <label>نهاية اليوم<input type="time" value={form.workdayEnd} onChange={e => setForm({ ...form, workdayEnd: e.target.value })} /></label>
      </div>
      <label>رسالة واتساب الافتراضية<textarea value={form.whatsappTemplate} onChange={e => setForm({ ...form, whatsappTemplate: e.target.value })} /></label>
      <label className="check-line"><input type="checkbox" checked={form.autoSkipPreviousCalled} onChange={e => setForm({ ...form, autoSkipPreviousCalled: e.target.checked })} /> تخطي المريض المنادى السابق تلقائيًا عند نداء التالي لنفس الطبيب</label>
      <div className="inline-alert">المتغيرات المتاحة في رسالة واتساب: {'{patient}'} {'{queue}'} {'{code}'} {'{doctor}'} {'{room}'} {'{type}'} {'{date}'} {'{day}'} {'{time}'}</div>
      <button className="primary-btn">حفظ الإعدادات</button>
    </form>
  </section>
}
