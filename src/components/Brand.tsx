export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-mark">م</div>
      {!compact && <div><strong>عيادات المشفى</strong><span>نظام الحجوزات ومتابعة الدور</span></div>}
    </div>
  )
}
