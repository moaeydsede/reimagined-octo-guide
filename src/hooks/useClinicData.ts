import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, where, type QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Booking, Doctor, QueueDoc } from '../types';
import { todayCairo } from '../utils';

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, 'doctors'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      setDoctors(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Doctor)));
      setLoading(false);
    });
    return () => unsub();
  }, []);
  return { doctors, loading };
}

export function useTodayBookings(doctorId?: string) {
  const date = todayCairo();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const filters: QueryConstraint[] = [where('servingDate', '==', date)];
    if (doctorId) filters.push(where('doctorId', '==', doctorId));
    const q = query(collection(db, 'bookings'), ...filters, orderBy('sortNumber', 'asc')); 
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
      setLoading(false);
    });
    return () => unsub();
  }, [date, doctorId]);
  return { bookings, loading, date };
}

export function useQueue(doctorId?: string) {
  const date = todayCairo();
  const [queue, setQueue] = useState<QueueDoc | null>(null);
  useEffect(() => {
    if (!doctorId) {
      setQueue(null);
      return;
    }
    const queueId = `${date}_${doctorId}`;
    const unsub = onSnapshot(doc(db, 'queues', queueId), (snap) => {
      setQueue(snap.exists() ? ({ id: snap.id, ...snap.data() } as QueueDoc) : null);
    });
    return () => unsub();
  }, [date, doctorId]);
  return queue;
}

export function useStats(bookings: Booking[]) {
  return useMemo(() => {
    const waiting = bookings.filter((b) => b.status === 'waiting' || b.status === 'postponed').length;
    const finished = bookings.filter((b) => b.status === 'finished').length;
    const skipped = bookings.filter((b) => b.status === 'skipped').length;
    const called = bookings.filter((b) => b.status === 'called' || b.status === 'in_progress').length;
    return { total: bookings.length, waiting, finished, skipped, called };
  }, [bookings]);
}
