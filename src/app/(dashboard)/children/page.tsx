// app/(dashboard)/children/page.tsx
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/app/components/ui/Skeleton'
import { Download, School, Search, Baby, Cake, User, Stethoscope, Loader2, CheckCircle2, PlusCircle, AlertCircle, Zap, Users, Copy, Sparkles, Eye, MapPin } from 'lucide-react'
import { exportCSV, exportPDF } from '@/lib/exportUtils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClassLevel {
    id: number
    code: string
    name: string
    color: string
    minAgeMonths: number
    maxAgeMonths: number
    order: number
    _count?: { enrollments: number }
}

interface AcademicYear {
    id: number
    year: string
    name: string
    isActive: boolean
    classLevels: ClassLevel[]
    _count?: { enrollments: number }
}

interface Child {
    id: number
    code: string
    firstName: string
    lastName: string
    nickname: string
    gender: string
    dateOfBirth: string
    disease: string | null
    allergy: string | null
    parentName: string
    parentPhone: string
    qrToken: string
}

interface Enrollment {
    id: number
    childId: number
    status: string
    child: Child
    level: ClassLevel
}

type MainTab = 'roster' | 'add' | 'import' | 'manage-levels'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAge(dob: string) {
    const b = new Date(dob), n = new Date()
    let y = n.getFullYear() - b.getFullYear()
    let m = n.getMonth() - b.getMonth()
    if (m < 0) { y--; m += 12 }
    return { text: `${y} ปี ${m} เดือน`, months: y * 12 + m }
}

function getLevelColor(color: string) {
    const map: Record<string, { bg: string; text: string }> = {
        '#F4A261': { bg: 'oklch(0.95 0.04 70)', text: 'oklch(0.40 0.08 70)' },
        '#52B788': { bg: 'oklch(0.95 0.04 160)', text: 'oklch(0.32 0.07 160)' },
        '#457B9D': { bg: 'oklch(0.94 0.03 240)', text: 'oklch(0.35 0.07 240)' },
        '#E76F51': { bg: 'oklch(0.95 0.04 25)', text: 'oklch(0.38 0.10 25)' },
        '#E9C46A': { bg: 'oklch(0.96 0.04 90)', text: 'oklch(0.42 0.08 90)' },
        '#9B72CF': { bg: 'oklch(0.95 0.04 300)', text: 'oklch(0.38 0.10 300)' },
    }
    return map[color] ?? { bg: 'var(--cream)', text: 'var(--muted)' }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChildrenPage() {
    const [years, setYears] = useState<AcademicYear[]>([])
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
    const [selectedLevelId, setSelectedLevelId] = useState<number | 'all'>('all')
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [loading, setLoading] = useState(false)
    const [mainTab, setMainTab] = useState<MainTab>('roster')
    const [search, setSearch] = useState('')

    // ── Load academic years ──
    const loadYears = useCallback(async () => {
        const data: AcademicYear[] = await fetch('/api/academic-years').then(r => r.json())
        setYears(data)
        const active = data.find(y => y.isActive)
        if (active) setSelectedYearId(active.id)
    }, [])

    useEffect(() => { loadYears() }, [loadYears])

    // ── Load enrollments ──
    const loadEnrollments = useCallback(async () => {
        if (!selectedYearId) return
        setLoading(true)
        const params = new URLSearchParams({ yearId: String(selectedYearId) })
        if (selectedLevelId !== 'all') params.set('levelId', String(selectedLevelId))
        const data = await fetch(`/api/enrollments?${params}`).then(r => r.json())
        setEnrollments(data)
        setLoading(false)
    }, [selectedYearId, selectedLevelId])

    useEffect(() => { loadEnrollments() }, [loadEnrollments])

    const activeYear = years.find(y => y.id === selectedYearId)
    const levels = activeYear?.classLevels ?? []

    const filtered = useMemo(() => enrollments.filter(e =>
        `${e.child.nickname}${e.child.firstName}${e.child.lastName}${e.child.code}`
            .toLowerCase().includes(search.toLowerCase())
    ), [enrollments, search])

    // Count per level
    const levelCounts = useMemo(() => levels.map(l => ({
        ...l,
        count: enrollments.filter(e => e.level.id === l.id).length,
    })), [levels, enrollments])

    return (
        <div className="space-y-4 animate-fade-up">

            {/* ── Top bar: ปีการศึกษา ── */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>ปีการศึกษา</span>
                    <select
                        value={selectedYearId ?? ''}
                        onChange={e => { setSelectedYearId(Number(e.target.value)); setSelectedLevelId('all') }}
                        className="text-sm rounded-xl px-3 py-2 font-semibold input-field"
                    >
                        {years.map(y => (
                            <option key={y.id} value={y.id}>
                                {y.name} {y.isActive ? '(ปัจจุบัน)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="md:ml-auto flex flex-wrap gap-2">
                    {(['roster', 'add', 'import', 'manage-levels'] as MainTab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setMainTab(t)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{
                                background: mainTab === t ? 'var(--leaf)' : 'white',
                                color: mainTab === t ? 'white' : 'var(--muted)',
                                border: `1px solid ${mainTab === t ? 'var(--leaf)' : 'var(--warm)'}`,
                                transition: 'all 0.15s var(--ease-out-quart)',
                            }}
                        >
                            {t === 'roster' ? 'ทะเบียนนักเรียน'
                                : t === 'add' ? 'เพิ่มเด็ก'
                                    : t === 'import' ? 'นำเข้า JSON'
                                        : 'จัดการระดับชั้น'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Level summary cards ── */}
            {mainTab === 'roster' && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* All */}
                        <button
                            onClick={() => setSelectedLevelId('all')}
                            className="rounded-2xl p-4 text-left transition-all"
                            style={{
                                background: selectedLevelId === 'all' ? 'var(--forest)' : 'white',
                                border: `2px solid ${selectedLevelId === 'all' ? 'var(--forest)' : 'var(--warm)'}`,
                                boxShadow: selectedLevelId === 'all' ? '0 4px 16px rgba(28,61,46,0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                            }}
                        >
                            <div className="mb-2"><School size={28} style={{ color: selectedLevelId === 'all' ? 'white' : 'var(--text)', opacity: selectedLevelId === 'all' ? 1 : 0.7 }} /></div>
                            <div
                                className="text-2xl font-bold"
                                style={{ color: selectedLevelId === 'all' ? 'white' : 'var(--text)' }}
                            >
                                {enrollments.length}
                            </div>
                            <div
                                className="text-xs mt-0.5"
                                style={{ color: selectedLevelId === 'all' ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}
                            >
                                ทั้งหมด
                            </div>
                        </button>

                        {levelCounts.map(lv => {
                            const active = selectedLevelId === lv.id
                            const c = getLevelColor(lv.color)
                            return (
                                <button
                                    key={lv.id}
                                    onClick={() => setSelectedLevelId(lv.id)}
                                    className="rounded-2xl p-4 text-left transition-all"
                                    style={{
                                        background: active ? lv.color : 'white',
                                        border: `2px solid ${active ? lv.color : 'var(--warm)'}`,
                                        boxShadow: active ? `0 4px 16px ${lv.color}55` : '0 2px 8px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <div
                                        className="text-xs font-bold mb-1 px-2 py-0.5 rounded-full inline-block"
                                        style={{
                                            background: active ? 'rgba(255,255,255,0.25)' : c.bg,
                                            color: active ? 'white' : c.text,
                                        }}
                                    >
                                        {lv.code}
                                    </div>
                                    <div
                                        className="text-2xl font-bold"
                                        style={{ color: active ? 'white' : 'var(--text)' }}
                                    >
                                        {lv.count}
                                    </div>
                                    <div
                                        className="text-xs mt-0.5"
                                        style={{ color: active ? 'rgba(255,255,255,0.85)' : 'var(--muted)' }}
                                    >
                                        {lv.name}
                                    </div>
                                    <div
                                        className="text-xs mt-0.5"
                                        style={{ color: active ? 'rgba(255,255,255,0.6)' : 'var(--sand)' }}
                                    >
                                        อายุ {Math.floor(lv.minAgeMonths / 12)}-{Math.floor(lv.maxAgeMonths / 12)} ปี
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* Search + Export */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--muted)' }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="ค้นหาชื่อ ชื่อเล่น หรือรหัส..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm input-field"
                            />
                        </div>
                        <button
                            onClick={() => {
                                const headers = ['รหัส', 'ชื่อเล่น', 'ชื่อ-สกุล', 'อายุ', 'ชั้น', 'ผู้ปกครอง', 'เบอร์โทร', 'โรคประจำตัว']
                                const rows = filtered.map(e => [
                                    e.child.code, e.child.nickname,
                                    `${e.child.firstName} ${e.child.lastName}`,
                                    calcAge(e.child.dateOfBirth).text,
                                    e.level.name, e.child.parentName, e.child.parentPhone,
                                    e.child.disease ?? '-',
                                ])
                                exportCSV(headers, rows, 'children-roster')
                            }}
                            className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                            style={{ background: 'white', color: 'var(--muted)', border: '1px solid var(--warm)' }}
                        >
                            <Download size={12} /> CSV
                        </button>
                        <button
                            onClick={() => {
                                const headers = ['รหัส', 'ชื่อเล่น', 'ชื่อ-สกุล', 'อายุ', 'ชั้น', 'ผู้ปกครอง', 'เบอร์โทร', 'โรคประจำตัว']
                                const rows = filtered.map(e => [
                                    e.child.code, e.child.nickname,
                                    `${e.child.firstName} ${e.child.lastName}`,
                                    calcAge(e.child.dateOfBirth).text,
                                    e.level.name, e.child.parentName, e.child.parentPhone,
                                    e.child.disease ?? '-',
                                ])
                                exportPDF('ทะเบียนนักเรียน', headers, rows, 'children-roster', [
                                    { label: 'ปีการศึกษา', value: activeYear?.name ?? '-' },
                                    { label: 'จำนวน', value: `${filtered.length} คน` },
                                ])
                            }}
                            className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                            style={{ background: 'white', color: 'var(--muted)', border: '1px solid var(--warm)' }}
                        >
                            <Download size={12} /> PDF
                        </button>
                    </div>

                    {/* Child grid */}
                    <ChildGrid
                        enrollments={filtered}
                        loading={loading}
                        levels={levels}
                        yearId={selectedYearId}
                        onRefresh={loadEnrollments}
                    />
                </>
            )}

            {mainTab === 'add' && (
                <AddChildForm
                    years={years}
                    selectedYearId={selectedYearId}
                    onSuccess={() => { setMainTab('roster'); loadEnrollments() }}
                />
            )}

            {mainTab === 'import' && (
                <ImportJSON
                    selectedYearId={selectedYearId}
                    levels={levels}
                    onSuccess={() => { setMainTab('roster'); loadEnrollments() }}
                />
            )}

            {mainTab === 'manage-levels' && selectedYearId && (
                <ManageLevels
                    yearId={selectedYearId}
                    levels={levels}
                    onRefresh={loadYears}
                />
            )}
        </div>
    )
}

// ─── ChildGrid ────────────────────────────────────────────────────────────────
function ChildGrid({
    enrollments, loading, levels, yearId, onRefresh,
}: {
    enrollments: Enrollment[]
    loading: boolean
    levels: ClassLevel[]
    yearId: number | null
    onRefresh: () => void
}) {
    const [movingId, setMovingId] = useState<number | null>(null)
    const [targetLevel, setTargetLevel] = useState<Record<number, number>>({})

    const handleMove = async (childId: number, levelId: number) => {
        if (!yearId) return
        setMovingId(childId)
        await fetch('/api/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ childId, academicYearId: yearId, levelId }),
        })
        setMovingId(null)
        onRefresh()
    }

    if (loading) return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-9 w-24 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-20 mb-1.5" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-12 rounded-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    if (enrollments.length === 0) return (
        <div
            className="py-16 text-center rounded-2xl"
            style={{ background: 'white', border: '1px solid var(--warm)' }}
        >
            <Baby size={56} className="mx-auto mb-4" style={{ color: 'var(--muted)', opacity: 0.3 }} />
            <p className="font-semibold" style={{ color: 'var(--text)' }}>ไม่พบรายชื่อเด็ก</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>ลองเปลี่ยนระดับชั้น หรือเพิ่มเด็กใหม่</p>
        </div>
    )

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {enrollments.map(e => {
                const { text: ageText } = calcAge(e.child.dateOfBirth)
                const c = getLevelColor(e.level.color)

                return (
                    <div
                        key={e.id}
                        className="card card-interactive rounded-2xl overflow-hidden"
                    >
                        <div className="p-4">
                            {/* Avatar + name */}
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                                    style={{
                                        background: e.child.gender === 'male' ? 'oklch(0.90 0.04 240)' : 'oklch(0.92 0.04 350)',
                                        color: e.child.gender === 'male' ? 'var(--sky)' : 'oklch(0.50 0.12 350)',
                                    }}
                                >
                                    {e.child.nickname.slice(0, 1)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>
                                        {e.child.nickname}
                                    </p>
                                    <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                                        {e.child.firstName} {e.child.lastName}
                                    </p>
                                </div>
                                <Link
                                    href={`/children/${e.child.id}`}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                                    style={{ background: 'var(--cream)', color: 'var(--muted)' }}
                                >
                                    →
                                </Link>
                            </div>

                            {/* Info */}
                            <div className="space-y-1.5 mb-3">
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: c.bg, color: c.text }}
                                    >
                                        {e.level.name}
                                    </span>
                                    <span
                                        className="text-xs font-mono px-2 py-0.5 rounded-lg"
                                        style={{ background: 'var(--cream)', color: 'var(--muted)' }}
                                    >
                                        {e.child.code}
                                    </span>
                                </div>
                                <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                                    <Cake size={14} /> {ageText}
                                </p>
                                <p className="text-xs truncate flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                                    <User size={14} /> <span>{e.child.parentName} · {e.child.parentPhone}</span>
                                </p>
                                {e.child.disease && (
                                    <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--coral)' }}>
                                        <Stethoscope size={14} /> {e.child.disease}
                                    </p>
                                )}
                            </div>

                            {/* Move level */}
                            {levels.length > 1 && (
                                <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--warm)' }}>
                                    <select
                                        value={targetLevel[e.child.id] ?? e.level.id}
                                        onChange={ev => setTargetLevel(prev => ({ ...prev, [e.child.id]: Number(ev.target.value) }))}
                                        className="flex-1 text-xs rounded-lg px-2 py-1.5 outline-none"
                                        style={{ border: '1px solid var(--warm)', background: 'var(--cream)', color: 'var(--text)' }}
                                    >
                                        {levels.map(lv => (
                                            <option key={lv.id} value={lv.id}>{lv.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleMove(e.child.id, targetLevel[e.child.id] ?? e.level.id)}
                                        disabled={
                                            movingId === e.child.id ||
                                            (targetLevel[e.child.id] ?? e.level.id) === e.level.id
                                        }
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-30"
                                        style={{ background: 'var(--leaf)' }}
                                    >
                                        {movingId === e.child.id ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'ย้าย'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ─── ManageLevels ─────────────────────────────────────────────────────────────
function ManageLevels({
    yearId, levels, onRefresh,
}: {
    yearId: number
    levels: ClassLevel[]
    onRefresh: () => void
}) {
    const [form, setForm] = useState({
        code: '', name: '', minAgeMonths: '', maxAgeMonths: '', color: '#52B788', order: '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [editId, setEditId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<Partial<ClassLevel>>({})
    const [deleting, setDeleting] = useState<number | null>(null)

    const COLORS = [
        { hex: '#F4A261', label: 'ส้ม' },
        { hex: '#52B788', label: 'เขียว' },
        { hex: '#457B9D', label: 'น้ำเงิน' },
        { hex: '#E76F51', label: 'แดง' },
        { hex: '#E9C46A', label: 'เหลือง' },
        { hex: '#9B72CF', label: 'ม่วง' },
    ]

    const handleAdd = async () => {
        if (!form.code || !form.name) return setError('กรุณากรอก Code และชื่อระดับชั้น')
        setSaving(true); setError('')
        const res = await fetch(`/api/academic-years/${yearId}/levels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                minAgeMonths: Number(form.minAgeMonths),
                maxAgeMonths: Number(form.maxAgeMonths),
                order: Number(form.order || levels.length),
            }),
        })
        if (res.ok) {
            setForm({ code: '', name: '', minAgeMonths: '', maxAgeMonths: '', color: '#52B788', order: '' })
            onRefresh()
        } else {
            const d = await res.json()
            setError(d.message ?? 'เกิดข้อผิดพลาด')
        }
        setSaving(false)
    }

    const handleEdit = async (id: number) => {
        await fetch(`/api/academic-years/${yearId}/levels/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        })
        setEditId(null)
        onRefresh()
    }

    const handleDelete = async (id: number) => {
        setDeleting(id)
        const res = await fetch(`/api/academic-years/${yearId}/levels/${id}`, { method: 'DELETE' })
        if (!res.ok) {
            const d = await res.json()
            alert(d.message)
        } else {
            onRefresh()
        }
        setDeleting(null)
    }

    const inputStyle = {
        border: '1px solid var(--warm)',
        background: 'white',
        color: 'var(--text)',
    }

    return (
        <div className="space-y-5 max-w-2xl">
            {/* Current levels */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
                <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--warm)' }}>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>ระดับชั้นในปีการศึกษานี้</h3>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{levels.length} ระดับ</span>
                </div>

                {levels.length === 0 ? (
                    <div className="py-10 text-center">
                        <School size={48} className="mx-auto mb-3" style={{ color: 'var(--muted)', opacity: 0.3 }} />
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>ยังไม่มีระดับชั้น</p>
                    </div>
                ) : (
                    levels.map(lv => {
                        const c = getLevelColor(lv.color)
                        const isEdit = editId === lv.id

                        return (
                            <div
                                key={lv.id}
                                className="px-5 py-3.5"
                                style={{ borderBottom: '1px solid var(--warm)' }}
                            >
                                {isEdit ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>ชื่อระดับชั้น</label>
                                                <input
                                                    value={editForm.name ?? lv.name}
                                                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                                    style={inputStyle}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>สี</label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {COLORS.map(col => (
                                                        <button
                                                            key={col.hex}
                                                            onClick={() => setEditForm(f => ({ ...f, color: col.hex }))}
                                                            className="w-7 h-7 rounded-full border-2 transition-transform"
                                                            style={{
                                                                background: col.hex,
                                                                borderColor: (editForm.color ?? lv.color) === col.hex ? 'var(--text)' : 'transparent',
                                                                transform: (editForm.color ?? lv.color) === col.hex ? 'scale(1.2)' : 'scale(1)',
                                                            }}
                                                            title={col.label}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>อายุขั้นต่ำ (เดือน)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.minAgeMonths ?? lv.minAgeMonths}
                                                    onChange={e => setEditForm(f => ({ ...f, minAgeMonths: Number(e.target.value) }))}
                                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                                    style={inputStyle}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>อายุสูงสุด (เดือน)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.maxAgeMonths ?? lv.maxAgeMonths}
                                                    onChange={e => setEditForm(f => ({ ...f, maxAgeMonths: Number(e.target.value) }))}
                                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                                    style={inputStyle}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(lv.id)}
                                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                                                style={{ background: 'var(--leaf)' }}
                                            >
                                                <CheckCircle2 size={16} /> บันทึก
                                            </button>
                                            <button
                                                onClick={() => { setEditId(null); setEditForm({}) }}
                                                className="px-4 py-2 rounded-xl text-xs font-semibold"
                                                style={{ background: 'var(--cream)', color: 'var(--text)' }}
                                            >
                                                ยกเลิก
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-10 rounded-full shrink-0" style={{ background: lv.color }} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: c.bg, color: c.text }}
                                                >
                                                    {lv.code}
                                                </span>
                                                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                                                    {lv.name}
                                                </span>
                                            </div>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                                อายุ {lv.minAgeMonths}–{lv.maxAgeMonths} เดือน
                                                ({Math.floor(lv.minAgeMonths / 12)} ปี – {Math.floor(lv.maxAgeMonths / 12)} ปี)
                                                · {lv._count?.enrollments ?? 0} คน
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => { setEditId(lv.id); setEditForm({}) }}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                style={{ background: '#EFF4FF', color: 'var(--sky)' }}
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                onClick={() => handleDelete(lv.id)}
                                                disabled={deleting === lv.id}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                                                style={{ background: '#FFF0ED', color: 'var(--coral)' }}
                                            >
                                                {deleting === lv.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'ลบ'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Add new level */}
            <div
                className="rounded-2xl p-5"
                style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    <PlusCircle size={18} /> เพิ่มระดับชั้นใหม่
                </h3>

                {error && (
                    <div className="mb-3 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2" style={{ background: '#FFF0ED', color: 'var(--coral)' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                            Code <span style={{ color: 'var(--coral)' }}>*</span>
                        </label>
                        <input
                            value={form.code}
                            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                            placeholder="KG0"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                            ชื่อระดับชั้น <span style={{ color: 'var(--coral)' }}>*</span>
                        </label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="เตรียมอนุบาล"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                            อายุขั้นต่ำ (เดือน)
                        </label>
                        <input
                            type="number"
                            value={form.minAgeMonths}
                            onChange={e => setForm(f => ({ ...f, minAgeMonths: e.target.value }))}
                            placeholder="24"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                            อายุสูงสุด (เดือน)
                        </label>
                        <input
                            type="number"
                            value={form.maxAgeMonths}
                            onChange={e => setForm(f => ({ ...f, maxAgeMonths: e.target.value }))}
                            placeholder="35"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={inputStyle}
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>สีประจำชั้น</label>
                        <div className="flex gap-3 flex-wrap">
                            {COLORS.map(col => (
                                <button
                                    key={col.hex}
                                    onClick={() => setForm(f => ({ ...f, color: col.hex }))}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all"
                                    style={{
                                        background: form.color === col.hex ? col.hex : 'white',
                                        borderColor: form.color === col.hex ? col.hex : 'var(--warm)',
                                        color: form.color === col.hex ? 'white' : 'var(--muted)',
                                    }}
                                >
                                    <span
                                        className="w-3 h-3 rounded-full inline-block"
                                        style={{ background: col.hex }}
                                    />
                                    {col.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleAdd}
                    disabled={saving}
                    className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: 'var(--leaf)' }}
                >
                    {saving ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</> : <><PlusCircle size={16} /> เพิ่มระดับชั้น</>}
                </button>
            </div>

            {/* Quick presets */}
            <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--cream)', border: '1px solid var(--warm)' }}
            >
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    <Zap size={18} style={{ color: 'var(--sun)' }} /> เพิ่มระดับชั้นมาตรฐานด่วน
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { code: 'KG0', name: 'เตรียมอนุบาล', min: 24, max: 35, color: '#F4A261' },
                        { code: 'KG1', name: 'อนุบาล 1', min: 36, max: 47, color: '#52B788' },
                        { code: 'KG2', name: 'อนุบาล 2', min: 48, max: 59, color: '#457B9D' },
                        { code: 'KG3', name: 'อนุบาล 3', min: 60, max: 83, color: '#E76F51' },
                    ].map((preset, i) => {
                        const exists = levels.some(l => l.code === preset.code)
                        return (
                            <button
                                key={preset.code}
                                disabled={exists}
                                onClick={async () => {
                                    await fetch(`/api/academic-years/${yearId}/levels`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            code: preset.code, name: preset.name,
                                            minAgeMonths: preset.min, maxAgeMonths: preset.max,
                                            color: preset.color, order: i,
                                        }),
                                    })
                                    onRefresh()
                                }}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                                style={{
                                    background: exists ? 'var(--warm)' : 'white',
                                    border: `1px solid var(--warm)`,
                                    color: exists ? 'var(--sand)' : 'var(--text)',
                                }}
                            >
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: preset.color }} />
                                <span>{preset.name}</span>
                                {exists && <span className="ml-auto text-xs flex items-center gap-1" style={{ color: 'var(--sage)' }}><CheckCircle2 size={14} /> มีแล้ว</span>}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ─── AddChildForm ─────────────────────────────────────────────────────────────
function AddChildForm({
    years, selectedYearId, onSuccess,
}: {
    years: AcademicYear[]
    selectedYearId: number | null
    onSuccess: () => void
}) {
    const activeYear = years.find(y => y.id === selectedYearId)
    const levels = activeYear?.classLevels ?? []

    const [form, setForm] = useState({
        firstName: '', lastName: '', nickname: '',
        gender: 'male', dateOfBirth: '',
        bloodType: '', disease: '', allergy: '',
        parentName: '', parentPhone: '', parentPhone2: '',
        parentRelation: 'mother', address: '',
        academicYearId: selectedYearId ?? '',
        levelId: levels[0]?.id ?? '',
    })

    // Sync levelId if levels change or on mount
    useEffect(() => {
        if (!form.levelId && levels.length > 0) {
            setForm(f => ({ ...f, levelId: levels[0].id }))
        }
    }, [levels, form.levelId])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Auto-suggest level from age
    const suggestLevel = (dob: string) => {
        if (!dob || levels.length === 0) return
        const { months } = calcAge(dob)
        const match = levels.find(l => months >= l.minAgeMonths && months <= l.maxAgeMonths)
        if (match) setForm(f => ({ ...f, levelId: match.id }))
    }

    const set = (k: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const val = e.target.value
            setForm(f => ({ ...f, [k]: val }))
            if (k === 'dateOfBirth') suggestLevel(val)
        }

    const handleSubmit = async () => {
        setSaving(true); setError('')
        const res = await fetch('/api/children', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.message); setSaving(false); return }
        onSuccess()
    }

    const inputClass = "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
    const inputStyle = { border: '1px solid var(--warm)', background: 'white', color: 'var(--text)' }
    const label = (text: string, req = false) => (
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
            {text} {req && <span style={{ color: 'var(--coral)' }}>*</span>}
        </label>
    )

    return (
        <div
            className="rounded-2xl p-6 max-w-2xl"
            style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
            <h2 className="font-bold text-base mb-5 flex items-center gap-1.5" style={{ color: 'var(--text)' }}><Baby size={20} /> เพิ่มข้อมูลเด็กใหม่</h2>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{ background: '#FFF0ED', color: 'var(--coral)' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {/* ปีการศึกษา */}
                <div>
                    {label('ปีการศึกษา', true)}
                    <select
                        value={form.academicYearId}
                        onChange={e => setForm(f => ({ ...f, academicYearId: Number(e.target.value) }))}
                        className={inputClass}
                        style={inputStyle}
                    >
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                </div>

                {/* ระดับชั้น */}
                <div>
                    {label('ระดับชั้น', true)}
                    <select
                        value={form.levelId}
                        onChange={e => setForm(f => ({ ...f, levelId: Number(e.target.value) }))}
                        className={inputClass}
                        style={inputStyle}
                    >
                        {levels.length === 0 ? (
                            <option value="">— ไม่มีระดับชั้น —</option>
                        ) : (
                            levels.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.name} ({Math.floor(l.minAgeMonths / 12)}–{Math.floor(l.maxAgeMonths / 12)} ปี)
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div>{label('ชื่อจริง', true)}<input value={form.firstName} onChange={set('firstName')} placeholder="ชื่อจริง" className={inputClass} style={inputStyle} /></div>
                <div>{label('นามสกุล', true)}<input value={form.lastName} onChange={set('lastName')} placeholder="นามสกุล" className={inputClass} style={inputStyle} /></div>
                <div>{label('ชื่อเล่น', true)}<input value={form.nickname} onChange={set('nickname')} placeholder="ชื่อเล่น" className={inputClass} style={inputStyle} /></div>
                <div>
                    {label('เพศ', true)}
                    <select value={form.gender} onChange={set('gender')} className={inputClass} style={inputStyle}>
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                    </select>
                </div>
                <div>
                    {label('วันเกิด', true)}
                    <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inputClass} style={inputStyle} />
                    {form.dateOfBirth && (
                        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--sage)' }}>
                            <Cake size={12} /> อายุ {calcAge(form.dateOfBirth).text}
                        </p>
                    )}
                </div>
                <div>
                    {label('กรุ๊ปเลือด')}
                    <select value={form.bloodType} onChange={set('bloodType')} className={inputClass} style={inputStyle}>
                        <option value="">ไม่ทราบ</option>
                        {['A', 'B', 'AB', 'O'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div>{label('โรคประจำตัว')}<input value={form.disease} onChange={set('disease')} placeholder="ถ้าไม่มีเว้นว่าง" className={inputClass} style={inputStyle} /></div>
                <div>{label('ภูมิแพ้/แพ้ยา')}<input value={form.allergy} onChange={set('allergy')} placeholder="ถ้าไม่มีเว้นว่าง" className={inputClass} style={inputStyle} /></div>

                <div className="col-span-2 pt-2" style={{ borderTop: '1px solid var(--warm)' }}>
                    <p className="text-sm font-bold mb-3 mt-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}><Users size={16} /> ข้อมูลผู้ปกครอง</p>
                </div>

                <div>{label('ชื่อผู้ปกครอง', true)}<input value={form.parentName} onChange={set('parentName')} placeholder="ชื่อ-นามสกุล" className={inputClass} style={inputStyle} /></div>
                <div>
                    {label('ความสัมพันธ์', true)}
                    <select value={form.parentRelation} onChange={set('parentRelation')} className={inputClass} style={inputStyle}>
                        <option value="mother">แม่</option>
                        <option value="father">พ่อ</option>
                        <option value="guardian">ผู้ปกครอง</option>
                    </select>
                </div>
                <div>{label('เบอร์โทร', true)}<input value={form.parentPhone} onChange={set('parentPhone')} placeholder="08x-xxx-xxxx" className={inputClass} style={inputStyle} /></div>
                <div>{label('เบอร์สำรอง')}<input value={form.parentPhone2} onChange={set('parentPhone2')} placeholder="ไม่บังคับ" className={inputClass} style={inputStyle} /></div>
                <div className="col-span-2">
                    {label('ที่อยู่')}
                    <textarea value={form.address} onChange={set('address')} rows={2} placeholder="ที่อยู่" className={inputClass} style={{ ...inputStyle, resize: 'none' }} />
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={saving || !form.levelId}
                className="mt-5 w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--leaf)' }}
            >
                {saving ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</> : <><CheckCircle2 size={16} /> บันทึกข้อมูล</>}
            </button>
        </div>
    )
}

// ─── ImportJSON ───────────────────────────────────────────────────────────────
function ImportJSON({
    selectedYearId, levels, onSuccess,
}: {
    selectedYearId: number | null
    levels: ClassLevel[]
    onSuccess: () => void
}) {
    const [json, setJson] = useState('')
    const [selectedLevelId, setSelectedLevelId] = useState<number | ''>('')
    const [preview, setPreview] = useState<unknown[] | null>(null)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)

    const example = JSON.stringify([
        {
            firstName: 'สมหมาย', lastName: 'รักดี', nickname: 'หมาย', gender: 'male',
            dateOfBirth: '2022-06-15', parentName: 'นางสุมาลี รักดี', parentPhone: '085-555-1234',
            parentRelation: 'mother', disease: ''
        },
        {
            firstName: 'มาลีวัลย์', lastName: 'ดีงาม', nickname: 'มาลี', gender: 'female',
            dateOfBirth: '2021-03-20', parentName: 'นายสมชาย ดีงาม', parentPhone: '089-876-5432',
            parentRelation: 'father'
        },
    ], null, 2)

    // Auto-validate when JSON or selectedLevelId changes
    useEffect(() => {
        if (json.trim()) {
            try {
                const d = JSON.parse(json)
                setPreview(Array.isArray(d) ? d : [d])
                setError('')
            } catch {
                setPreview(null)
                // Don't set error while typing, only if explicit validate is clicked or on blur
            }
        } else {
            setPreview(null)
            setError('')
        }
    }, [json])

    // Default to first level if none selected but levels exist
    useEffect(() => {
        if (!selectedLevelId && levels.length > 0) {
            setSelectedLevelId(levels[0].id)
        }
    }, [levels, selectedLevelId])

    const validate = (val = json) => {
        setError(''); setPreview(null); setResult(null)
        if (!val.trim()) return
        try {
            const d = JSON.parse(val)
            setPreview(Array.isArray(d) ? d : [d])
        } catch {
            setError('JSON ไม่ถูกต้อง (กรุณาเช็ควงเล็บหรือเครื่องหมายคำพูด)')
        }
    }

    const handleImport = async () => {
        if (!preview || !selectedLevelId) return
        setSaving(true)
        try {
            const res = await fetch('/api/children/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ children: preview, academicYearId: selectedYearId, levelId: Number(selectedLevelId) }),
            })
            const data = await res.json()
            setResult(data)
            if (data.errors?.length === 0) {
                setTimeout(onSuccess, 1500)
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
        }
        setSaving(false)
    }

    const isButtonDisabled = !preview || saving || !selectedLevelId

    return (
        <div
            className="rounded-2xl p-6 max-w-3xl"
            style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
            <h2 className="font-bold text-base mb-1 flex items-center gap-1.5" style={{ color: 'var(--text)' }}><Download size={20} /> นำเข้าข้อมูลเด็กจาก JSON</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>วางข้อมูล JSON แล้วเลือกระดับชั้นที่ต้องการเพิ่ม</p>

            {/* Level selector */}
            <div className="mb-4">
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                    เพิ่มเข้าระดับชั้น <span style={{ color: 'var(--coral)' }}>*</span>
                    {levels.length === 0 && <span className="ml-2 font-normal">(กรุณาสร้างระดับชั้นก่อน ที่เมนู "จัดการระดับชั้น")</span>}
                </label>
                {levels.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                        {levels.map(lv => {
                            const c = getLevelColor(lv.color)
                            const active = selectedLevelId === lv.id
                            return (
                                <button
                                    key={lv.id}
                                    onClick={() => setSelectedLevelId(lv.id)}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                                    style={{
                                        background: active ? lv.color : 'white',
                                        borderColor: active ? lv.color : 'var(--warm)',
                                        color: active ? 'white' : c.text,
                                    }}
                                >
                                    {lv.name}
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <div className="p-3 rounded-xl border-2 border-dashed border-rose-200 bg-rose-50 text-rose-600 text-xs text-center">
                        ยังไม่ได้สร้างระดับชั้นในปีการศึกษานี้
                    </div>
                )}
            </div>

            <details className="mb-3 group">
                <summary className="text-xs cursor-pointer font-semibold list-none flex items-center gap-1" style={{ color: 'var(--sage)' }}>
                    <span className="group-open:rotate-90 transition-transform">▶</span> ดูตัวอย่าง JSON
                </summary>
                <div className="mt-2 text-xs">
                    <pre className="p-3 rounded-xl overflow-auto max-h-48" style={{ background: 'var(--cream)', color: 'var(--text)' }}>
                        {example}
                    </pre>
                    <button
                        onClick={() => {
                            setJson(example)
                            validate(example)
                        }}
                        className="mt-2 px-3 py-1.5 rounded-lg text-white font-semibold flex items-center justify-center gap-1.5"
                        style={{ background: 'var(--leaf)' }}
                    >
                        <Copy size={16} /> คัดลอกตัวอย่างไปใช้
                    </button>
                </div>
            </details>

            <textarea
                value={json}
                onChange={e => {
                    setJson(e.target.value)
                    if (error) setError('') // Clear error when typing
                }}
                onBlur={() => validate()}
                rows={8}
                placeholder='[ { "firstName": "...", ... } ]'
                className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none"
                style={{ border: '1px solid var(--warm)', background: 'var(--cream)', color: 'var(--text)', resize: 'vertical' }}
            />

            {error && <p className="mt-1 text-xs flex items-center gap-1" style={{ color: 'var(--coral)' }}><AlertCircle size={14} /> {error}</p>}

            {preview && (
                <div className="mt-3 p-3 rounded-xl" style={{ background: '#E8F5EE' }}>
                    <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--leaf)' }}>
                        <Sparkles size={16} /> พร้อมนำเข้า {preview.length} รายการ
                        {!selectedLevelId && <span className="text-rose-500 font-normal ml-1">(กรุณาเลือกระดับชั้นด้านบน)</span>}
                    </p>
                    <div className="mt-1 space-y-0.5">
                        {preview.slice(0, 3).map((item, i) => {
                            const c = item as { nickname?: string; firstName?: string; lastName?: string }
                            return <p key={i} className="text-[11px]" style={{ color: 'var(--text)' }}>{i + 1}. {c.nickname || '-'} — {c.firstName || '-'} {c.lastName || '-'}</p>
                        })}
                        {preview.length > 3 && <p className="text-[10px]" style={{ color: 'var(--muted)' }}>... และอีก {preview.length - 3} รายการ</p>}
                    </div>
                </div>
            )}

            {result && (
                <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: result.errors.length === 0 ? '#D8F3DC' : '#FFF8E8' }}>
                    <p className="font-bold flex items-center gap-1"><CheckCircle2 size={16} /> นำเข้าสำเร็จ {result.imported} คน</p>
                    {result.errors.length > 0 && (
                        <div className="mt-1 text-rose-500 max-h-24 overflow-y-auto">
                            {result.errors.map((e, i) => <p key={i}>• {e}</p>)}
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-3 mt-4">
                <button
                    onClick={() => validate()}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                    style={{ background: 'white', color: 'var(--text)', border: '1px solid var(--warm)' }}
                >
                    <Eye size={16} /> ตรวจสอบ JSON
                </button>
                <button
                    onClick={handleImport}
                    disabled={isButtonDisabled}
                    className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${isButtonDisabled ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'}`}
                    style={{ background: 'var(--leaf)' }}
                >
                    {saving ? <><Loader2 size={16} className="animate-spin" /> กำลังนำเข้า...</> : <><Download size={16} /> เริ่มนำเข้าข้อมูล</>}
                </button>
            </div>
            {isButtonDisabled && json.trim() && (
                <div className="mt-3 p-2.5 rounded-xl text-center text-[11px] bg-amber-50 border border-amber-200" style={{ color: 'var(--sun)' }}>
                    {!preview ? <span className="flex items-center justify-center gap-1"><AlertCircle size={14} /> กรุณาตรวจสอบรูปแบบ JSON ให้ถูกต้อง</span> : !selectedLevelId ? <span className="flex items-center justify-center gap-1"><MapPin size={14} /> กรุณาคลิกเลือกระดับชั้นที่ต้องการนำเข้าข้อมูล</span> : ""}
                </div>
            )}
        </div>
    )
}
