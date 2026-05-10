import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BookingStatus } from '../types';
import { statusArabic, statusTone } from '../utils';

export function StatCard({ label, value, hint, icon, trend }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode; trend?: string }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
      {trend && <em>{trend}</em>}
    </article>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`badge ${statusTone[status]}`}>{statusArabic[status]}</span>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="empty-state"><AlertCircle /><strong>{title}</strong><p>{body}</p></div>;
}

export function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        {action && <div className="toolbar">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function MiniMetric({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return <div className="metric">{icon}<span>{label}</span><strong>{value}</strong></div>;
}
