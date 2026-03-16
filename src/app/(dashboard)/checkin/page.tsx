// app/(dashboard)/checkin/page.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import QRCode from 'qrcode'
import { StatsSkeleton, TableSkeleton } from '@/app/components/ui/Skeleton'
import PickupDialog from '@/app/components/ui/PickupDialog'
import AbsenceDialog from '@/app/components/ui/AbsenceDialog'
import { useChildcareStore } from '@/store/useStore'
import { ClipboardList, Search, Check, Users, LogIn, Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useOfflineSync } from '@/hooks/useOfflineSync'

interface Child {
    id: number; code: string; nickname: string
    firstName: string; lastName: string; gender: string
    qrToken: string; disease: string | null
}

interface ClassLevel { id: number; code: string; name: string; color: string }
interface Enrollment { childId: number; level: ClassLevel }

interface CheckInRecord {
    id: number; childId: number; date: string
    checkInAt: string | null
    checkOutAt: string | null
    isAbsent: boolean
    absenceReason: string | null
    method: string; child: Child
}

const LEVEL_COLOR_MAP: Record<string, { bg: string; text: string }> = {
    '#F4A261': { bg: 'oklch(0.95 0.04 70)', text: 'oklch(0.40 0.08 70)' },
    '#52B788': { bg: 'oklch(0.95 0.04 160)', text: 'oklch(0.32 0.07 160)' },
    '#457B9D': { bg: 'oklch(0.94 0.03 240)', text: 'oklch(0.35 0.07 240)' },
    '#E76F51': { bg: 'oklch(0.95 0.04 25)', text: 'oklch(0.38 0.10 25)' },
    '#E9C46A': { bg: 'oklch(0.96 0.04 90)', text: 'oklch(0.42 0.08 90)' },
    '#9B72CF': { bg: 'oklch(0.95 0.04 300)', text: 'oklch(0.38 0.10 300)' },
}
function getLevelColor(color: string) {
    return LEVEL_COLOR_MAP[color] ?? { bg: 'var(--cream)', text: 'var(--muted)' }
}

export default function CheckInPage() {
    const [tab, setTab] = useState<'today' | 'qr' | 'manual'>('today')
    const [records, setRecords] = useState<CheckInRecord[]>([])
    const [children, setChildren] = useState<Child[]>([])
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [levels, setLevels] = useState<ClassLevel[]>([])
    const [selectedLevelId, setSelectedLevelId] = useState<number | 'all'>('all')
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const searchRef = useRef<HTMLInputElement>(null)
    const [qrDataUrl, setQrDataUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [pendingSiblings, setPendingSiblings] = useState<{ id: number; nickname: string; firstName: string; lastName: string; gender: string }[]>([])
    const [checkoutChild, setCheckoutChild] = useState<{ id: number, nickname: string } | null>(null)
    const [absentChild, setAbsentChild] = useState<{ id: number, nickname: string } | null>(null)
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    )

    const { activeYear, fetchPresentCount } = useChildcareStore()

    const { isOnline, isSyncing, queue, addAction, syncQueue } = useOfflineSync(() => {
        fetchRecords()
        fetchPresentCount()
        showToast('ซิงค์ข้อมูลสำเร็จ', true)
    })

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchRecords = useCallback(async () => {
        setLoading(true)
        const res = await fetch(`/api/checkin?date=${selectedDate}`)
        setRecords(await res.json())
        setLoading(false)
    }, [selectedDate])

    const fetchChildren = useCallback(async () => {
        setChildren(await fetch('/api/children').then(r => r.json()))
    }, [])

    const fetchEnrollments = useCallback(async () => {
        try {
            if (!activeYear) return
            const data: Enrollment[] = await fetch(`/api/enrollments?yearId=${activeYear.id}`).then(r => r.json())
            setEnrollments(data)
            const seen = new Set<number>()
            const uniq: ClassLevel[] = []
            for (const e of data) { if (!seen.has(e.level.id)) { seen.add(e.level.id); uniq.push(e.level) } }
            setLevels(uniq)
        } catch { /* ignore */ }
    }, [activeYear])

    const generateQR = useCallback(async () => {
        const url = `${window.location.origin}/parent/checkin?date=${selectedDate}`
        setQrDataUrl(await QRCode.toDataURL(url, {
            width: 240, margin: 2,
            color: { dark: '#1C3D2E', light: '#FFFFFF' },
        }))
    }, [selectedDate])

    useEffect(() => { fetchRecords() }, [fetchRecords])
    useEffect(() => { fetchChildren() }, [fetchChildren])
    useEffect(() => { fetchEnrollments() }, [fetchEnrollments])
    useEffect(() => { if (tab === 'qr') generateQR() }, [tab, generateQR])

    // Debounce search — 200ms
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 200)
        return () => clearTimeout(timer)
    }, [search])

    // Auto-focus search when manual tab is active
    useEffect(() => {
        if (tab === 'manual' && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 100)
        }
    }, [tab])

    const handleManualCheckIn = async (childId: number, type: 'in' | 'out' | 'absent', pickupName?: string, pickupRelation?: string, note?: string) => {
        const payload: any = { childId, type, date: selectedDate, method: 'manual' }
        if (pickupName) payload.pickupName = pickupName
        if (pickupRelation) payload.pickupRelation = pickupRelation
        if (note) payload.note = note

        try {
            const res = await fetch('/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (res.ok) {
                const successMsg = type === 'in' ? 'เช็กเข้า' : type === 'out' ? 'เช็กออก' : 'แจ้งลา'
                showToast(`บันทึก${successMsg}เรียบร้อย`, true)
                fetchRecords()
                fetchPresentCount()
                // Check for siblings on check-in
                if (type === 'in') {
                    try {
                        const siblingsRes = await fetch(`/api/checkin/siblings?childId=${childId}&date=${selectedDate}`)
                        const siblings = await siblingsRes.json()
                        setPendingSiblings(siblings.length > 0 ? siblings : [])
                    } catch {
                        setPendingSiblings([])
                    }
                } else {
                    setPendingSiblings([])
                }
                
                // Auto-clear search and re-focus for next child
                setSearch('')
                setDebouncedSearch('')
                setTimeout(() => searchRef.current?.focus(), 100)
            } else {
                showToast(data.message, false)
            }
        } catch (error) {
            // Offline queueing
            addAction(payload)
            const successMsg = type === 'in' ? 'เช็กเข้า' : type === 'out' ? 'เช็กออก' : 'แจ้งลา'
            showToast(`บันทึก${successMsg} (ออฟไลน์) - จะซิงค์อัตโนมัติเมื่อออนไลน์`, true)
            
            // Optimistic update
            const now = new Date().toISOString()
            setRecords(prev => {
                const existing = prev.find(r => r.childId === childId)
                let newRecord: CheckInRecord
                if (existing) {
                    newRecord = { ...existing }
                    if (type === 'in') newRecord.checkInAt = now
                    if (type === 'out') newRecord.checkOutAt = now
                    if (type === 'absent') { newRecord.isAbsent = true; newRecord.absenceReason = note ?? null }
                } else {
                    const c = children.find(ch => ch.id === childId)
                    newRecord = {
                        id: Math.random(),
                        childId,
                        date: selectedDate,
                        checkInAt: type === 'in' ? now : null,
                        checkOutAt: type === 'out' ? now : null,
                        isAbsent: type === 'absent',
                        absenceReason: note ?? null,
                        method: 'manual',
                        child: c!
                    }
                }
                return [...prev.filter(r => r.childId !== childId), newRecord]
            })
            
            // Auto-clear search and re-focus for next child
            setSearch('')
            setDebouncedSearch('')
            setTimeout(() => searchRef.current?.focus(), 100)
        }
        
        setCheckoutChild(null)
        setAbsentChild(null)
    }

    const getChildLevel = (childId: number) => enrollments.find(e => e.childId === childId)?.level ?? null
    const filteredRecords = records.filter(r => selectedLevelId === 'all' || getChildLevel(r.childId)?.id === selectedLevelId)
    const getRecord = (childId: number) => records.find(r => r.childId === childId)

    // Sort: ยังไม่มา → อยู่ในศูนย์ → กลับบ้านแล้ว (ลาไปอยู่ท้ายสุด)
    const getStatusOrder = (childId: number) => {
        const rec = getRecord(childId)
        if (rec?.isAbsent) return 3    // ลา
        if (!rec?.checkInAt) return 0 // ยังไม่มา
        if (!rec.checkOutAt) return 1  // อยู่ในศูนย์
        return 2                        // กลับบ้านแล้ว
    }

    const filteredChildren = children.filter(c => {
        const matchSearch = `${c.nickname}${c.firstName}${c.lastName}${c.code}`.toLowerCase().includes(debouncedSearch.toLowerCase())
        if (!matchSearch) return false
        return selectedLevelId === 'all' || getChildLevel(c.id)?.id === selectedLevelId
    }).sort((a, b) => getStatusOrder(a.id) - getStatusOrder(b.id))

    const scopedChildren = selectedLevelId === 'all' ? children : children.filter(c => getChildLevel(c.id)?.id === selectedLevelId)
    const presentCount = filteredRecords.filter(r => r.checkInAt && !r.checkOutAt).length
    const checkedOutCount = filteredRecords.filter(r => r.checkOutAt).length
    const absentCount = scopedChildren.length - filteredRecords.filter(r => r.checkInAt).length

    const tabs = [
        { id: 'today' as const, label: 'สรุปวันนี้' },
        { id: 'qr' as const, label: 'QR ผู้ปกครอง' },
        { id: 'manual' as const, label: 'เช็กชื่อด้วยตนเอง' },
    ]

    return (
        <div className="space-y-4 animate-fade-up">
            {/* Toast */}
            {toast && (
                <div
                    className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold toast"
                    style={{
                        background: toast.ok ? 'var(--forest)' : 'oklch(0.40 0.12 25)',
                        color: 'white',
                        boxShadow: '0 8px 32px oklch(0.22 0.03 160 / 0.2)',
                    }}
                >
                    {toast.ok ? '✓' : '!'} {toast.msg}
                </div>
            )}

            {/* Stats strip */}
            {loading ? <StatsSkeleton /> : (
                <div
                    className="card rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
                    style={{ background: 'white' }}
                >
                    <div className="flex items-center gap-6">
                        {[
                            { label: 'มาเรียน', value: presentCount, color: 'var(--leaf)' },
                            { label: 'กลับบ้าน', value: checkedOutCount, color: 'var(--muted)' },
                            { label: 'ยังไม่มา', value: absentCount, color: 'var(--coral)' },
                        ].map(s => (
                            <div key={s.label} className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="md:ml-auto flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        {/* Network status */}
                        {(!isOnline || queue.length > 0) && (
                            <div className="flex items-center gap-2 justify-between rounded-lg px-3 py-1.5 text-xs font-semibold w-full sm:w-auto animate-fade-in"
                                style={{ background: isOnline ? 'var(--cream)' : '#FFF0ED', color: isOnline ? 'var(--text)' : 'var(--coral)', border: `1px solid ${isOnline ? 'var(--warm)' : '#F4C0B0'}` }}>
                                <div className="flex items-center gap-1.5">
                                    {isOnline ? <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} /> : <WifiOff size={14} />}
                                    <span>
                                        {isSyncing ? 'กำลังซิงค์...' : !isOnline ? 'ออฟไลน์' : `รอซิงค์ (${queue.length})`}
                                    </span>
                                </div>
                                {isOnline && !isSyncing && queue.length > 0 && (
                                    <button onClick={syncQueue} className="px-2 py-1 bg-white rounded shadow-sm text-[10px] ml-2">ซิงค์</button>
                                )}
                            </div>
                        )}
                        
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="px-3 py-1.5 rounded-lg text-sm input-field w-full sm:w-auto"
                        />
                    </div>
                </div>
            )}

            {/* Level filter + Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {levels.length > 0 && (
                    <>
                        <button
                            onClick={() => setSelectedLevelId('all')}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{
                                background: selectedLevelId === 'all' ? 'var(--forest)' : 'white',
                                color: selectedLevelId === 'all' ? 'white' : 'var(--muted)',
                                border: `1px solid ${selectedLevelId === 'all' ? 'var(--forest)' : 'var(--warm)'}`,
                                transition: 'all 0.15s var(--ease-out-quart)',
                            }}
                        >
                            ทุกชั้น
                        </button>
                        {levels.map(lv => {
                            const active = selectedLevelId === lv.id
                            const c = getLevelColor(lv.color)
                            return (
                                <button
                                    key={lv.id}
                                    onClick={() => setSelectedLevelId(lv.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                    style={{
                                        background: active ? lv.color : 'white',
                                        color: active ? 'white' : c.text,
                                        border: `1px solid ${active ? lv.color : 'var(--warm)'}`,
                                        transition: 'all 0.15s var(--ease-out-quart)',
                                    }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ background: active ? 'oklch(1 0 0 / 0.6)' : lv.color }}
                                    />
                                    {lv.name}
                                </button>
                            )
                        })}
                        <div className="w-px h-5 mx-1" style={{ background: 'var(--warm)' }} />
                    </>
                )}
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                            background: tab === t.id ? 'var(--leaf)' : 'white',
                            color: tab === t.id ? 'white' : 'var(--muted)',
                            border: `1px solid ${tab === t.id ? 'var(--leaf)' : 'var(--warm)'}`,
                            transition: 'all 0.15s var(--ease-out-quart)',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === 'today' && (
                <div className="card rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-4"><TableSkeleton rows={5} cols={6} /></div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="py-14 text-center flex flex-col items-center">
                            <div className="mb-3"><ClipboardList size={36} color="var(--muted)" /></div>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ยังไม่มีการเช็กชื่อ{selectedLevelId !== 'all' ? 'ในชั้นนี้' : 'ในวันนี้'}</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--warm)' }}>
                                    {['เด็ก', 'ชั้น', 'เข้า', 'ออก', 'วิธี', 'สถานะ'].map(h => (
                                        <th key={h} className="text-left text-xs font-semibold px-4 py-2.5" style={{ color: 'var(--muted)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map(r => {
                                    const lv = getChildLevel(r.childId)
                                    const lc = lv ? getLevelColor(lv.color) : null
                                    return (
                                        <tr key={r.id} className="table-row" style={{ borderBottom: '1px solid var(--warm)' }}>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                                        style={{
                                                            background: r.child.gender === 'male' ? 'oklch(0.90 0.04 240)' : 'oklch(0.92 0.04 350)',
                                                            color: r.child.gender === 'male' ? 'var(--sky)' : 'oklch(0.50 0.12 350)',
                                                        }}
                                                    >
                                                        {r.child.nickname.slice(0, 1)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.child.nickname}</p>
                                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{r.child.firstName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {lv && lc ? (
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: lc.bg, color: lc.text }}>{lv.code}</span>
                                                ) : <span className="text-xs" style={{ color: 'var(--muted)' }}>—</span>}
                                            </td>
                                            <td className="px-4 py-2.5 text-sm font-mono" style={{ color: 'var(--text)' }}>
                                                {r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-sm font-mono" style={{ color: 'var(--muted)' }}>
                                                {r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted)' }}>
                                                {r.method === 'qr' ? 'QR' : 'ด้วยตนเอง'}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span
                                                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                                    style={r.checkOutAt
                                                        ? { background: 'var(--warm)', color: 'var(--muted)' }
                                                        : r.checkInAt
                                                            ? { background: 'oklch(0.93 0.04 160)', color: 'var(--leaf)' }
                                                            : r.isAbsent
                                                                ? { background: 'oklch(0.95 0.04 250)', color: 'var(--blue)' }
                                                                : { background: 'oklch(0.95 0.04 25)', color: 'var(--coral)' }
                                                    }
                                                >
                                                    {r.checkOutAt ? 'กลับบ้าน' : r.checkInAt ? 'อยู่ศูนย์' : r.isAbsent ? 'ลา' : 'ยังไม่มา'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === 'qr' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="card rounded-2xl p-6 text-center">
                        <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                            QR Code สำหรับผู้ปกครอง
                        </h3>
                        <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
                            Scan → ค้นหาชื่อลูก → กดเช็กเข้า/ออก
                        </p>
                        {qrDataUrl ? (
                            <>
                                <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-xl mb-4" style={{ width: 200, height: 200 }} />
                                <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                                    วันที่ {new Date(selectedDate).toLocaleDateString('th-TH')}
                                </p>
                                <button
                                    onClick={() => {
                                        const a = document.createElement('a')
                                        a.href = qrDataUrl
                                        a.download = `checkin-qr-${selectedDate}.png`
                                        a.click()
                                    }}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold btn-primary"
                                >
                                    บันทึก QR Code
                                </button>
                            </>
                        ) : (
                            <div className="py-8">
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>กำลังสร้าง...</p>
                            </div>
                        )}
                    </div>
                    <div className="card rounded-2xl p-6" style={{ background: 'var(--cream)' }}>
                        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>วิธีใช้</h3>
                        {[
                            'ครูพิมพ์ QR Code แล้วติดไว้หน้าศูนย์',
                            'ผู้ปกครอง scan QR ด้วยกล้องมือถือ',
                            'หน้าจอจะเปิดขึ้น — ค้นหาชื่อลูก',
                            'กดปุ่ม "เช็กเข้า" ตอนส่งเด็ก',
                            'กดปุ่ม "เช็กออก" ตอนรับเด็กกลับ',
                        ].map((text, i) => (
                            <div key={i} className="flex gap-3 mb-3 items-start">
                                <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--sage)', color: 'white' }}>{i + 1}</span>
                                <p className="text-sm" style={{ color: 'var(--text)' }}>{text}</p>
                            </div>
                        ))}
                        <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'oklch(0.93 0.04 160)', color: 'var(--leaf)' }}>
                            ไม่ต้องล็อกอิน ผู้ปกครอง scan แล้วใช้ได้เลย
                        </div>
                    </div>
                </div>
            )}

            {tab === 'manual' && (
                <div className="card rounded-2xl p-5">
                    <div className="relative mb-4">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}><Search size={16} /></span>
                        <input
                            ref={searchRef}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ค้นหาชื่อเด็ก..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm input-field"
                            autoFocus
                        />
                    </div>

                    {/* Sibling prompt banner */}
                    {pendingSiblings.length > 0 && (
                        <div className="mb-4 rounded-xl p-3" style={{ background: 'oklch(0.95 0.04 200)', border: '2px solid oklch(0.85 0.06 200)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={16} style={{ color: 'var(--sky)' }} />
                                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>พี่น้องยังไม่ได้เช็กเข้า</p>
                            </div>
                            <div className="space-y-1.5">
                                {pendingSiblings.map(s => (
                                    <div key={s.id} className="flex items-center gap-2 rounded-lg p-2" style={{ background: 'white' }}>
                                        <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                            style={{
                                                background: s.gender === 'male' ? 'oklch(0.90 0.04 240)' : 'oklch(0.92 0.04 350)',
                                                color: s.gender === 'male' ? 'var(--sky)' : 'oklch(0.50 0.12 350)',
                                            }}
                                        >
                                            {s.nickname.slice(0, 1)}
                                        </div>
                                        <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{s.nickname}</p>
                                        <button
                                            onClick={async () => {
                                                await handleManualCheckIn(s.id, 'in')
                                                setPendingSiblings(prev => prev.filter(x => x.id !== s.id))
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1"
                                            style={{ background: 'var(--sage)' }}
                                        >
                                            <LogIn size={12} /> เช็กเข้า
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setPendingSiblings([])} className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>ข้ามไป</button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {filteredChildren.map(child => {
                            const rec = getRecord(child.id)
                            const lv = getChildLevel(child.id)
                            const lc = lv ? getLevelColor(lv.color) : null
                            const isAbsent = !!rec?.isAbsent
                            return (
                                <div
                                    key={child.id}
                                    className="rounded-xl p-3 flex items-center gap-3"
                                    style={{
                                        background: isAbsent ? 'oklch(0.95 0.05 250)' : rec?.checkOutAt ? 'var(--cream)' : 'white',
                                        border: isAbsent ? '1px solid var(--blue)' : '1px solid var(--warm)',
                                        opacity: rec?.checkOutAt || isAbsent ? 0.6 : 1,
                                    }}
                                >
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
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{child.nickname}</p>
                                            {lv && lc && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: lc.bg, color: lc.text }}>{lv.code}</span>
                                            )}
                                        </div>
                                        {rec?.checkInAt && (
                                            <p className="text-xs" style={{ color: 'var(--sage)' }}>
                                                เข้า {new Date(rec.checkInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                {rec.checkOutAt && ` → ออก ${new Date(rec.checkOutAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`}
                                            </p>
                                        )}
                                        {isAbsent && (
                                            <p className="text-xs" style={{ color: 'var(--blue)' }}>
                                                {rec?.absenceReason || 'แจ้งลา'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                        {isAbsent ? (
                                            <span style={{ color: 'var(--blue)' }} className="text-xs font-semibold px-2">ลาแล้ว</span>
                                        ) : !rec?.checkInAt && (
                                            <>
                                                <button onClick={() => setAbsentChild({ id: child.id, nickname: child.nickname })} className="px-2 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--cream)', color: 'var(--text)' }}>ลา</button>
                                                <button onClick={() => handleManualCheckIn(child.id, 'in')} className="px-3 py-1.5 rounded-lg text-xs font-semibold btn-primary">เข้า</button>
                                            </>
                                        )}
                                        {rec?.checkInAt && !rec.checkOutAt && (
                                            <button
                                                onClick={() => setCheckoutChild({ id: child.id, nickname: child.nickname })}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                style={{ background: 'oklch(0.95 0.04 25)', color: 'var(--coral)' }}
                                            >
                                                ออก
                                            </button>
                                        )}
                                        {rec?.checkOutAt && (
                                            <span style={{ color: 'var(--muted)' }}><Check size={16} /></span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {checkoutChild && (
                <PickupDialog
                    open={!!checkoutChild}
                    childNickname={checkoutChild.nickname}
                    onClose={() => setCheckoutChild(null)}
                    onConfirm={(n, r) => handleManualCheckIn(checkoutChild.id, 'out', n, r)}
                />
            )}

            {absentChild && (
                <AbsenceDialog
                    open={!!absentChild}
                    childNickname={absentChild.nickname}
                    onClose={() => setAbsentChild(null)}
                    onConfirm={(reason, note) => handleManualCheckIn(absentChild.id, 'absent', undefined, undefined, note ? `${reason}: ${note}` : reason)}
                />
            )}
        </div>
    )
}