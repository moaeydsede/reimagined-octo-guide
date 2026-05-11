import { useState } from 'react'
import { DoorOpen, Edit3, Plus, Trash2 } from 'lucide-react'
import StatCard from '../components/StatCard'
import Topbar from '../components/Topbar'
import { useClinic } from '../store/ClinicContext'
import type { Room } from '../types'

const emptyForm = { name: '', floor: '', notes: '', active: true }

export default function Rooms() {
  const { rooms, doctors, bookings, addRoom, updateRoom, deleteRoom, toggleRoom } = useClinic()
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<Room | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    addRoom({ ...form, name: form.name.trim(), floor: form.floor.trim() || 'غير محدد', notes: form.notes.trim() })
    setForm(emptyForm)
  }

  const openEdit = (room: Room) => {
    setEditing(room)
    setEditForm({ name: room.name, floor: room.floor, notes: room.notes || '', active: room.active })
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !editForm.name.trim()) return
    updateRoom(editing.id, { ...editForm, name: editForm.name.trim(), floor: editForm.floor.trim() || 'غير محدد', notes: editForm.notes.trim() })
    setEditing(null)
  }

  return <section className="page fade-in">
    <Topbar title="إدارة الغرف" subtitle="إنشاء غرف مستقلة وربط أكثر من طبيب بأكثر من غرفة حسب التشغيل اليومي" />
    <div className="stats-grid">
      <StatCard title="إجمالي الغرف" value={rooms.length} icon={<DoorOpen />} />
      <StatCard title="الغرف النشطة" value={rooms.filter(r => r.active).length} tone="green" />
      <StatCard title="أطباء مرتبطون" value={doctors.filter(d => d.roomId).length} tone="gold" />
      <StatCard title="حجوزات داخل غرف" value={bookings.filter(b => b.roomId || b.roomName).length} tone="purple" />
    </div>
    <div className="split-layout">
      <form className="panel-card" onSubmit={submit}>
        <h2>إضافة غرفة</h2>
        <label>اسم الغرفة<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: غرفة 1 / عيادة القلب" /></label>
        <label>الدور / المكان<input value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} placeholder="الدور الأول" /></label>
        <label>ملاحظات<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات تشغيلية اختيارية" /></label>
        <button className="primary-btn"><Plus size={18}/> إضافة الغرفة</button>
      </form>
      <div className="table-card"><div className="table-head"><strong>قائمة الغرف</strong><span>{rooms.length}</span></div>
        {!rooms.length ? <div className="empty-state"><h2>لا توجد غرف بعد</h2><p>أضف غرفة ثم اربطها بالطبيب من صفحة الأطباء.</p></div> : <div className="doctor-cards">{rooms.map(room => {
          const roomDoctors = doctors.filter(d => d.roomId === room.id)
          const roomBookings = bookings.filter(b => b.roomId === room.id || b.roomName === room.name)
          return <div key={room.id} className="doctor-card"><div><strong>{room.name}</strong><span>{room.floor} • {room.active ? 'نشطة' : 'متوقفة'}</span><small>{room.notes || 'بدون ملاحظات'} • أطباء: {roomDoctors.length} • حجوزات: {roomBookings.length}</small></div><div className="card-actions"><button className={room.active ? 'success-btn small' : 'ghost-btn small'} onClick={() => toggleRoom(room.id)}>{room.active ? 'نشطة' : 'متوقفة'}</button><button className="ghost-btn small" onClick={() => openEdit(room)}><Edit3 size={14}/> تعديل</button><button className="danger-btn small" onClick={() => window.confirm('حذف الغرفة لن يحذف الأطباء، لكنه سيجعلهم بدون غرفة. هل تريد المتابعة؟') && deleteRoom(room.id)}><Trash2 size={14}/> حذف</button></div></div>
        })}</div>}
      </div>
    </div>
    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}>
      <form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={saveEdit}>
        <h2>تعديل الغرفة</h2>
        <label>اسم الغرفة<input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></label>
        <label>الدور / المكان<input value={editForm.floor} onChange={e => setEditForm({ ...editForm, floor: e.target.value })} /></label>
        <label>الحالة<select value={editForm.active ? 'true' : 'false'} onChange={e => setEditForm({ ...editForm, active: e.target.value === 'true' })}><option value="true">نشطة</option><option value="false">متوقفة</option></select></label>
        <label>ملاحظات<textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></label>
        <div className="modal-actions"><button type="button" className="ghost-btn" onClick={() => setEditing(null)}>إلغاء</button><button className="primary-btn">حفظ التعديل</button></div>
      </form>
    </div>}
  </section>
}
