import type { ReactNode } from 'react'

export default function StatCard({ title, value, hint, icon, tone = 'blue' }: { title: string; value: ReactNode; hint?: string; icon?: ReactNode; tone?: string }) {
  return <div className={`stat-card tone-${tone}`}>
    <div className="stat-icon">{icon}</div>
    <div>
      <span>{title}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  </div>
}
