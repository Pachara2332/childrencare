import { useState } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/app/components/ui/Skeleton'
import { Baby, Cake, User, Stethoscope, Loader2, LogOut, GraduationCap, RotateCcw } from 'lucide-react'
import EnrollmentStatusDialog from '@/app/components/ui/EnrollmentStatusDialog'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'
import { EnrollmentStatus, enrollmentStatusShortLabels, getEnrollmentStatusTone } from '@/lib/enrollmentStatus'
import { Enrollment, ClassLevel } from '../types'
import { calcAge, getLevelColor } from '../utils'

export default function ChildGrid({
    enrollments, loading, levels, yearId, onRefresh,
}: {
    enrollments: Enrollment[]
    loading: boolean
    levels: ClassLevel[]
    yearId: number | null
    onRefresh: () => void
}) {
    const [movingId, setMovingId] = useState<number | null>(null)
    const [confirmMoveId, setConfirmMoveId] = useState<number | null>(null)
    const [targetLevel, setTargetLevel] = useState<Record<number, number>>({})
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [statusAction, setStatusAction] = useState<EnrollmentStatus>('leave')
    const [statusTarget, setStatusTarget] = useState<Enrollment | null>(null)
    const [statusDate, setStatusDate] = useState(new Date().toISOString().split('T')[0])
    const [statusReason, setStatusReason] = useState('')
    const [statusSaving, setStatusSaving] = useState(false)

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

    const openStatusDialog = (enrollment: Enrollment, nextStatus: EnrollmentStatus) => {
        setStatusTarget(enrollment)
        setStatusAction(nextStatus)
        setStatusDate(
            nextStatus === 'active'
                ? new Date().toISOString().split('T')[0]
                : enrollment.statusDate?.split('T')[0] ?? new Date().toISOString().split('T')[0]
        )
        setStatusReason(nextStatus === 'active' ? '' : enrollment.statusReason ?? '')
        setStatusDialogOpen(true)
    }

    const confirmStatusChange = async () => {
        if (!statusTarget) return
        setStatusSaving(true)
        await fetch('/api/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                childId: statusTarget.childId,
                academicYearId: statusTarget.academicYear.id,
                levelId: statusTarget.level.id,
                status: statusAction,
                statusDate,
                statusReason,
            }),
        })
        setStatusSaving(false)
        setStatusDialogOpen(false)
        setStatusTarget(null)
        setStatusReason('')
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
                                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: getEnrollmentStatusTone(e.status as EnrollmentStatus).bg,
                                            color: getEnrollmentStatusTone(e.status as EnrollmentStatus).text,
                                        }}
                                    >
                                        {enrollmentStatusShortLabels[e.status as EnrollmentStatus]}
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
                                {e.statusDate && (
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        วันที่สถานะ {new Date(e.statusDate).toLocaleDateString('th-TH')}
                                    </p>
                                )}
                                {e.statusReason && (
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        เหตุผล: {e.statusReason}
                                    </p>
                                )}
                            </div>

                            {/* Move level */}
                            {e.status === 'active' && levels.length > 1 && (
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
                                        onClick={() => setConfirmMoveId(e.child.id)}
                                        disabled={
                                            movingId === e.child.id ||
                                            (targetLevel[e.child.id] ?? e.level.id) === e.level.id
                                        }
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-30 transition-all hover:brightness-110"
                                        style={{ background: 'var(--leaf)' }}
                                    >
                                        {movingId === e.child.id ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'ย้าย'}
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid var(--warm)' }}>
                                {e.status === 'active' ? (
                                    <>
                                        <button
                                            onClick={() => openStatusDialog(e, 'leave')}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                            style={{ background: '#FFF0ED', color: 'var(--coral)' }}
                                        >
                                            <LogOut size={14} /> ย้ายออก
                                        </button>
                                        <button
                                            onClick={() => openStatusDialog(e, 'graduated')}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                            style={{ background: 'oklch(0.95 0.04 70)', color: 'oklch(0.42 0.08 70)' }}
                                        >
                                            <GraduationCap size={14} /> จบการศึกษา
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => openStatusDialog(e, 'active')}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                        style={{ background: 'oklch(0.95 0.04 150)', color: 'var(--leaf)' }}
                                    >
                                        <RotateCcw size={14} /> เปิดกลับเป็นกำลังเรียน
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
            <EnrollmentStatusDialog
                open={statusDialogOpen}
                action={statusAction}
                loading={statusSaving}
                date={statusDate}
                reason={statusReason}
                onClose={() => {
                    if (statusSaving) return
                    setStatusDialogOpen(false)
                    setStatusTarget(null)
                }}
                onDateChange={setStatusDate}
                onReasonChange={setStatusReason}
                onConfirm={confirmStatusChange}
            />

            <ConfirmDialog
                open={confirmMoveId !== null}
                onClose={() => setConfirmMoveId(null)}
                onConfirm={async () => {
                    if (confirmMoveId !== null) {
                        const levelId = targetLevel[confirmMoveId] ?? enrollments.find(e => e.child.id === confirmMoveId)?.level.id;
                        if (levelId) {
                            await handleMove(confirmMoveId, levelId);
                            setConfirmMoveId(null);
                        }
                    }
                }}
                title="ยืนยันการย้ายห้องเรียน"
                description="นักเรียนคนนี้จะถูกเปลี่ยนห้องเรียนและอัปเดตระเบียนทันที ยืนยันข้อมูลถูกต้องใช่หรือไม่?"
                confirmLabel="ย้ายห้องเรียน"
                variant="info"
                loading={movingId !== null}
            />
        </div>
    )
}
