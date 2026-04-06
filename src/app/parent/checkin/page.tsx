// app/parent/checkin/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, useMemo, Suspense } from 'react'
import { Search, LogIn, LogOut, Check, Loader2, UserSearch, Users, CalendarX2, WifiOff, RefreshCw } from 'lucide-react'
import PickupDialog from '@/app/components/ui/PickupDialog'
import AbsenceDialog from '@/app/components/ui/AbsenceDialog'
import { useOfflineSync } from '@/hooks/useOfflineSync'

interface Child {
    id: number
    nickname: string
    firstName: string
    lastName: string
    gender: string
    parentName: string
}

interface CheckInRecord {
    childId: number
    checkInAt: string | null
    checkOutAt: string | null
    isAbsent: boolean
    absenceReason: string | null
}

interface Sibling {
    id: number
    nickname: string
    firstName: string
    lastName: string
    gender: string
}

interface CheckInPayload {
    childId: number
    type: 'in' | 'out' | 'absent'
    date: string
    method: 'qr'
    pickupName?: string
    pickupRelation?: string
    note?: string
}

function ParentCheckIn() {
    const params = useSearchParams()
    const date = params.get('date') ?? new Date().toISOString().split('T')[0]

    const [children, setChildren] = useState<Child[]>([])
    const [records, setRecords] = useState<CheckInRecord[]>([])
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [processing, setProcessing] = useState<number | null>(null)
    const [pendingSiblings, setPendingSiblings] = useState<Sibling[]>([])
    const [checkoutChild, setCheckoutChild] = useState<{ id: number, nickname: string } | null>(null)
    const [absentChild, setAbsentChild] = useState<{ id: number, nickname: string } | null>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const recordMap = useMemo(
        () => new Map(records.map((record) => [record.childId, record])),
        [records]
    )

    function showToast(msg: string, ok: boolean) {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    const { isOnline, isSyncing, queue, addAction, syncQueue } = useOfflineSync(() => {
        // Refresh records when sync succeeds
        fetch(`/api/checkin/public?date=${date}`).then(r => r.json()).then(setRecords)
        showToast('ซิงค์ข้อมูลสำเร็จ', true)
    })

    // Auto-focus search on load
    useEffect(() => {
        if (!loading && searchRef.current) {
            searchRef.current.focus()
        }
    }, [loading])

    // Debounce search — 200ms delay
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 200)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        Promise.all([
            fetch('/api/children?lite=1').then(r => r.json()),
            fetch(`/api/checkin/public?date=${date}`).then(r => r.json()),
        ]).then(([c, r]) => {
            setChildren(c)
            setRecords(r)
            setLoading(false)
        })
    }, [date])

    const handleAction = async (childId: number, type: 'in' | 'out' | 'absent', pickupName?: string, pickupRelation?: string, note?: string) => {
        setProcessing(childId)
        const payload: CheckInPayload = { childId, type, date, method: 'qr' }
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
                const successMsg = type === 'in' ? 'เช็กเข้าสำเร็จ' : type === 'out' ? 'เช็กออกสำเร็จ' : 'แจ้งลาสำเร็จ'
                showToast(successMsg, true)
                setRecords(prev => {
                    const updated = prev.filter(r => r.childId !== childId)
                    return [...updated, data]
                })
                // Check for siblings
                if (type === 'in') {
                    try {
                        const siblingsRes = await fetch(`/api/checkin/siblings?childId=${childId}&date=${date}`)
                        const siblings = await siblingsRes.json()
                        if (siblings.length > 0) {
                            setPendingSiblings(siblings)
                        } else {
                            setPendingSiblings([])
                            setSearch('')
                            setDebouncedSearch('')
                            setTimeout(() => searchRef.current?.focus(), 100)
                        }
                    } catch {
                        setPendingSiblings([])
                    }
                } else {
                    // Auto-clear search and re-focus for next parent
                    setSearch('')
                    setDebouncedSearch('')
                    setTimeout(() => searchRef.current?.focus(), 100)
                }
            } else {
                showToast(data.message, false)
            }
        } catch {
            // Network error => enqueue
            addAction(payload)
            const offlineMsg = type === 'in' ? 'เช็กเข้า (ออฟไลน์)' : type === 'out' ? 'เช็กออก (ออฟไลน์)' : 'แจ้งลา (ออฟไลน์)'
            showToast(`${offlineMsg} - จะซิงค์อัตโนมัติเมื่อเชื่อต่อเน็ต`, true)
            
            // Optimistic update
            const now = new Date().toISOString()
            setRecords(prev => {
                const updated = prev.filter(r => r.childId !== childId)
                const mockRecord: CheckInRecord = {
                    childId,
                    checkInAt: type === 'in' ? now : (prev.find(r => r.childId === childId)?.checkInAt ?? null),
                    checkOutAt: type === 'out' ? now : null,
                    isAbsent: type === 'absent',
                    absenceReason: note ?? null
                }
                return [...updated, mockRecord]
            })
            
            setSearch('')
            setDebouncedSearch('')
            setTimeout(() => searchRef.current?.focus(), 100)
        }
        
        setProcessing(null)
        setCheckoutChild(null)
        setAbsentChild(null)
    }

    const getRecord = (childId: number) => recordMap.get(childId)

    // Sort: ยังไม่มา → อยู่ในศูนย์ → กลับบ้านแล้ว
    const getStatusOrder = (childId: number) => {
        const rec = getRecord(childId)
        if (!rec?.checkInAt) return 0 // ยังไม่มา
        if (!rec.checkOutAt) return 1  // อยู่ในศูนย์
        return 2                        // กลับบ้านแล้ว
    }

    const filtered = children
        .filter(c =>
            `${c.nickname}${c.firstName}${c.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
        .sort((a, b) => getStatusOrder(a.id) - getStatusOrder(b.id))

    const dateLabel = new Date(date).toLocaleDateString('th-TH', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    return (
        <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
            {/* Toast */}
            {toast && (
                <div
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg animate-scale-in flex items-center gap-2"
                    style={{ background: toast.ok ? '#1B4332' : '#9B1C1C', color: 'white' }}
                >
                    {toast.ok ? <Check size={16} /> : null}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div
                className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
                style={{ background: 'var(--forest)' }}
            >
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--sage)' }}
                >
                    <LogIn size={16} color="white" />
                </div>
                <div>
                    <p className="text-white text-sm font-semibold leading-none">เช็กชื่อเด็ก</p>
                    <p className="text-xs leading-none mt-0.5" style={{ color: 'var(--mint)' }}>{dateLabel}</p>
                </div>
            </div>

            {/* Network / Offline Indicator */}
            {(!isOnline || queue.length > 0) && (
                <div className="flex items-center gap-2 justify-between rounded-xl p-3 text-sm font-semibold mb-6 animate-fade-in"
                    style={{ background: isOnline ? 'var(--cream)' : '#FFF0ED', color: isOnline ? 'var(--text)' : 'var(--coral)', border: `1px solid ${isOnline ? 'var(--warm)' : '#F4C0B0'}` }}>
                    <div className="flex items-center gap-2">
                        {isOnline ? <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> : <WifiOff size={16} />}
                        <span>
                            {isSyncing ? 'กำลังซิงค์ข้อมูล...' : !isOnline ? 'ออฟไลน์: บันทึกข้อมูลในเครื่อง' : `รอซิงค์ ${queue.length} รายการ`}
                        </span>
                    </div>
                    {isOnline && !isSyncing && queue.length > 0 && (
                        <button onClick={syncQueue} className="px-3 py-1.5 bg-white rounded-lg shadow-sm text-xs">ซิงค์เดี๋ยวนี้</button>
                    )}
                </div>
            )}

            <div className="max-w-md mx-auto px-4 py-5">
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--muted)' }}>
                    ค้นหาชื่อบุตรหลาน แล้วกดเช็กเข้า / เช็กออก
                </p>

                {/* Search — auto-focus + debounce */}
                <div className="relative mb-5">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}><Search size={18} /></span>
                    <input
                        ref={searchRef}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="พิมพ์ชื่อหรือชื่อเล่น..."
                        className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                        style={{
                            border: '2px solid var(--warm)',
                            background: 'white',
                            color: 'var(--text)',
                            fontSize: 16, // prevent zoom on iOS
                        }}
                    />
                </div>

                {/* Sibling prompt banner */}
                {pendingSiblings.length > 0 && (
                    <div className="mb-5 rounded-2xl p-4" style={{ background: 'oklch(0.95 0.04 200)', border: '2px solid oklch(0.85 0.06 200)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <Users size={18} style={{ color: 'var(--sky)' }} />
                            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>พี่น้องยังไม่ได้เช็กเข้า</p>
                        </div>
                        <div className="space-y-2">
                            {pendingSiblings.map(s => (
                                <div key={s.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'white' }}>
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                                        style={{
                                            background: s.gender === 'male' ? '#DBE9F4' : '#FDE8F0',
                                            color: s.gender === 'male' ? 'var(--sky)' : '#C2185B',
                                        }}
                                    >
                                        {s.nickname.slice(0, 1)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{s.nickname}</p>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.firstName}</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            await handleAction(s.id, 'in')
                                            setPendingSiblings(prev => prev.filter(x => x.id !== s.id))
                                        }}
                                        disabled={processing === s.id}
                                        className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center gap-1"
                                        style={{ background: 'var(--sage)', boxShadow: '0 2px 8px rgba(82,183,136,0.3)' }}
                                    >
                                        {processing === s.id ? <Loader2 size={14} className="animate-spin" /> : <><LogIn size={14} /> เช็กเข้า</>}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setPendingSiblings([])
                                setSearch('')
                                setDebouncedSearch('')
                                setTimeout(() => searchRef.current?.focus(), 100)
                            }}
                            className="mt-3 text-xs font-medium"
                            style={{ color: 'var(--muted)' }}
                        >
                            ข้ามไป
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 size={32} className="animate-spin mx-auto" style={{ color: 'var(--sage)' }} />
                        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>กำลังโหลด...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(child => {
                            const rec = getRecord(child.id)
                            const isProcessing = processing === child.id
                            const checkedIn = !!rec?.checkInAt
                            const checkedOut = !!rec?.checkOutAt
                            const isAbsent = !!rec?.isAbsent

                            return (
                                <div
                                    key={child.id}
                                    className="rounded-2xl p-4"
                                    style={{
                                        background: isAbsent ? 'oklch(0.95 0.05 250)' : 'white',
                                        border: checkedIn && !checkedOut ? '2px solid var(--sage)' : isAbsent ? '1px solid var(--blue)' : '1px solid var(--warm)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        opacity: isAbsent ? 0.8 : 1
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                                            style={{
                                                background: child.gender === 'male' ? '#DBE9F4' : '#FDE8F0',
                                                color: child.gender === 'male' ? 'var(--sky)' : '#C2185B',
                                            }}
                                        >
                                            {child.nickname.slice(0, 1)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold" style={{ color: 'var(--text)' }}>{child.nickname}</p>
                                            <p className="text-sm" style={{ color: 'var(--muted)' }}>
                                                {child.firstName} {child.lastName}
                                            </p>
                                            {checkedIn && (
                                                <p className="text-xs mt-0.5" style={{ color: 'var(--sage)' }}>
                                                    เข้า {new Date(rec!.checkInAt!).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                                    {checkedOut && ` · ออก ${new Date(rec!.checkOutAt!).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`}
                                                </p>
                                            )}
                                            {isAbsent && (
                                                <p className="text-xs mt-0.5" style={{ color: 'var(--blue)' }}>
                                                    {rec?.absenceReason || 'แจ้งลา'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action button */}
                                        <div className="shrink-0">
                                            {checkedOut ? (
                                                <span className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--muted)' }}><Check size={14} /> กลับบ้านแล้ว</span>
                                            ) : checkedIn ? (
                                                <button
                                                    onClick={() => setCheckoutChild({ id: child.id, nickname: child.nickname })}
                                                    disabled={isProcessing}
                                                    className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                                                    style={{ background: '#FFF0ED', color: 'var(--coral)', border: '1px solid #F4C0B0' }}
                                                >
                                                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <><LogOut size={14} /> รับกลับ</>}
                                                </button>
                                            ) : isAbsent ? (
                                                <span className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--blue)' }}><Check size={14} /> ลาแล้ว</span>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setAbsentChild({ id: child.id, nickname: child.nickname })}
                                                        disabled={isProcessing}
                                                        className="px-3 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center"
                                                        style={{ background: 'var(--cream)', color: 'var(--text)', border: '1px solid var(--warm)' }}
                                                    >
                                                        <CalendarX2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(child.id, 'in')}
                                                        disabled={isProcessing}
                                                        className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                                                        style={{ background: 'var(--sage)', boxShadow: '0 4px 12px rgba(82,183,136,0.3)' }}
                                                    >
                                                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <><LogIn size={14} /> ส่งเด็ก</>}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {filtered.length === 0 && search && (
                            <div className="text-center py-10 flex flex-col items-center">
                                <UserSearch size={32} color="var(--muted)" className="mb-2" />
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                                    ไม่พบ &quot;{search}&quot; ลองพิมพ์ชื่อเล่นใหม่
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {checkoutChild && (
                <PickupDialog
                    open={!!checkoutChild}
                    childNickname={checkoutChild.nickname}
                    onClose={() => setCheckoutChild(null)}
                    onConfirm={(n, r) => handleAction(checkoutChild.id, 'out', n, r)}
                />
            )}

            {absentChild && (
                <AbsenceDialog
                    open={!!absentChild}
                    childNickname={absentChild.nickname}
                    onClose={() => setAbsentChild(null)}
                    onConfirm={(reason, note) => handleAction(absentChild.id, 'absent', undefined, undefined, note ? `${reason}: ${note}` : reason)}
                />
            )}
        </div>
    )
}

export default function ParentCheckInPage() {
    return (
        <Suspense>
            <ParentCheckIn />
        </Suspense>
    )
}
