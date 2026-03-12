// app/(dashboard)/activities/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { CardGridSkeleton } from '@/app/components/ui/Skeleton'

interface Child { id: number; nickname: string; firstName: string; gender: string }
interface Activity {
    id: number; childId: number; date: string
    meals: string | null; mealsNote: string | null
    sleepMinutes: number | null; sleepNote: string | null
    activities: string[]; activitiesNote: string | null
    mood: string | null; teacherNote: string | null
    child?: Child
}

const moodConfig: Record<string, { icon: string; label: string; color: string }> = {
    happy: { icon: '😊', label: 'แจ่มใส', color: '#D8F3DC' },
    neutral: { icon: '😐', label: 'ปกติ', color: '#EDE8E0' },
    sad: { icon: '😢', label: 'เศร้า', color: '#EFF4FF' },
    sick: { icon: '🤒', label: 'ไม่สบาย', color: '#FFF0ED' },
}

const activityOptions = ['วาดรูป', 'ระบายสี', 'เล่นบล็อก', 'ร้องเพลง', 'เล่านิทาน', 'เล่นน้ำ', 'ออกกำลังกาย', 'ปั้นดินน้ำมัน', 'เล่นเสรี', 'เรียนคณิต', 'เรียนภาษา']
const mealsOptions = ['กินหมด', 'กินมาก', 'กินปกติ', 'กินน้อย', 'ไม่กิน']

export default function ActivitiesPage() {
    const [children, setChildren] = useState<Child[]>([])
    const [activities, setActivities] = useState<Activity[]>([])
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({
        childId: '',
        meals: '', mealsNote: '',
        sleepMinutes: '',
        activities: [] as string[],
        activitiesNote: '',
        mood: 'happy',
        teacherNote: '',
    })

    const fetchActivities = () => {
        setLoading(true)
        fetch(`/api/activities?date=${date}`)
            .then(r => r.json()).then(d => { setActivities(d); setLoading(false) })
            .catch(() => setLoading(false))
    }

    useEffect(() => {
        fetch('/api/children').then(r => r.json()).then(d => {
            setChildren(d)
            if (d.length) setForm(f => ({ ...f, childId: String(d[0].id) }))
        })
    }, [])

    useEffect(() => { fetchActivities() }, [date])

    const toggleActivity = (act: string) => {
        setForm(f => ({
            ...f,
            activities: f.activities.includes(act)
                ? f.activities.filter(a => a !== act)
                : [...f.activities, act],
        }))
    }

    const handleSubmit = async () => {
        setSaving(true)
        const res = await fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                date,
                childId: Number(form.childId),
                sleepMinutes: form.sleepMinutes ? Number(form.sleepMinutes) : null,
            }),
        })
        if (res.ok) { setShowForm(false); fetchActivities() }
        setSaving(false)
    }

    const getActivity = (childId: number) => activities.find(a => a.childId === childId)

    return (
        <div className="space-y-5 animate-fade-up">
            {/* Date + Add */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="px-3.5 py-2 rounded-xl text-sm outline-none"
                        style={{ border: '1px solid var(--warm)', background: 'white', color: 'var(--text)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        บันทึกแล้ว {activities.length}/{children.length} คน
                    </span>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'var(--leaf)' }}
                >
                    + บันทึกกิจกรรม
                </button>
            </div>

            {/* Child cards */}
            {loading ? <CardGridSkeleton count={6} /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {children.map(child => {
                    const act = getActivity(child.id)
                    return (
                        <div
                            key={child.id}
                            className="rounded-2xl p-4"
                            style={{
                                background: 'white',
                                border: `1px solid ${act ? 'var(--sage)' : 'var(--warm)'}`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            }}
                        >
                            {/* Child header */}
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                                    style={{
                                        background: child.gender === 'male' ? '#DBE9F4' : '#FDE8F0',
                                        color: child.gender === 'male' ? 'var(--sky)' : '#C2185B',
                                    }}
                                >
                                    {child.nickname.slice(0, 1)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{child.nickname}</p>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{child.firstName}</p>
                                </div>
                                {act?.mood && (
                                    <span className="text-2xl">{moodConfig[act.mood]?.icon ?? '😊'}</span>
                                )}
                            </div>

                            {act ? (
                                <div className="space-y-2">
                                    {act.meals && (
                                        <div className="flex gap-2 text-xs rounded-lg px-3 py-2" style={{ background: 'var(--cream)' }}>
                                            <span>🍚</span>
                                            <span style={{ color: 'var(--text)' }}>{act.meals}{act.mealsNote && ` · ${act.mealsNote}`}</span>
                                        </div>
                                    )}
                                    {act.sleepMinutes && (
                                        <div className="flex gap-2 text-xs rounded-lg px-3 py-2" style={{ background: 'var(--cream)' }}>
                                            <span>😴</span>
                                            <span style={{ color: 'var(--text)' }}>
                                                {Math.floor(act.sleepMinutes / 60) > 0 ? `${Math.floor(act.sleepMinutes / 60)} ชม. ` : ''}
                                                {act.sleepMinutes % 60 > 0 ? `${act.sleepMinutes % 60} นาที` : ''}
                                            </span>
                                        </div>
                                    )}
                                    {act.activities.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {act.activities.map(a => (
                                                <span
                                                    key={a}
                                                    className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{ background: '#D8F3DC', color: '#1B4332' }}
                                                >
                                                    {a}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {act.teacherNote && (
                                        <p className="text-xs italic" style={{ color: 'var(--muted)' }}>📝 {act.teacherNote}</p>
                                    )}
                                </div>
                            ) : (
                                <div
                                    className="rounded-xl py-5 text-center cursor-pointer transition-all hover:opacity-80"
                                    style={{ background: 'var(--cream)', border: '1px dashed var(--sand)' }}
                                    onClick={() => { setForm(f => ({ ...f, childId: String(child.id) })); setShowForm(true) }}
                                >
                                    <p className="text-2xl mb-1">📝</p>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>ยังไม่มีบันทึก · คลิกเพื่อเพิ่ม</p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            )}

            {/* Modal */}
            <Modal open={showForm} onClose={() => setShowForm(false)} title="บันทึกกิจกรรมประจำวัน" icon="📷">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>เด็ก</label>
                        <select
                            value={form.childId}
                            onChange={e => setForm(f => ({ ...f, childId: e.target.value }))}
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none input-field"
                        >
                            {children.map(c => <option key={c.id} value={c.id}>{c.nickname} — {c.firstName}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>อารมณ์วันนี้</label>
                        <div className="flex gap-2">
                            {Object.entries(moodConfig).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    onClick={() => setForm(f => ({ ...f, mood: key }))}
                                    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                                    style={{
                                        background: form.mood === key ? cfg.color : 'var(--cream)',
                                        border: `2px solid ${form.mood === key ? 'var(--sage)' : 'transparent'}`,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span className="text-2xl">{cfg.icon}</span>
                                    <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{cfg.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>🍚 การรับประทานอาหาร</label>
                        <div className="flex gap-2 flex-wrap">
                            {mealsOptions.map(m => (
                                <button
                                    key={m}
                                    onClick={() => setForm(f => ({ ...f, meals: m }))}
                                    className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                                    style={{
                                        background: form.meals === m ? 'var(--leaf)' : 'var(--cream)',
                                        color: form.meals === m ? 'white' : 'var(--text)',
                                        border: 'none', cursor: 'pointer',
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        <input
                            value={form.mealsNote}
                            onChange={e => setForm(f => ({ ...f, mealsNote: e.target.value }))}
                            placeholder="หมายเหตุอาหาร..."
                            className="w-full mt-2 px-3.5 py-2 rounded-xl text-sm outline-none input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>😴 การนอนหลับ (นาที)</label>
                        <input
                            type="number"
                            value={form.sleepMinutes}
                            onChange={e => setForm(f => ({ ...f, sleepMinutes: e.target.value }))}
                            placeholder="เช่น 90 = 1 ชม. 30 นาที"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>🎨 กิจกรรมที่ทำ</label>
                        <div className="flex flex-wrap gap-2">
                            {activityOptions.map(act => (
                                <button
                                    key={act}
                                    onClick={() => toggleActivity(act)}
                                    className="px-3 py-1.5 rounded-xl text-sm transition-all"
                                    style={{
                                        background: form.activities.includes(act) ? '#D8F3DC' : 'var(--cream)',
                                        color: form.activities.includes(act) ? '#1B4332' : 'var(--text)',
                                        border: `1px solid ${form.activities.includes(act) ? 'var(--sage)' : 'transparent'}`,
                                        fontWeight: form.activities.includes(act) ? 600 : 400,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {form.activities.includes(act) ? '✓ ' : ''}{act}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>📝 หมายเหตุครู</label>
                        <textarea
                            value={form.teacherNote}
                            onChange={e => setForm(f => ({ ...f, teacherNote: e.target.value }))}
                            rows={2}
                            placeholder="บันทึกเพิ่มเติมสำหรับผู้ปกครอง..."
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none input-field"
                            style={{ resize: 'none' }}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-5">
                    <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm btn-secondary">ยกเลิก</button>
                    <button onClick={handleSubmit} disabled={saving || !form.childId} className="flex-1 py-2.5 rounded-xl text-sm btn-primary">
                        {saving ? '⏳ กำลังบันทึก...' : '✅ บันทึก'}
                    </button>
                </div>
            </Modal>
        </div>
    )
}