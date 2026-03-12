// app/parent/checkin/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

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
}

function ParentCheckIn() {
    const params = useSearchParams()
    const date = params.get('date') ?? new Date().toISOString().split('T')[0]

    const [children, setChildren] = useState<Child[]>([])
    const [records, setRecords] = useState<CheckInRecord[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [processing, setProcessing] = useState<number | null>(null)

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    useEffect(() => {
        Promise.all([
            fetch('/api/children').then(r => r.json()),
            fetch(`/api/checkin/public?date=${date}`).then(r => r.json()),
        ]).then(([c, r]) => {
            setChildren(c)
            setRecords(r)
            setLoading(false)
        })
    }, [date])

    const handleAction = async (childId: number, type: 'in' | 'out') => {
        setProcessing(childId)
        const res = await fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ childId, type, date, method: 'qr' }),
        })
        const data = await res.json()
        if (res.ok) {
            showToast(`✅ ${type === 'in' ? 'เช็กเข้าสำเร็จ' : 'เช็กออกสำเร็จ'}`, true)
            setRecords(prev => {
                const updated = prev.filter(r => r.childId !== childId)
                return [...updated, data]
            })
        } else {
            showToast(`⚠️ ${data.message}`, false)
        }
        setProcessing(null)
    }

    const filtered = children.filter(c =>
        `${c.nickname}${c.firstName}${c.lastName}`.toLowerCase().includes(search.toLowerCase())
    )

    const getRecord = (childId: number) => records.find(r => r.childId === childId)

    const dateLabel = new Date(date).toLocaleDateString('th-TH', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    return (
        <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
            {/* Toast */}
            {toast && (
                <div
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg animate-scale-in"
                    style={{ background: toast.ok ? '#1B4332' : '#9B1C1C', color: 'white' }}
                >
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div
                className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
                style={{ background: 'var(--forest)' }}
            >
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ background: 'var(--sage)' }}
                >
                    🌱
                </div>
                <div>
                    <p className="text-white text-sm font-semibold leading-none">เช็กชื่อเด็ก</p>
                    <p className="text-xs leading-none mt-0.5" style={{ color: 'var(--mint)' }}>{dateLabel}</p>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-5">
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--muted)' }}>
                    ค้นหาชื่อบุตรหลาน แล้วกดเช็กเข้า / เช็กออก
                </p>

                {/* Search */}
                <div className="relative mb-5">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">🔍</span>
                    <input
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

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-4xl animate-pulse">👶</p>
                        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>กำลังโหลด...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(child => {
                            const rec = getRecord(child.id)
                            const isProcessing = processing === child.id
                            const checkedIn = !!rec?.checkInAt
                            const checkedOut = !!rec?.checkOutAt

                            return (
                                <div
                                    key={child.id}
                                    className="rounded-2xl p-4"
                                    style={{
                                        background: 'white',
                                        border: checkedIn && !checkedOut ? '2px solid var(--sage)' : '1px solid var(--warm)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
                                                    🟢 เข้า {new Date(rec!.checkInAt!).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                                    {checkedOut && ` · 🔴 ออก ${new Date(rec!.checkOutAt!).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action button */}
                                        <div className="shrink-0">
                                            {checkedOut ? (
                                                <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>✓ กลับบ้านแล้ว</span>
                                            ) : checkedIn ? (
                                                <button
                                                    onClick={() => handleAction(child.id, 'out')}
                                                    disabled={isProcessing}
                                                    className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                                    style={{ background: '#FFF0ED', color: 'var(--coral)', border: '1px solid #F4C0B0' }}
                                                >
                                                    {isProcessing ? '⏳' : '🔴 รับกลับ'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAction(child.id, 'in')}
                                                    disabled={isProcessing}
                                                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                                                    style={{ background: 'var(--sage)', boxShadow: '0 4px 12px rgba(82,183,136,0.3)' }}
                                                >
                                                    {isProcessing ? '⏳' : '🟢 ส่งเด็ก'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {filtered.length === 0 && search && (
                            <div className="text-center py-10">
                                <p className="text-3xl mb-2">😕</p>
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                                    ไม่พบ &quot;{search}&quot; ลองพิมพ์ชื่อเล่นใหม่
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
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