// app/(dashboard)/announcements/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { Skeleton } from '@/app/components/ui/Skeleton'

interface Announcement {
    id: number
    title: string
    content: string
    type: string
    isUrgent: boolean
    publishedAt: string
    expiresAt: string | null
    academicYear: { name: string }
}

const typeConfig: Record<string, { icon: string; label: string; bg: string; color: string }> = {
    general: { icon: '📢', label: 'ทั่วไป', bg: '#EFF4FF', color: '#1D3557' },
    holiday: { icon: '🎉', label: 'วันหยุด', bg: '#F0FFF4', color: '#1B4332' },
    activity: { icon: '⚽', label: 'กิจกรรม', bg: '#FFF8E8', color: '#7D4E00' },
    emergency: { icon: '🚨', label: 'ฉุกเฉิน', bg: '#FFF0ED', color: '#9B1C1C' },
}

export default function AnnouncementsPage() {
    const [items, setItems] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [filterType, setFilterType] = useState('all')
    const [form, setForm] = useState({
        title: '', content: '', type: 'general',
        isUrgent: false, expiresAt: '',
    })
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<number | null>(null)

    const fetch_ = () => {
        fetch('/api/announcements')
            .then(r => r.json())
            .then(d => { setItems(d); setLoading(false) })
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
        if (!confirm('ลบประกาศนี้?')) return
        setDeleting(id)
        await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
        setItems(prev => prev.filter(a => a.id !== id))
        setDeleting(null)
    }

    const filtered = filterType === 'all' ? items : items.filter(a => a.type === filterType)
    const inputStyle = { border: '1px solid var(--warm)', background: 'white', color: 'var(--text)' }
    const inputClass = "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"

    return (
        <div className="space-y-5 animate-fade-up">
            {/* Header actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap">
                    {[['all', '📋 ทั้งหมด'], ['general', '📢'], ['holiday', '🎉'], ['activity', '⚽'], ['emergency', '🚨']].map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setFilterType(val)}
                            className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: filterType === val ? 'var(--leaf)' : 'white',
                                color: filterType === val ? 'white' : 'var(--muted)',
                                border: `1px solid ${filterType === val ? 'var(--leaf)' : 'var(--warm)'}`,
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'var(--leaf)' }}
                >
                    + สร้างประกาศ
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                            <div className="flex items-start gap-4">
                                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-48 mb-2" />
                                    <Skeleton className="h-3 w-full mb-1" />
                                    <Skeleton className="h-3 w-3/4 mb-3" />
                                    <div className="flex gap-3">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                    <p className="text-4xl mb-2">📭</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>ไม่มีประกาศ</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(a => {
                        const cfg = typeConfig[a.type] ?? typeConfig.general
                        return (
                            <div
                                key={a.id}
                                className="rounded-2xl p-5"
                                style={{
                                    background: a.isUrgent ? '#FFF5F5' : 'white',
                                    border: `1px solid ${a.isUrgent ? '#FEB2B2' : 'var(--warm)'}`,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                                        style={{ background: cfg.bg }}
                                    >
                                        {cfg.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{a.title}</h3>
                                            <span
                                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                                style={{ background: cfg.bg, color: cfg.color }}
                                            >
                                                {cfg.label}
                                            </span>
                                            {a.isUrgent && (
                                                <span
                                                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: '#FEB2B2', color: '#9B1C1C' }}
                                                >
                                                    🚨 ด่วน!
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text)' }}>{a.content}</p>
                                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                                            <span>📅 {new Date(a.publishedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            {a.expiresAt && <span>⏰ หมดอายุ {new Date(a.expiresAt).toLocaleDateString('th-TH')}</span>}
                                            <span>📚 {a.academicYear?.name}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(a.id)}
                                        disabled={deleting === a.id}
                                        className="text-xs px-3 py-1.5 rounded-lg shrink-0 disabled:opacity-50"
                                        style={{ background: '#FFF0ED', color: 'var(--coral)', border: 'none', cursor: 'pointer' }}
                                    >
                                        {deleting === a.id ? '⏳' : '🗑️'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <Modal open={showForm} onClose={() => setShowForm(false)} title="สร้างประกาศใหม่" icon="📢">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>ชื่อประกาศ *</label>
                        <input
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="หัวข้อประกาศ"
                            className={`${inputClass} input-field`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>รายละเอียด *</label>
                        <textarea
                            value={form.content}
                            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                            rows={4}
                            placeholder="รายละเอียดประกาศ..."
                            className={`${inputClass} input-field`}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>ประเภท</label>
                            <select
                                value={form.type}
                                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                className={`${inputClass} input-field`}
                                style={{ cursor: 'pointer' }}
                            >
                                <option value="general">📢 ทั่วไป</option>
                                <option value="holiday">🎉 วันหยุด</option>
                                <option value="activity">⚽ กิจกรรม</option>
                                <option value="emergency">🚨 ฉุกเฉิน</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>วันหมดอายุ</label>
                            <input
                                type="date"
                                value={form.expiresAt}
                                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                                className={`${inputClass} input-field`}
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.isUrgent}
                            onChange={e => setForm(f => ({ ...f, isUrgent: e.target.checked }))}
                            className="rounded w-4 h-4"
                        />
                        <span className="text-sm font-semibold" style={{ color: 'var(--coral)' }}>
                            🚨 ทำเครื่องหมายว่าด่วน
                        </span>
                    </label>
                </div>

                <div className="flex gap-3 mt-5">
                    <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm btn-secondary">ยกเลิก</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !form.title || !form.content}
                        className="flex-1 py-2.5 rounded-xl text-sm btn-primary"
                    >
                        {saving ? '⏳ กำลังบันทึก...' : '✅ เผยแพร่'}
                    </button>
                </div>
            </Modal>
        </div>
    )
}