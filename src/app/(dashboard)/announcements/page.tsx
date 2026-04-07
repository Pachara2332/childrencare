// app/(dashboard)/announcements/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { Skeleton } from '@/app/components/ui/Skeleton'
import { Megaphone, Calendar, PlayCircle, AlertTriangle, Inbox, X } from 'lucide-react'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'

interface Announcement {
    id: number; title: string; content: string; type: string
    isUrgent: boolean; publishedAt: string; expiresAt: string | null
    academicYear: { name: string }
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; bg: string; color: string }> = {
    general: { icon: <Megaphone size={16} />, label: 'ทั่วไป', bg: 'oklch(0.94 0.03 240)', color: 'var(--sky)' },
    holiday: { icon: <Calendar size={16} />, label: 'วันหยุด', bg: 'oklch(0.93 0.04 160)', color: 'var(--leaf)' },
    activity: { icon: <PlayCircle size={16} />, label: 'กิจกรรม', bg: 'oklch(0.95 0.04 70)', color: 'var(--sun)' },
    emergency: { icon: <AlertTriangle size={16} />, label: 'ฉุกเฉิน', bg: 'oklch(0.95 0.04 25)', color: 'var(--coral)' },
}

export default function AnnouncementsPage() {
    const [items, setItems] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [filterType, setFilterType] = useState('all')
    const [form, setForm] = useState({ title: '', content: '', type: 'general', isUrgent: false, expiresAt: '' })
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<number | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

    const fetch_ = () => {
        fetch('/api/announcements')
            .then(r => r.ok ? r.json() : [])
            .then(d => { setItems(d); setLoading(false) })
            .catch(() => { setItems([]); setLoading(false) })
    }
    useEffect(() => { fetch_() }, [])

    const handleSubmit = async () => {
        setSaving(true)
        const res = await fetch('/api/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null }),
        })
        if (res.ok) { setShowForm(false); setForm({ title: '', content: '', type: 'general', isUrgent: false, expiresAt: '' }); fetch_() }
        setSaving(false)
    }

    const handleDelete = async (id: number) => {
        setDeleting(id)
        setConfirmDeleteId(null)
        await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
        setItems(prev => prev.filter(a => a.id !== id))
        setDeleting(null)
    }

    const filtered = filterType === 'all' ? items : items.filter(a => a.type === filterType)

    return (
        <div className="space-y-4 animate-fade-up">
            {/* Header actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-1.5 flex-wrap">
                    {[['all', 'ทั้งหมด'], ...Object.entries(typeConfig).map(([k, v]) => [k, v.label])].map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setFilterType(val)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{
                                background: filterType === val ? 'var(--leaf)' : 'white',
                                color: filterType === val ? 'white' : 'var(--muted)',
                                border: `1px solid ${filterType === val ? 'var(--leaf)' : 'var(--warm)'}`,
                                transition: 'all 0.15s var(--ease-out-quart)',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl text-sm font-semibold btn-primary">
                    + สร้างประกาศ
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="card rounded-2xl p-5">
                            <div className="flex items-start gap-4">
                                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-48 mb-2" />
                                    <Skeleton className="h-3 w-full mb-1" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 card rounded-2xl flex flex-col items-center">
                    <div className="mb-3"><Inbox size={32} color="var(--muted)" /></div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>ไม่มีประกาศ</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filtered.map(a => {
                        const cfg = typeConfig[a.type] ?? typeConfig.general
                        return (
                            <div
                                key={a.id}
                                className="card rounded-xl p-4"
                                style={{
                                    borderLeft: a.isUrgent ? '3px solid var(--coral)' : `3px solid ${cfg.color}`,
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                                                {cfg.icon} {a.title}
                                            </h3>
                                            <span
                                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                style={{ background: cfg.bg, color: cfg.color }}
                                            >
                                                {cfg.label}
                                            </span>
                                            {a.isUrgent && (
                                                <span
                                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: 'oklch(0.95 0.04 25)', color: 'var(--coral)' }}
                                                >
                                                    ด่วน
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text)' }}>{a.content}</p>
                                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                                            <span>{new Date(a.publishedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            {a.expiresAt && <span>หมดอายุ {new Date(a.expiresAt).toLocaleDateString('th-TH')}</span>}
                                            <span>{a.academicYear?.name}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setConfirmDeleteId(a.id)}
                                        disabled={deleting === a.id}
                                        className="text-xs px-2.5 py-1.5 rounded-lg shrink-0 disabled:opacity-50"
                                        style={{ background: 'oklch(0.95 0.04 25)', color: 'var(--coral)', border: 'none', cursor: 'pointer' }}
                                    >
                                        {deleting === a.id ? '...' : <X size={14} />}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <Modal open={showForm} onClose={() => setShowForm(false)} title="สร้างประกาศใหม่" icon={<Megaphone size={20} />}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>ชื่อประกาศ *</label>
                        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="หัวข้อประกาศ" className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>รายละเอียด *</label>
                        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="รายละเอียดประกาศ..." className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field" style={{ resize: 'vertical' }} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>ประเภท</label>
                            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field" style={{ cursor: 'pointer' }}>
                                <option value="general">ทั่วไป</option>
                                <option value="holiday">วันหยุด</option>
                                <option value="activity">กิจกรรม</option>
                                <option value="emergency">ฉุกเฉิน</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>วันหมดอายุ</label>
                            <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field" />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isUrgent} onChange={e => setForm(f => ({ ...f, isUrgent: e.target.checked }))} className="rounded w-4 h-4" />
                        <span className="text-sm font-medium" style={{ color: 'var(--coral)' }}>ทำเครื่องหมายว่าด่วน</span>
                    </label>
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm btn-secondary">ยกเลิก</button>
                    <button onClick={handleSubmit} disabled={saving || !form.title || !form.content} className="flex-1 py-2.5 rounded-xl text-sm btn-primary">
                        {saving ? 'กำลังบันทึก...' : 'เผยแพร่'}
                    </button>
                </div>
            </Modal>

            <ConfirmDialog
                open={confirmDeleteId !== null}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                title="ลบประกาศนี้?"
                description="เมื่อลบแล้วจะไม่สามารถกู้คืนได้"
                confirmLabel="ลบประกาศ"
                variant="danger"
                loading={deleting !== null}
            />
        </div>
    )
}