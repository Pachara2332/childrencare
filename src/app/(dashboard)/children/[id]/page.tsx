// app/(dashboard)/children/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { Skeleton } from '@/app/components/ui/Skeleton'
import { ArrowLeft, User, Baby, UserCircle, Cake, Droplets, HeartPulse, Users, BookOpen, Activity, Target, QrCode, ClipboardList, CheckCircle2, History, XCircle, BarChart3, TrendingUp, Award, Scale, Download } from 'lucide-react'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'
import {
    EnrollmentStatus,
    enrollmentStatusLabels,
    getEnrollmentStatusTone,
} from '@/lib/enrollmentStatus'

interface Child {
    id: number
    code: string
    firstName: string
    lastName: string
    nickname: string
    gender: string
    dateOfBirth: string
    bloodType: string | null
    disease: string | null
    allergy: string | null
    parentName: string
    parentPhone: string
    parentPhone2: string | null
    parentRelation: string
    address: string | null
    qrToken: string
    enrollments: {
        id: number
        status: EnrollmentStatus
        statusDate: string | null
        statusReason: string | null
        academicYear: { name: string }
        level: { name: string; code: string }
    }[]
}

interface Development {
    id: number
    recordedAt: string
    weight: number | null
    height: number | null
    scoreLanguage: number | null
    scorePhysical: number | null
    scoreIntellect: number | null
    scoreEmotional: number | null
    scoreSocial: number | null
    note: string | null
}

interface CheckIn {
    id: number
    date: string
    checkInAt: string | null
    checkOutAt: string | null
    method: string
}

type Tab = 'info' | 'checkin' | 'development' | 'qr'

export default function ChildProfilePage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [child, setChild] = useState<Child | null>(null)
    const [developments, setDevelopments] = useState<Development[]>([])
    const [checkIns, setCheckIns] = useState<CheckIn[]>([])
    const [qrDataUrl, setQrDataUrl] = useState('')
    const [tab, setTab] = useState<Tab>('info')
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<Child>>({})
    const [saving, setSaving] = useState(false)
    const [showSaveConfirm, setShowSaveConfirm] = useState(false)

    useEffect(() => {
        Promise.all([
            fetch(`/api/children/${id}`).then(r => r.ok ? r.json() : null),
            fetch(`/api/children/${id}/developments`).then(r => r.ok ? r.json() : []),
            fetch(`/api/children/${id}/checkins?limit=30`).then(r => r.ok ? r.json() : []),
        ]).then(([c, d, ci]) => {
            setChild(c)
            if (c) setEditForm(c)
            setDevelopments(d)
            setCheckIns(ci)
            setLoading(false)
        }).catch(() => {
            setChild(null)
            setDevelopments([])
            setCheckIns([])
            setLoading(false)
        })
    }, [id])

    useEffect(() => {
        if (tab === 'qr' && child) {
            const url = `${window.location.origin}/parent/checkin?token=${child.qrToken}`
            QRCode.toDataURL(url, {
                width: 256, margin: 2,
                color: { dark: '#1C3D2E', light: '#F8F4EE' },
            }).then(setQrDataUrl)
        }
    }, [tab, child])

    const handleSave = async () => {
        setShowSaveConfirm(false)
        setSaving(true)
        const res = await fetch(`/api/children/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        })
        if (res.ok) {
            const updated = await res.json()
            setChild(updated)
            setEditing(false)
        }
        setSaving(false)
    }

    const calcAge = (dob: string) => {
        const birth = new Date(dob)
        const now = new Date()
        let years = now.getFullYear() - birth.getFullYear()
        let months = now.getMonth() - birth.getMonth()
        if (months < 0) { years--; months += 12 }
        return `${years} ปี ${months} เดือน`
    }

    const attendanceRate = () => {
        if (!checkIns.length) return 0
        const present = checkIns.filter(c => c.checkInAt).length
        return Math.round((present / checkIns.length) * 100)
    }

    const formatStatusDate = (value: string | null) => {
        if (!value) return 'ยังไม่ระบุ'
        return new Date(value).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    if (loading) return (
        <div className="space-y-5 animate-fade-up">
            <Skeleton className="h-5 w-24" />
            <div className="rounded-2xl p-5 flex items-center gap-5" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
                <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48 mb-1.5" />
                    <Skeleton className="h-3.5 w-28" />
                </div>
                <div className="hidden md:flex gap-4">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="text-center px-4 py-2 rounded-xl" style={{ background: 'var(--cream)' }}>
                            <Skeleton className="w-8 h-8 mx-auto mb-1.5" />
                            <Skeleton className="h-3 w-12 mx-auto" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex gap-2">
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-28 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                    <Skeleton className="h-4 w-28 mb-4" />
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid var(--warm)' }}>
                            <Skeleton className="h-3.5 w-20" />
                            <Skeleton className="h-3.5 w-28" />
                        </div>
                    ))}
                </div>
                <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                    <Skeleton className="h-4 w-32 mb-4" />
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid var(--warm)' }}>
                            <Skeleton className="h-3.5 w-20" />
                            <Skeleton className="h-3.5 w-32" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    if (!child) return (
        <div className="text-center py-20">
            <UserCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--muted)', opacity: 0.3 }} />
            <p style={{ color: 'var(--muted)' }}>ไม่พบข้อมูลเด็ก</p>
        </div>
    )

    const latestDev = developments[0]
    const inputStyle = { border: '1px solid var(--warm)', background: 'white', color: 'var(--text)' }
    const inputClass = "w-full px-3 py-2 rounded-xl text-sm outline-none"

    return (
        <div className="space-y-5 animate-fade-up">
            {/* Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
                <ArrowLeft size={16} /> กลับรายชื่อ
            </button>

            {/* Hero card */}
            <div
                className="rounded-2xl p-5 flex items-center gap-5"
                style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-bold shrink-0"
                    style={{
                        background: child.gender === 'male' ? '#DBE9F4' : '#FDE8F0',
                        color: child.gender === 'male' ? 'var(--sky)' : '#C2185B',
                    }}
                >
                    {child.nickname.slice(0, 1)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                            {child.nickname}
                        </h1>
                        <span
                            className="text-xs font-mono px-2 py-0.5 rounded-lg"
                            style={{ background: 'var(--cream)', color: 'var(--muted)' }}
                        >
                            {child.code}
                        </span>
                        <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                            style={{
                                background: child.gender === 'male' ? '#DBE9F4' : '#FDE8F0',
                                color: child.gender === 'male' ? 'var(--sky)' : '#C2185B',
                            }}
                        >
                            <Baby size={14} /> {child.gender === 'male' ? 'ชาย' : 'หญิง'}
                        </span>
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                        {child.firstName} {child.lastName}
                    </p>
                    <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                        <Cake size={16} style={{ color: 'var(--sun)' }}/> อายุ {calcAge(child.dateOfBirth)}
                    </p>
                </div>

                {/* Quick stats */}
                <div className="hidden md:flex gap-4 shrink-0">
                    {[
                        { label: 'น้ำหนัก', value: latestDev?.weight ? `${latestDev.weight} กก.` : '—', icon: <Scale size={24} style={{ color: 'var(--leaf)' }} /> },
                        { label: 'ส่วนสูง', value: latestDev?.height ? `${latestDev.height} ซม.` : '—', icon: <Droplets size={24} style={{ color: 'var(--sky)' }} /> },
                        { label: 'เข้าเรียน', value: `${attendanceRate()}%`, icon: <BarChart3 size={24} style={{ color: 'var(--sun)' }} /> },
                    ].map(s => (
                        <div key={s.label} className="text-center px-4 py-2 rounded-xl flex flex-col items-center gap-1" style={{ background: 'var(--cream)' }}>
                            <div className="mb-0.5">{s.icon}</div>
                            <p className="text-base font-bold" style={{ color: 'var(--text)' }}>{s.value}</p>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {([
                    ['info', 'ข้อมูล', <User size={16} />],
                    ['checkin', 'การเข้าเรียน', <History size={16} />],
                    ['development', 'พัฒนาการ', <Activity size={16} />],
                    ['qr', 'QR Code', <QrCode size={16} />],
                ] as [Tab, string, React.ReactNode][]).map(([t, label, icon]) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                        style={{
                            background: tab === t ? 'var(--leaf)' : 'white',
                            color: tab === t ? 'white' : 'var(--muted)',
                            border: `1px solid ${tab === t ? 'var(--leaf)' : 'var(--warm)'}`,
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── TAB: INFO ── */}
            {tab === 'info' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Personal info */}
                    <div
                        className="rounded-2xl p-5"
                        style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--text)' }}><User size={18} /> ข้อมูลเด็ก</h3>
                            <button
                                onClick={() => editing ? setShowSaveConfirm(true) : setEditing(true)}
                                disabled={saving}
                                className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5"
                                style={{ background: editing ? 'var(--leaf)' : 'var(--cream)', color: editing ? 'white' : 'var(--leaf)', border: 'none', cursor: 'pointer' }}
                            >
                                {saving ? 'รอสักครู่...' : editing ? <><CheckCircle2 size={14} /> บันทึก</> : 'แก้ไข'}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {editing ? (
                                <>
                                    {[
                                        ['ชื่อจริง', 'firstName', 'text'],
                                        ['นามสกุล', 'lastName', 'text'],
                                        ['ชื่อเล่น', 'nickname', 'text'],
                                        ['วันเกิด', 'dateOfBirth', 'date'],
                                    ].map(([label, key, type]) => (
                                        <div key={key}>
                                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>{label}</label>
                                            <input
                                                type={type}
                                                value={key === 'dateOfBirth'
                                                    ? (editForm[key as keyof Child] as string)?.split('T')[0] ?? ''
                                                    : (editForm[key as keyof Child] as string) ?? ''}
                                                onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                                className={inputClass} style={inputStyle}
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>โรคประจำตัว</label>
                                        <input
                                            value={(editForm.disease as string) ?? ''}
                                            onChange={e => setEditForm(f => ({ ...f, disease: e.target.value }))}
                                            className={inputClass} style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>ภูมิแพ้ / แพ้ยา</label>
                                        <input
                                            value={(editForm.allergy as string) ?? ''}
                                            onChange={e => setEditForm(f => ({ ...f, allergy: e.target.value }))}
                                            className={inputClass} style={inputStyle}
                                        />
                                    </div>
                                </>
                            ) : (
                                [
                                    ['ชื่อจริง-นามสกุล', `${child.firstName} ${child.lastName}`],
                                    ['วันเกิด', new Date(child.dateOfBirth).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })],
                                    ['อายุ', calcAge(child.dateOfBirth)],
                                    ['กรุ๊ปเลือด', child.bloodType ?? 'ไม่ทราบ'],
                                    ['โรคประจำตัว', child.disease ?? 'ไม่มี'],
                                    ['ภูมิแพ้', child.allergy ?? 'ไม่มี'],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--warm)' }}>
                                        <span className="text-sm" style={{ color: 'var(--muted)' }}>{k}</span>
                                        <span
                                            className="text-sm font-semibold"
                                            style={{ color: (k === 'โรคประจำตัว' || k === 'ภูมิแพ้') && v !== 'ไม่มี' ? 'var(--coral)' : 'var(--text)' }}
                                        >
                                            {v}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Parent info */}
                    <div
                        className="rounded-2xl p-5"
                        style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                        <h3 className="font-semibold text-sm mb-4 flex items-center gap-1.5" style={{ color: 'var(--text)' }}><Users size={18} /> ข้อมูลผู้ปกครอง</h3>
                        {[
                            ['ชื่อผู้ปกครอง', child.parentName],
                            ['ความสัมพันธ์', child.parentRelation === 'mother' ? 'แม่' : child.parentRelation === 'father' ? 'พ่อ' : 'ผู้ปกครอง'],
                            ['เบอร์โทร', child.parentPhone],
                            ['เบอร์สำรอง', child.parentPhone2 ?? '—'],
                            ['ที่อยู่', child.address ?? '—'],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid var(--warm)' }}>
                                <span className="text-sm" style={{ color: 'var(--muted)' }}>{k}</span>
                                <span className="text-sm font-semibold text-right max-w-[60%]" style={{ color: 'var(--text)' }}>{v}</span>
                            </div>
                        ))}

                        {/* Enrollment */}
                        <div className="mt-4">
                            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>ปีการศึกษาที่ลงทะเบียน</p>
                            <div className="space-y-2">
                                {child.enrollments.map((enrollment) => {
                                    const tone = getEnrollmentStatusTone(enrollment.status)

                                    return (
                                        <div
                                            key={enrollment.id}
                                            className="rounded-xl px-3 py-2.5"
                                            style={{ background: 'var(--cream)', border: '1px solid var(--warm)' }}
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                                    {enrollment.academicYear.name}
                                                </span>
                                                <span
                                                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                                    style={{ background: tone.bg, color: tone.text }}
                                                >
                                                    {enrollmentStatusLabels[enrollment.status]}
                                                </span>
                                                <span
                                                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                                    style={{ background: 'white', color: 'var(--muted)', border: '1px solid var(--warm)' }}
                                                >
                                                    {enrollment.level.name} ({enrollment.level.code})
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                                                วันที่สถานะ: {formatStatusDate(enrollment.statusDate)}
                                            </p>
                                            {enrollment.statusReason && (
                                                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                                                    เหตุผล: {enrollment.statusReason}
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: CHECK-IN HISTORY ── */}
            {tab === 'checkin' && (
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                    <div
                        className="px-5 py-4 flex items-center justify-between"
                        style={{ borderBottom: '1px solid var(--warm)', background: 'var(--cream)' }}
                    >
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                            ประวัติการเข้าเรียน 30 วันล่าสุด
                        </h3>
                        <span
                            className="text-xs font-bold px-3 py-1 rounded-full"
                            style={{ background: '#D8F3DC', color: '#1B4332' }}
                        >
                            เข้าเรียน {attendanceRate()}%
                        </span>
                    </div>

                    {checkIns.length === 0 ? (
                        <div className="py-12 text-center">
                            <History size={48} className="mx-auto mb-3" style={{ color: 'var(--muted)', opacity: 0.3 }} />
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ยังไม่มีประวัติ</p>
                        </div>
                    ) : (
                        <div>
                            {checkIns.map(ci => (
                                <div
                                    key={ci.id}
                                    className="flex items-center gap-4 px-5 py-3"
                                    style={{ borderBottom: '1px solid var(--warm)' }}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ background: ci.checkInAt ? 'var(--sage)' : 'var(--coral)' }}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                            {new Date(ci.date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                        {ci.checkInAt && (
                                            <p className="text-xs flex flex-wrap items-center gap-1 mt-0.5" style={{ color: 'var(--muted)' }}>
                                                <span className="flex items-center gap-0.5"><CheckCircle2 size={12} style={{ color: 'var(--leaf)' }} /> เข้า {new Date(ci.checkInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                                                {ci.checkOutAt && <span className="flex items-center gap-0.5 whitespace-nowrap"> · <XCircle size={12} style={{ color: 'var(--coral)' }} /> ออก {new Date(ci.checkOutAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>}
                                                {!ci.checkOutAt && <span style={{ color: 'var(--sage)' }}> · ยังอยู่ศูนย์</span>}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                            style={ci.checkInAt
                                                ? { background: '#D8F3DC', color: '#1B4332' }
                                                : { background: '#FFF0ED', color: 'var(--coral)' }
                                            }
                                        >
                                            {ci.checkInAt ? 'มา' : 'ขาด'}
                                        </span>
                                        <span className="text-xs flex items-center justify-center p-1 rounded bg-slate-50 border border-slate-100" style={{ color: 'var(--muted)' }}>
                                            {ci.method === 'qr' ? <QrCode size={14} /> : <ClipboardList size={14} />}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: DEVELOPMENT ── */}
            {tab === 'development' && (
                <div className="space-y-5">
                    {/* Latest measurements */}
                    {latestDev && (
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                className="rounded-2xl p-5 text-center"
                                style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                            >
                                <p className="text-4xl font-bold" style={{ color: 'var(--leaf)' }}>
                                    {latestDev.weight ?? '—'}
                                </p>
                                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>กิโลกรัม (น้ำหนัก)</p>
                                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                                    บันทึกเมื่อ {new Date(latestDev.recordedAt).toLocaleDateString('th-TH')}
                                </p>
                            </div>
                            <div
                                className="rounded-2xl p-5 text-center"
                                style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                            >
                                <p className="text-4xl font-bold" style={{ color: 'var(--sun)' }}>
                                    {latestDev.height ?? '—'}
                                </p>
                                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>เซนติเมตร (ส่วนสูง)</p>
                                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                                    บันทึกเมื่อ {new Date(latestDev.recordedAt).toLocaleDateString('th-TH')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Growth chart (simple bar) */}
                    {developments.length > 1 && (
                        <div
                            className="rounded-2xl p-5"
                            style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                        >
                            <h3 className="font-semibold text-sm mb-4 flex items-center gap-1.5" style={{ color: 'var(--text)' }}><TrendingUp size={18} /> กราฟน้ำหนัก</h3>
                            <div className="flex items-end gap-2 h-28">
                                {[...developments].reverse().slice(0, 8).map((d, i, arr) => {
                                    const weights = arr.map(x => x.weight ?? 0).filter(Boolean)
                                    const min = Math.min(...weights)
                                    const max = Math.max(...weights)
                                    const pct = max === min ? 60 : ((d.weight ?? 0) - min) / (max - min) * 70 + 30
                                    return (
                                        <div key={d.id} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-xs font-bold" style={{ color: 'var(--leaf)' }}>
                                                {d.weight ?? '?'}
                                            </span>
                                            <div
                                                className="w-full rounded-t-lg transition-all duration-500"
                                                style={{ height: `${pct}%`, background: i === arr.length - 1 ? 'var(--leaf)' : 'var(--mint)', opacity: 0.7 + i * 0.04 }}
                                            />
                                            <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                                {new Date(d.recordedAt).toLocaleDateString('th-TH', { month: 'short' })}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Dev scores */}
                    {latestDev && (
                        <div
                            className="rounded-2xl p-5"
                            style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                        >
                            <h3 className="font-semibold text-sm mb-4 flex items-center gap-1.5" style={{ color: 'var(--text)' }}><Award size={18} /> พัฒนาการ 5 ด้าน</h3>
                            {[
                                ['ด้านภาษา', latestDev.scoreLanguage, 'var(--leaf)', <BookOpen size={16} />],
                                ['ด้านร่างกาย', latestDev.scorePhysical, 'var(--sage)', <Activity size={16} />],
                                ['ด้านสติปัญญา', latestDev.scoreIntellect, 'var(--sky)', <Target size={16} />],
                                ['ด้านอารมณ์', latestDev.scoreEmotional, 'var(--coral)', <HeartPulse size={16} />],
                                ['ด้านสังคม', latestDev.scoreSocial, 'var(--sun)', <Users size={16} />],
                            ].map(([label, score, color, icon]) => (
                                <div key={label as string} className="mb-4">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text)' }}>{icon as React.ReactNode} {label as string}</span>
                                        <span className="text-sm font-bold" style={{ color: color as string }}>
                                            {score ?? '—'}{score ? '/100' : ''}
                                        </span>
                                    </div>
                                    <div className="rounded-full overflow-hidden h-2" style={{ background: 'var(--warm)' }}>
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${score ?? 0}%`, background: color as string }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {developments.length === 0 && (
                        <div className="text-center py-12 rounded-2xl" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                            <TrendingUp size={48} className="mx-auto mb-3" style={{ color: 'var(--muted)', opacity: 0.3 }} />
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ยังไม่มีข้อมูลพัฒนาการ</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>ไปที่เมนู "พัฒนาการ" เพื่อบันทึก</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: QR CODE ── */}
            {tab === 'qr' && (
                <div className="flex flex-col items-center gap-5">
                    <div
                        className="rounded-2xl p-8 text-center"
                        style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
                            QR Code ประจำตัว — {child.nickname}
                        </p>
                        <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
                            ผู้ปกครอง scan เพื่อเช็กเข้า-ออกได้ทุกวัน
                        </p>
                        {qrDataUrl ? (
                            <>
                                <img
                                    src={qrDataUrl}
                                    alt="QR"
                                    className="mx-auto rounded-2xl mb-4"
                                    style={{ width: 200, height: 200 }}
                                />
                                <p className="text-xs mb-4 font-mono" style={{ color: 'var(--muted)' }}>
                                    {child.code} · {child.firstName}
                                </p>
                                <button
                                    onClick={() => {
                                        const a = document.createElement('a')
                                        a.href = qrDataUrl
                                        a.download = `qr-${child.code}-${child.nickname}.png`
                                        a.click()
                                    }}
                                    className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5"
                                    style={{ background: 'var(--leaf)' }}
                                >
                                    <Download size={16} /> ดาวน์โหลด QR
                                </button>
                            </>
                        ) : (
                            <div className="w-48 h-48 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--cream)' }}>
                                <Skeleton className="w-36 h-36 rounded-xl" />
                            </div>
                        )}
                    </div>
                </div>
            )}
            <ConfirmDialog
                open={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={handleSave}
                title="บันทึกข้อมูลเด็ก?"
                description="ยืนยันการแก้ไขข้อมูลของเด็กคนนี้"
                confirmLabel="บันทึก"
                variant="success"
                loading={saving}
            />
        </div>
    )
}
