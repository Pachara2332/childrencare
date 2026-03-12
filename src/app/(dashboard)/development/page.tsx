// app/(dashboard)/development/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'

interface Child { id: number; code: string; nickname: string; firstName: string; gender: string }
interface Development {
    id: number; childId: number; recordedAt: string
    weight: number | null; height: number | null
    scoreLanguage: number | null; scorePhysical: number | null
    scoreIntellect: number | null; scoreEmotional: number | null; scoreSocial: number | null
    note: string | null
}

const devAreas = [
    { key: 'scoreLanguage', label: '🗣️ ภาษา', color: 'var(--leaf)' },
    { key: 'scorePhysical', label: '🏃 ร่างกาย', color: 'var(--sage)' },
    { key: 'scoreIntellect', label: '🧠 สติปัญญา', color: 'var(--sky)' },
    { key: 'scoreEmotional', label: '❤️ อารมณ์', color: 'var(--coral)' },
    { key: 'scoreSocial', label: '👥 สังคม', color: 'var(--sun)' },
]

export default function DevelopmentPage() {
    const [children, setChildren] = useState<Child[]>([])
    const [records, setRecords] = useState<Development[]>([])
    const [selectedChild, setSelectedChild] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        childId: '',
        weight: '', height: '',
        scoreLanguage: '', scorePhysical: '',
        scoreIntellect: '', scoreEmotional: '', scoreSocial: '',
        note: '',
    })

    useEffect(() => {
        fetch('/api/children').then(r => r.json()).then(d => {
            setChildren(d)
            if (d.length > 0) setSelectedChild(d[0].id)
        })
    }, [])

    useEffect(() => {
        if (!selectedChild) return
        fetch(`/api/children/${selectedChild}/developments`)
            .then(r => r.json()).then(setRecords)
    }, [selectedChild])

    const handleSubmit = async () => {
        setSaving(true)
        const payload = {
            ...form,
            childId: Number(form.childId || selectedChild),
            weight: form.weight ? Number(form.weight) : null,
            height: form.height ? Number(form.height) : null,
            scoreLanguage: form.scoreLanguage ? Number(form.scoreLanguage) : null,
            scorePhysical: form.scorePhysical ? Number(form.scorePhysical) : null,
            scoreIntellect: form.scoreIntellect ? Number(form.scoreIntellect) : null,
            scoreEmotional: form.scoreEmotional ? Number(form.scoreEmotional) : null,
            scoreSocial: form.scoreSocial ? Number(form.scoreSocial) : null,
        }
        const res = await fetch('/api/development', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        if (res.ok) {
            const newRec = await res.json()
            setRecords(prev => [newRec, ...prev])
            setShowForm(false)
        }
        setSaving(false)
    }

    const child = children.find(c => c.id === selectedChild)
    const latest = records[0]
    const inputStyle = { border: '1px solid var(--warm)', background: 'white', color: 'var(--text)' }
    const inputClass = "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"

    return (
        <div className="space-y-5 animate-fade-up">
            {/* Child selector */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex gap-2 flex-wrap flex-1">
                    {children.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedChild(c.id)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: selectedChild === c.id ? 'var(--leaf)' : 'white',
                                color: selectedChild === c.id ? 'white' : 'var(--text)',
                                border: `1px solid ${selectedChild === c.id ? 'var(--leaf)' : 'var(--warm)'}`,
                            }}
                        >
                            <span
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                                style={{
                                    background: c.gender === 'male' ? '#DBE9F4' : '#FDE8F0',
                                    color: c.gender === 'male' ? 'var(--sky)' : '#C2185B',
                                }}
                            >
                                {c.nickname.slice(0, 1)}
                            </span>
                            {c.nickname}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => { setForm(f => ({ ...f, childId: String(selectedChild ?? '') })); setShowForm(true) }}
                    className="px-4 py-2 rounded-xl text-white text-sm font-semibold shrink-0"
                    style={{ background: 'var(--leaf)' }}
                >
                    + บันทึกพัฒนาการ
                </button>
            </div>

            {child && (
                <>
                    {/* Latest record */}
                    {latest ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'น้ำหนัก', value: latest.weight ? `${latest.weight} กก.` : '—', icon: '⚖️', color: '#D8F3DC', textColor: 'var(--leaf)' },
                                { label: 'ส่วนสูง', value: latest.height ? `${latest.height} ซม.` : '—', icon: '📏', color: '#FFF8E8', textColor: 'var(--sun)' },
                                { label: 'บันทึกล่าสุด', value: new Date(latest.recordedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }), icon: '📅', color: '#EFF4FF', textColor: 'var(--sky)' },
                                { label: 'รายการทั้งหมด', value: `${records.length} ครั้ง`, icon: '📋', color: '#FFF0ED', textColor: 'var(--coral)' },
                            ].map(s => (
                                <div key={s.label} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: s.color }}>
                                        {s.icon}
                                    </div>
                                    <p className="text-2xl font-bold" style={{ color: s.textColor }}>{s.value}</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 rounded-2xl" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                            <p className="text-4xl mb-2">📈</p>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ยังไม่มีข้อมูลพัฒนาการของ {child.nickname}</p>
                        </div>
                    )}

                    {/* Dev scores */}
                    {latest && (
                        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>
                                🌟 พัฒนาการ 5 ด้าน — {child.nickname}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {devAreas.map(area => {
                                    const score = latest[area.key as keyof Development] as number | null
                                    const level = !score ? '—' : score >= 80 ? 'ดีมาก' : score >= 60 ? 'ดี' : score >= 40 ? 'พอใช้' : 'ควรส่งเสริม'
                                    return (
                                        <div key={area.key} className="rounded-xl p-4" style={{ background: 'var(--cream)' }}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{area.label}</span>
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: area.color + '20', color: area.color }}>
                                                    {level}
                                                </span>
                                            </div>
                                            <div className="rounded-full overflow-hidden h-2.5 mb-1" style={{ background: 'var(--warm)' }}>
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${score ?? 0}%`, background: area.color, transition: 'width 0.8s ease' }}
                                                />
                                            </div>
                                            <p className="text-xs text-right" style={{ color: 'var(--muted)' }}>{score ?? 0}/100</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {records.length > 1 && (
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--warm)', background: 'var(--cream)' }}>
                                <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>ประวัติการบันทึก</h3>
                            </div>
                            {records.map((r, i) => (
                                <div key={r.id} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: '1px solid var(--warm)' }}>
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: i === 0 ? 'var(--sage)' : 'var(--sand)' }} />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                            {new Date(r.recordedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            {i === 0 && <span className="ml-2 text-xs" style={{ color: 'var(--sage)' }}>ล่าสุด</span>}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                            {r.weight ? `⚖️ ${r.weight}กก.` : ''} {r.height ? `📏 ${r.height}ซม.` : ''}
                                            {r.note && ` · ${r.note}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            <Modal open={showForm} onClose={() => setShowForm(false)} title="บันทึกพัฒนาการ" icon="📈">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>เด็ก</label>
                        <select
                            value={form.childId || selectedChild || ''}
                            onChange={e => setForm(f => ({ ...f, childId: e.target.value }))}
                            className={`${inputClass} input-field`}
                        >
                            {children.map(c => <option key={c.id} value={c.id}>{c.nickname} — {c.firstName}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>⚖️ น้ำหนัก (กก.)</label>
                            <input type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="0.0" className={`${inputClass} input-field`} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>📏 ส่วนสูง (ซม.)</label>
                            <input type="number" step="0.1" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} placeholder="0.0" className={`${inputClass} input-field`} />
                        </div>
                    </div>

                    <p className="text-xs font-semibold pt-2" style={{ color: 'var(--muted)' }}>พัฒนาการ 5 ด้าน (0–100)</p>
                    <div className="grid grid-cols-2 gap-3">
                        {devAreas.map(area => (
                            <div key={area.key}>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: area.color }}>{area.label}</label>
                                <input
                                    type="number" min="0" max="100"
                                    value={form[area.key as keyof typeof form] as string}
                                    onChange={e => setForm(f => ({ ...f, [area.key]: e.target.value }))}
                                    placeholder="0–100"
                                    className={`${inputClass} input-field`}
                                />
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>📝 หมายเหตุ</label>
                        <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} className={`${inputClass} input-field`} style={{ resize: 'none' }} placeholder="บันทึกเพิ่มเติม..." />
                    </div>
                </div>

                <div className="flex gap-3 mt-5">
                    <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm btn-secondary">ยกเลิก</button>
                    <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm btn-primary">
                        {saving ? '⏳ กำลังบันทึก...' : '✅ บันทึก'}
                    </button>
                </div>
            </Modal>
        </div>
    )
}