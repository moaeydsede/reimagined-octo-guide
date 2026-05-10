import { useEffect, useMemo, useState } from 'react';
import { subscribeBookings, subscribeDoctors, subscribePublicTickets, subscribeQueueState } from '../services/clinic';
import type { Booking, BookingStatus, Doctor, PatientTicket, QueueState } from '../types';
import { todayKey } from '../utils';

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeDoctors((items) => {
      setDoctors(items);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { doctors, loading, activeDoctors: doctors.filter((d) => d.isActive) };
}

export function useBookings(dateKey = todayKey(), doctorId: string | null = null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeBookings(dateKey, doctorId, (items) => {
      setBookings(items);
      setLoading(false);
    });
    return unsub;
  }, [dateKey, doctorId]);
  return { bookings, loading };
}

export function useQueueState(doctorId: string, dateKey = todayKey()) {
  const [state, setState] = useState<QueueState | null>(null);
  useEffect(() => {
    if (!doctorId) return undefined;
    return subscribeQueueState(doctorId, dateKey, setState);
  }, [doctorId, dateKey]);
  return state;
}

export function usePublicTickets(dateKey = todayKey(), doctorId: string | null = null) {
  const [tickets, setTickets] = useState<PatientTicket[]>([]);
  useEffect(() => subscribePublicTickets(dateKey, doctorId, setTickets), [dateKey, doctorId]);
  return tickets;
}

export function useStats(bookings: Booking[]) {
  return useMemo(() => {
    const count = (s: BookingStatus) => bookings.filter((b) => b.status === s).length;
    const active = bookings.filter((b) => ['waiting', 'called', 'in_progress', 'postponed'].includes(b.status)).length;
    const finished = count('finished');
    const attendance = bookings.length ? Math.round(((finished + count('in_progress')) / bookings.length) * 100) : 0;
    return {
      total: bookings.length,
      waiting: count('waiting'),
      called: count('called'),
      inProgress: count('in_progress'),
      finished,
      skipped: count('skipped'),
      postponed: count('postponed'),
      cancelled: count('cancelled'),
      noShow: count('no_show'),
      active,
      attendance
    };
  }, [bookings]);
}
