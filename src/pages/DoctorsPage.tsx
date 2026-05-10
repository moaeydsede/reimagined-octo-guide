import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { EmptyState, Section } from '../components/Cards';
import { AppShell } from '../components/Shell';
import { useDoctors } from '../hooks/useClinic';
import { removeDoctor, saveDoctor } from '../services/clinic';
import type { Doctor } from '../types';
import { safeError } from '../utils';

export function DoctorsPage() {
  const { doctors } = useDoctors();
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [message, setMessage] = useState('');

  async function deleteDoctor(id: string) {
    if (!confirm('هل تريد حذف الطبيب؟')) return;
    await removeDoctor(id);
  }

  return (
    <AppShell title="إدارة الأطباء" subtitle="إضافة الأطباء والغرف ومدة الكشف المتوسطة لكل طبيب">
      <div className="split-panel">
        <DoctorForm editing={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); setMessage('تم حفظ الطبيب بنجاح'); }} />
        <Section title="قائمة الأطباء" subtitle="كل طبيب يمكن أن يكون له دور مستقل وشاشة انتظار مستقلة.">
          {message && <div className="alert success">{message}</div>}
          {!doctors.length ? <EmptyState title="لا يوجد أطباء" body="أضف أول طبيب لبدء استخدام النظام." /> : <div className="doctor-list">
            {doctors.map((d) => <article className="doctor-card" key={d.id}>
              <div><strong>{d.name}</strong><p>{d.specialty} · {d.room} · متوسط الكشف {d.averageVisitMinutes} دقيقة</p></div>
              <span className={`badge ${d.isActive ? 'success' : 'danger'}`}>{d.isActive ? 'نشط' : 'متوقف'}</span>
              <div className="toolbar"><button className="muted-button small" onClick={() => setEditing(d)}><Edit3 size={15} /> تعديل</button><button className="danger-button small" onClick={() => deleteDoctor(d.id)}><Trash2 size={15} /></button></div>
            </article>)}
          </div>}
        </Section>
      </div>
    </AppShell>
  );
}

function DoctorForm({ editing, onSaved, onCancel }: { editing: Doctor | null; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(editing?.name || '');
  const [specialty, setSpecialty] = useState(editing?.specialty || 'عام');
  const [room, setRoom] = useState(editing?.room || 'غرفة 1');
  const [averageVisitMinutes, setAverageVisitMinutes] = useState(editing?.averageVisitMinutes || 10);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(editing?.name || '');
    setSpecialty(editing?.specialty || 'عام');
    setRoom(editing?.room || 'غرفة 1');
    setAverageVisitMinutes(editing?.averageVisitMinutes || 10);
    setIsActive(editing?.isActive ?? true);
  }, [editing]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    try { await saveDoctor({ id: editing?.id, name, specialty, room, averageVisitMinutes, isActive }); onSaved(); setName(''); }
    catch (err) { setError(safeError(err)); }
  }

  return (
    <Section title={editing ? 'تعديل طبيب' : 'إضافة طبيب'} subtitle="بيانات الطبيب والغرفة ومتوسط زمن الكشف.">
      <form className="doctor-form" onSubmit={submit}>
        <label>اسم الطبيب<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="د. أحمد محمد" /></label>
        <label>التخصص<input value={specialty} onChange={(e) => setSpecialty(e.target.value)} required placeholder="باطنة" /></label>
        <label>الغرفة<input value={room} onChange={(e) => setRoom(e.target.value)} required placeholder="غرفة 1" /></label>
        <label>متوسط مدة الكشف بالدقائق<input type="number" min={1} max={120} value={averageVisitMinutes} onChange={(e) => setAverageVisitMinutes(Number(e.target.value))} /></label>
        <label className="check-row"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> الطبيب نشط</label>
        {error && <div className="alert danger">{error}</div>}
        <button className="primary-button"><Plus size={18} /> {editing ? 'حفظ التعديل' : 'إضافة الطبيب'}</button>
        {editing && <button type="button" className="muted-button" onClick={onCancel}>إلغاء التعديل</button>}
      </form>
    </Section>
  );
}
