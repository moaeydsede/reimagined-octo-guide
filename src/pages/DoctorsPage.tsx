import { addDoc, collection, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { useState, type FormEvent } from 'react';
import { AppShell, EmptyState } from '../components/Layout';
import { db } from '../firebase/config';
import { useDoctors } from '../hooks/useClinicData';

export function DoctorsPage() {
  const { doctors } = useDoctors();
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [room, setRoom] = useState('');
  const [averageVisitMinutes, setAverageVisitMinutes] = useState(10);

  async function addDoctor(e: FormEvent) {
    e.preventDefault();
    await addDoc(collection(db, 'doctors'), {
      name,
      specialty,
      room,
      averageVisitMinutes,
      isActive: true,
      createdAt: serverTimestamp()
    });
    setName(''); setSpecialty(''); setRoom(''); setAverageVisitMinutes(10);
  }

  return (
    <AppShell title="إدارة الأطباء" subtitle="إضافة أطباء وغرف الكشف ومتوسط وقت الزيارة">
      <section className="panel split-panel">
        <form onSubmit={addDoctor} className="doctor-form">
          <h2>إضافة طبيب</h2>
          <label>اسم الطبيب<input value={name} onChange={(e) => setName(e.target.value)} placeholder="د. أحمد محمد" required /></label>
          <label>التخصص<input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="باطنة / أطفال / أسنان" /></label>
          <label>الغرفة<input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="غرفة 1" /></label>
          <label>متوسط الكشف بالدقائق<input type="number" min={1} value={averageVisitMinutes} onChange={(e) => setAverageVisitMinutes(Number(e.target.value))} /></label>
          <button className="primary-button">حفظ الطبيب</button>
        </form>
        <div>
          <h2>قائمة الأطباء</h2>
          {!doctors.length ? <EmptyState title="لا يوجد أطباء" body="أضف أول طبيب لكي يعمل نظام الدور." /> : (
            <div className="doctor-list">
              {doctors.map((doctor) => (
                <article key={doctor.id} className="doctor-card">
                  <div>
                    <strong>{doctor.name}</strong>
                    <p>{doctor.specialty || 'بدون تخصص'} · {doctor.room || 'بدون غرفة'}</p>
                  </div>
                  <button onClick={() => updateDoc(doc(db, 'doctors', doctor.id), { isActive: !doctor.isActive })} className={doctor.isActive ? 'success-button small' : 'muted-button small'}>
                    {doctor.isActive ? 'نشط' : 'متوقف'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="panel note-panel">
        <h2>إنشاء حساب طبيب</h2>
        <p>لإنشاء طبيب يدخل للنظام: أنشئ مستخدمًا من Firebase Authentication ثم أضف مستندًا داخل collection اسمها <code>users</code> بنفس UID ويحتوي:</p>
        <pre>{`{\n  "role": "doctor",\n  "displayName": "د. أحمد محمد",\n  "assignedDoctorId": "DOCTOR_DOCUMENT_ID"\n}`}</pre>
      </section>
    </AppShell>
  );
}
