import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase/config';
import { todayCairo } from '../utils';

interface PublicQueue {
  id: string;
  doctorName: string;
  currentNumber: number;
  currentPatientName?: string;
  upcomingNumbers?: number[];
  servingDate: string;
}

export function DisplayPage() {
  const [queues, setQueues] = useState<PublicQueue[]>([]);
  const date = todayCairo();
  const time = useClock();
  const active = queues[0];

  useEffect(() => {
    const q = query(collection(db, 'publicQueues'), where('servingDate', '==', date), orderBy('doctorName'));
    const unsub = onSnapshot(q, (snap) => {
      setQueues(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PublicQueue)));
    });
    return () => unsub();
  }, [date]);

  return (
    <main className="display-page">
      <header className="display-header">
        <div className="display-brand"><span>+</span> Clinic Queue Pro</div>
        <div><strong>{time}</strong><small>{date}</small></div>
      </header>
      {!active ? (
        <section className="display-empty">لا يوجد دور حالي الآن</section>
      ) : (
        <section className="display-main">
          <span>الدكتور</span>
          <h1>{active.doctorName}</h1>
          <p>الدور الحالي</p>
          <strong className="big-number">{active.currentNumber || '-'}</strong>
          <h2>{active.currentPatientName || 'برجاء انتظار النداء'}</h2>
          <p>برجاء التوجه إلى غرفة الكشف</p>
          <div className="upcoming-line">
            {(active.upcomingNumbers || []).slice(0, 6).map((n) => <b key={n}>{n}</b>)}
          </div>
        </section>
      )}
      {queues.length > 1 && (
        <section className="display-grid">
          {queues.slice(1).map((q) => (
            <article key={q.id}><span>{q.doctorName}</span><strong>{q.currentNumber || '-'}</strong></article>
          ))}
        </section>
      )}
    </main>
  );
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' }).format(now), [now]);
}
