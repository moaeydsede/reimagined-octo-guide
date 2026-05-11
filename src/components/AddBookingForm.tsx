import { useEffect, useMemo, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { useClinic } from '../store/ClinicContext'

export default function AddBookingForm() {
  const { doctors, addBooking } = useClinic()
  const activeDoctors = useMemo(() => doctors.filter(d => d.active), [doctors])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ patientName: '', phone: '', doctorId: activeDoctors[0]?.id || '', visitType: 'كشف', notes: '', priority: 0 })

  useEffect(() => {
    if (!form.doctorId && activeDoctors[0]?.id) setForm(prev => ({ ...prev, doctorId: activeDoctors[0].id }))
  }, [activeDoctors, form.doctorId])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patientName || !form.phone || !form.doctorId) return
    addBooking(form)
    setForm({ patientName: '', phone: '', doctorId: activeDoctors[0]?.id || '', visitType: 'كشف', notes: '', priority: 0 })
    setOpen(false)
  }

  return <>
    <button className="primary-btn" disabled={!activeDoctors.length} onClick={() => setOpen(true)}><PlusCircle size={18}/> حجز جديد</button>
    {open && <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <h2>إضافة حجز جديد</h2>
        {!activeDoctors.length && <div className="inline-alert">أضف طبيبًا متاحًا أولًا من صفحة الأطباء حتى يمكن إنشاء الحجز.</div>}
        <label>اسم المريض<input value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} placeholder="اسم المريض" /></label>
        <label>رقم الهاتف<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01000000000" /></label>
        <label>الطبيب<select value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}>{activeDoctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.specialty} - {d.room}</option>)}</select></label>
        <label>نوع الزيارة<select value={form.visitType} onChange={e => setForm({ ...form, visitType: e.target.value })}><option>كشف</option><option>استشارة</option><option>متابعة</option><option>حالة عاجلة</option></select></label>
        <label>الأولوية<select value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })}><option value={0}>عادي</option><option value={1}>أولوية</option><option value={2}>عاجل</option></select></label>
        <label>ملاحظات<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات اختيارية" /></label>
        <div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setOpen(false)}>إلغاء</button><button className="primary-btn" disabled={!activeDoctors.length}>حفظ وإنشاء رقم دور</button></div>
      </form>
    </div>}
  </>
}
