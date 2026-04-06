// app/(dashboard)/activities/page.tsx
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Modal from '@/app/components/ui/Modal'
import { CardGridSkeleton } from '@/app/components/ui/Skeleton'
import { Smile, Meh, Frown, Thermometer, Utensils, Moon, FileText, Camera, Download } from 'lucide-react'
import { exportCSV, exportPDF } from '@/lib/exportUtils'
import { useChildcareStore } from '@/store/useStore'
import {
    EnrollmentStatus,
    ENROLLMENT_STATUSES,
    enrollmentStatusLabels,
} from '@/lib/enrollmentStatus'

interface Child { id: number; nickname: string; firstName: string; gender: string }
interface Activity {
    id: number; childId: number; date: string
    meals: string | null; mealsNote: string | null
    sleepMinutes: number | null; sleepNote: string | null
    activities: string[]; activitiesNote: string | null
    mood: string | null; teacherNote: string | null
    child?: Child
}

const moodConfig: Record<string, { icon: React.ReactNode; label: string; bg: string }> = {
    happy: { icon: <Smile size={20} />, label: 'แจ่มใส', bg: 'oklch(0.93 0.04 160)' },
    neutral: { icon: <Meh size={20} />, label: 'ปกติ', bg: 'var(--warm)' },
    sad: { icon: <Frown size={20} />, label: 'เศร้า', bg: 'oklch(0.94 0.03 240)' },
    sick: { icon: <Thermometer size={20} />, label: 'ไม่สบาย', bg: 'oklch(0.95 0.04 25)' },
}

const activityOptions = ['วาดรูป', 'ระบายสี', 'เล่นบล็อก', 'ร้องเพลง', 'เล่านิทาน', 'เล่นน้ำ', 'ออกกำลังกาย', 'ปั้นดินน้ำมัน', 'เล่นเสรี', 'เรียนคณิต', 'เรียนภาษา']
const mealsOptions = ['กินหมด', 'กินมาก', 'กินปกติ', 'กินน้อย', 'ไม่กิน']

export default function ActivitiesPage() {
    const [children, setChildren] = useState<Child[]>([])
    const [activities, setActivities] = useState<Activity[]>([])
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedEnrollmentStatus, setSelectedEnrollmentStatus] = useState<EnrollmentStatus | 'all'>('active')
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
    const { activeYear, fetchAcademicYears } = useChildcareStore()

    const fetchActivities = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/activities?date=${date}`)
            setActivities(await res.json())
        } finally {
            setLoading(false)
        }
    }, [date])

    useEffect(() => {
        if (!activeYear) {
            void fetchAcademicYears()
        }
    }, [activeYear, fetchAcademicYears])

    useEffect(() => {
        const params = new URLSearchParams({ lite: '1', status: selectedEnrollmentStatus })
        if (activeYear?.id) params.set('yearId', String(activeYear.id))

        fetch(`/api/children?${params.toString()}`).then(r => r.json()).then(d => {
            setChildren(d)
            setForm(f => ({
                ...f,
                childId:
                    d.some((child: Child) => String(child.id) === f.childId)
                        ? f.childId
                        : d.length
                            ? String(d[0].id)
                            : '',
            }))
        })
    }, [activeYear?.id, selectedEnrollmentStatus])

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void fetchActivities()
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [fetchActivities])

    const toggleActivity = (act: string) => {
        setForm(f => ({
            ...f,
            activities: f.activities.includes(act)
                ? f.activities.filter(a => a !== act)
                : [...f.activities, act],
        }))
    }

    const handleSubmit = async () => {
        if (!activeYear) return
        setSaving(true)
        const res = await fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form, date,
                academicYearId: activeYear.id,
                childId: Number(form.childId),
                sleepMinutes: form.sleepMinutes ? Number(form.sleepMinutes) : null,
            }),
        })
        if (res.ok) { setShowForm(false); await fetchActivities() }
        setSaving(false)
    }

    const activityMap = useMemo(
        () => new Map(activities.map((activity) => [activity.childId, activity])),
        [activities]
    )
    const getActivity = useCallback((childId: number) => activityMap.get(childId), [activityMap])

    return (
        <div className="space-y-4 animate-fade-up">
            {/* Top bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <input
                        type="date" value={date}
                        onChange={e => setDate(e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-sm input-field"
                    />
                    <select
                        value={selectedEnrollmentStatus}
                        onChange={e => setSelectedEnrollmentStatus(e.target.value as EnrollmentStatus | 'all')}
                        className="px-3 py-1.5 rounded-lg text-sm input-field"
                    >
                        <option value="all">ทุกสถานะ</option>
                        {ENROLLMENT_STATUSES.map(status => (
                            <option key={status} value={status}>
                                {enrollmentStatusLabels[status]}
                            </option>
                        ))}
                    </select>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        บันทึกแล้ว {activities.length}/{children.length} คน
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            const headers = ['ชื่อเล่น', 'ชื่อจริง', 'อารมณ์', 'อาหาร', 'นอน(นาที)', 'กิจกรรม', 'หมายเหตุครู']
                            const rows = children.map(c => {
                                const act = getActivity(c.id)
                                return [
                                    c.nickname, c.firstName,
                                    act?.mood ? (moodConfig[act.mood]?.label ?? '-') : '-',
                                    act?.meals ?? '-',
                                    act?.sleepMinutes ?? '-',
                                    act?.activities?.join(', ') ?? '-',
                                    act?.teacherNote ?? '-',
                                ]
                            })
                            exportCSV(headers, rows, `activities-${date}`)
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
                        style={{ background: 'white', color: 'var(--muted)', border: '1px solid var(--warm)' }}
                    >
                        <Download size={12} /> CSV
                    </button>
                    <button
                        onClick={() => {
                            const headers = ['ชื่อเล่น', 'ชื่อจริง', 'อารมณ์', 'อาหาร', 'นอน(นาที)', 'กิจกรรม', 'หมายเหตุครู']
                            const rows = children.map(c => {
                                const act = getActivity(c.id)
                                return [
                                    c.nickname, c.firstName,
                                    act?.mood ? (moodConfig[act.mood]?.label ?? '-') : '-',
                                    act?.meals ?? '-',
                                    act?.sleepMinutes ?? '-',
                                    act?.activities?.join(', ') ?? '-',
                                    act?.teacherNote ?? '-',
                                ]
                            })
                            exportPDF(`กิจกรรมประจำวัน — ${date}`, headers, rows, `activities-${date}`, [
                                { label: 'วันที่', value: new Date(date).toLocaleDateString('th-TH') },
                                { label: 'บันทึกแล้ว', value: `${activities.length}/${children.length} คน` },
                            ])
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
                        style={{ background: 'white', color: 'var(--muted)', border: '1px solid var(--warm)' }}
                    >
                        <Download size={12} /> PDF
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold btn-primary"
                    >
                        + บันทึกกิจกรรม
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            {children.length > 0 && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--warm)' }}>
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: `${(activities.length / children.length) * 100}%`,
                            background: 'var(--sage)',
                            transition: 'width 0.5s var(--ease-out-expo)',
                        }}
                    />
                </div>
            )}

            {/* Child cards */}
            {loading ? <CardGridSkeleton count={6} /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {children.map(child => {
                        const act = getActivity(child.id)
                        return (
                            <div
                                key={child.id}
                                className="card rounded-xl p-4"
                                style={{ borderColor: act ? 'var(--sage)' : 'var(--warm)' }}
                            >
                                {/* Child header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                        style={{
                                            background: child.gender === 'male' ? 'oklch(0.90 0.04 240)' : 'oklch(0.92 0.04 350)',
                                            color: child.gender === 'male' ? 'var(--sky)' : 'oklch(0.50 0.12 350)',
                                        }}
                                    >
                                        {child.nickname.slice(0, 1)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{child.nickname}</p>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{child.firstName}</p>
                                    </div>
                                    {act?.mood && (
                                        <span className="flex items-center text-[var(--text)]">{moodConfig[act.mood]?.icon}</span>
                                    )}
                                </div>

                                {act ? (
                                    <div className="space-y-2">
                                        {act.meals && (
                                            <div className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-2" style={{ background: 'var(--cream)' }}>
                                                <Utensils size={14} className="opacity-70" />
                                                <span style={{ color: 'var(--text)' }}>{act.meals}{act.mealsNote && ` · ${act.mealsNote}`}</span>
                                            </div>
                                        )}
                                        {act.sleepMinutes && (
                                            <div className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-2" style={{ background: 'var(--cream)' }}>
                                                <Moon size={14} className="opacity-70" />
                                                <span style={{ color: 'var(--text)' }}>
                                                    {Math.floor(act.sleepMinutes / 60) > 0 ? `${Math.floor(act.sleepMinutes / 60)} ชม. ` : ''}
                                                    {act.sleepMinutes % 60 > 0 ? `${act.sleepMinutes % 60} นาที` : ''}
                                                </span>
                                            </div>
                                        )}
                                        {act.activities.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {act.activities.map(a => (
                                                    <span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'oklch(0.93 0.04 160)', color: 'var(--leaf)' }}>{a}</span>
                                                ))}
                                            </div>
                                        )}
                                        {act.teacherNote && (
                                            <p className="text-xs italic flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                                                <FileText size={12} /> {act.teacherNote}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className="rounded-lg py-4 text-center cursor-pointer"
                                        style={{ background: 'var(--cream)', border: '1px dashed var(--sand)' }}
                                        onClick={() => { setForm(f => ({ ...f, childId: String(child.id) })); setShowForm(true) }}
                                    >
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>ยังไม่มีบันทึก · คลิกเพื่อเพิ่ม</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            <Modal open={showForm} onClose={() => setShowForm(false)} title="บันทึกกิจกรรมประจำวัน" icon={<Camera size={20} />}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>เด็ก</label>
                        <select
                            value={form.childId}
                            onChange={e => setForm(f => ({ ...f, childId: e.target.value }))}
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field"
                        >
                            {children.map(c => <option key={c.id} value={c.id}>{c.nickname} — {c.firstName}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>อารมณ์วันนี้</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(moodConfig).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    onClick={() => setForm(f => ({ ...f, mood: key }))}
                                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl"
                                    style={{
                                        background: form.mood === key ? cfg.bg : 'var(--cream)',
                                        border: `2px solid ${form.mood === key ? 'var(--sage)' : 'transparent'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s var(--ease-out-quart)',
                                    }}
                                >
                                    <span className="flex items-center justify-center h-7 text-[var(--text)]">{cfg.icon}</span>
                                    <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{cfg.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>การรับประทานอาหาร</label>
                        <div className="flex gap-1.5 flex-wrap">
                            {mealsOptions.map(m => (
                                <button
                                    key={m}
                                    onClick={() => setForm(f => ({ ...f, meals: m }))}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium"
                                    style={{
                                        background: form.meals === m ? 'var(--leaf)' : 'var(--cream)',
                                        color: form.meals === m ? 'white' : 'var(--text)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s var(--ease-out-quart)',
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
                            className="w-full mt-2 px-3.5 py-2 rounded-xl text-sm input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>การนอนหลับ (นาที)</label>
                        <input
                            type="number" value={form.sleepMinutes}
                            onChange={e => setForm(f => ({ ...f, sleepMinutes: e.target.value }))}
                            placeholder="เช่น 90 = 1 ชม. 30 นาที"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>กิจกรรมที่ทำ</label>
                        <div className="flex flex-wrap gap-1.5">
                            {activityOptions.map(act => (
                                <button
                                    key={act}
                                    onClick={() => toggleActivity(act)}
                                    className="px-3 py-1.5 rounded-lg text-sm"
                                    style={{
                                        background: form.activities.includes(act) ? 'oklch(0.93 0.04 160)' : 'var(--cream)',
                                        color: form.activities.includes(act) ? 'var(--leaf)' : 'var(--text)',
                                        fontWeight: form.activities.includes(act) ? 600 : 400,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s var(--ease-out-quart)',
                                    }}
                                >
                                    {form.activities.includes(act) ? '✓ ' : ''}{act}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>หมายเหตุครู</label>
                        <textarea
                            value={form.teacherNote}
                            onChange={e => setForm(f => ({ ...f, teacherNote: e.target.value }))}
                            rows={2} placeholder="บันทึกเพิ่มเติมสำหรับผู้ปกครอง..."
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field"
                            style={{ resize: 'none' }}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-5">
                    <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm btn-secondary">ยกเลิก</button>
                    <button onClick={handleSubmit} disabled={saving || !form.childId || !activeYear} className="flex-1 py-2.5 rounded-xl text-sm btn-primary disabled:opacity-50">
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </Modal>
        </div>
    )
}
