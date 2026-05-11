import { MessageCircle, Phone, RotateCcw, Send, SkipForward, TimerReset, XCircle } from 'lucide-react'
import { shareWhatsApp } from '../lib/helpers'
import { useClinic } from '../store/ClinicContext'
import { statusLabels, statusTone, type Booking } from '../types'

export default function BookingTable({ bookings }: { bookings: Booking[] }) {
  const { updateStatus, skip, postpone, returnToQueue } = useClinic()
  return <div className="table-card">
    <div className="table-head"><strong>قائمة الحجوزات</strong><span>{bookings.length} حجز</span></div>
    <div className="responsive-table">
      <table>
        <thead><tr><th>الدور</th><th>اسم المريض</th><th>الهاتف</th><th>الطبيب</th><th>النوع</th><th>الوقت</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
        <tbody>
        {bookings.map(b => <tr key={b.id}>
          <td><b className="queue-no">{b.queueNumber}</b></td>
          <td>{b.patientName}<small>كود: {b.code}</small></td>
          <td><a href={`tel:${b.phone}`}>{b.phone}</a></td>
          <td>{b.doctorName}</td>
          <td>{b.visitType}</td>
          <td>{b.bookedAt}</td>
          <td><span className={`badge ${statusTone[b.status]}`}>{statusLabels[b.status]}</span></td>
          <td><div className="row-actions">
            <button title="نداء" onClick={() => updateStatus(b.id, 'called')}><Send size={15}/></button>
            <button title="بدأ الكشف" onClick={() => updateStatus(b.id, 'in_progress')}><TimerReset size={15}/></button>
            <button title="تم الكشف" onClick={() => updateStatus(b.id, 'finished')}><Phone size={15}/></button>
            <button title="تخطي" onClick={() => skip(b.id)}><SkipForward size={15}/></button>
            <button title="تأجيل" onClick={() => postpone(b.id)}><XCircle size={15}/></button>
            <button title="إرجاع" onClick={() => returnToQueue(b.id)}><RotateCcw size={15}/></button>
            <a title="واتساب" href={shareWhatsApp(b.phone, `مرحبًا ${b.patientName}، رقم دورك ${b.queueNumber} في عيادات المشفى، كود الحجز ${b.code}.`)} target="_blank"><MessageCircle size={15}/></a>
          </div></td>
        </tr>)}
        </tbody>
      </table>
    </div>
  </div>
}
