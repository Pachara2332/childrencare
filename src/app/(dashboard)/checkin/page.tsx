// app/(dashboard)/checkin/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { StatsSkeleton, TableSkeleton, ChildListSkeleton } from '@/app/components/ui/Skeleton'

interface Child {
    id: number
    code: string
    nickname: string
    firstName: string
    lastName: string
    gender: string
    qrToken: string
    disease: string | null
}

interface ClassLevel {
    id: number
    code: string
    name: string
    color: string
}

interface Enrollment {
    childId: number
    level: ClassLevel
}

interface CheckInRecord {
    id: number
    childId: number
    date: string
    checkInAt: string | null
    checkOutAt: string | null
    method: string
    child: Child
}

const LEVEL_COLOR_MAP: Record<string, { bg: string; text: string }> = {
    '#F4A261': { bg: '#FFF3E8', text: '#7D4E00' },
    '#52B788': { bg: '#E8F5EE', text: '#1B4332' },
    '#457B9D': { bg: '#E3EEF5', text: '#1D3557' },
    '#E76F51': { bg: '#FFF0ED', text: '#7D2A1A' },
    '#E9C46A': { bg: '#FFFBE8', text: '#7D6300' },
    '#9B72CF': { bg: '#F3EEFF', text: '#4A1D96' },
}
function getLevelColor(color: string) {
    return LEVEL_COLOR_MAP[color] ?? { bg: '#F0EDEA', text: '#4A5568' }
}

export default function CheckInPage() {
    const [tab, setTab] = useState<'today' | 'qr' | 'manual'>('today')
    const [records, setRecords] = useState<CheckInRecord[]>([])
    const [children, setChildren] = useState<Child[]>([])
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [levels, setLevels] = useState<ClassLevel[]>([])
    const [selectedLevelId, setSelectedLevelId] = useState<number | 'all'>('all')
    const [search, setSearch] = useState('')
    const [qrDataUrl, setQrDataUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    )

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchRecords = useCallback(async () => {
        setLoading(true)
        const res = await fetch(`/api/checkin?date=${selectedDate}`)
        const data = await res.json()
        setRecords(data)
        setLoading(false)
    }, [selectedDate])

    const fetchChildren = useCallback(async () => {
        const res = await fetch('/api/children')
        setChildren(await res.json())
    }, [])

    // Fetch enrollments to know each child's level
    const fetchEnrollments = useCallback(async () => {
        try {
            // Get active year first
            const yearsRes = await fetch('/api/academic-years')
            const years = await yearsRes.json()
            const activeYear = years.find((y: { isActive: boolean; id: number }) => y.isActive)
            if (!activeYear) return

            const res = await fetch(`/api/enrollments?yearId=${activeYear.id}`)
            const data: Array<{ childId: number; level: ClassLevel }> = await res.json()
            setEnrollments(data)

            // Collect unique levels
            const seen = new Set<number>()
            const uniqueLevels: ClassLevel[] = []
            for (const e of data) {
                if (!seen.has(e.level.id)) {
                    seen.add(e.level.id)
                    uniqueLevels.push(e.level)
                }
            }
            setLevels(uniqueLevels)
        } catch { /* ignore */ }
    }, [])

    // Generate QR code for today's check-in URL
    const generateQR = useCallback(async () => {
        const url = `${window.location.origin}/parent/checkin?date=${selectedDate}`
        const dataUrl = await QRCode.toDataURL(url, {
            width: 240, margin: 2,
            color: { dark: '#1C3D2E', light: '#F8F4EE' },
        })
        setQrDataUrl(dataUrl)
    }, [selectedDate])

    useEffect(() => { fetchRecords() }, [fetchRecords])
    useEffect(() => { fetchChildren() }, [fetchChildren])
    useEffect(() => { fetchEnrollments() }, [fetchEnrollments])
    useEffect(() => { if (tab === 'qr') generateQR() }, [tab, generateQR])

    const handleManualCheckIn = async (childId: number, type: 'in' | 'out') => {
        const res = await fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ childId, type, date: selectedDate, method: 'manual' }),
        })
        const data = await res.json()
        if (res.ok) {
            showToast(`✅ บันทึก${type === 'in' ? 'เข้า' : 'ออก'}เรียบร้อย`, true)
            fetchRecords()
        } else {
            showToast(`⚠️ ${data.message}`, false)
        }
    }

    // Helper: get level for a childId
    const getChildLevel = (childId: number) =>
        enrollments.find(e => e.childId === childId)?.level ?? null

    // Filter records by selected level
    const filteredRecords = records.filter(r => {
        if (selectedLevelId === 'all') return true
        return getChildLevel(r.childId)?.id === selectedLevelId
    })

    // Filter children list
    const filteredChildren = children.filter(c => {
        const matchSearch = `${c.nickname}${c.firstName}${c.lastName}${c.code}`
            .toLowerCase().includes(search.toLowerCase())
        if (!matchSearch) return false
        if (selectedLevelId === 'all') return true
        return getChildLevel(c.id)?.id === selectedLevelId
    })

    const getRecord = (childId: number) =>
        records.find(r => r.childId === childId)

    // Stats scoped to selected level
    const scopedChildren = selectedLevelId === 'all'
        ? children
        : children.filter(c => getChildLevel(c.id)?.id === selectedLevelId)
    const presentCount = filteredRecords.filter(r => r.checkInAt && !r.checkOutAt).length
    const checkedOutCount = filteredRecords.filter(r => r.checkOutAt).length
    const absentCount = scopedChildren.length - filteredRecords.filter(r => r.checkInAt).length

    return (
        <div className="space-y-5 animate-fade-up">
            {/* Toast */}
            {toast && (
                <div
                    className="fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg animate-scale-in"
                    style={{ background: toast.ok ? '#1B4332' : '#9B1C1C', color: 'white' }}
                >
                    {toast.msg}
                </div>
            )}

            {/* Stats bar */}
            {loading ? <StatsSkeleton /> : (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'มาเรียน', value: presentCount, color: '#D8F3DC', textColor: '#1B4332' },
                        { label: 'กลับบ้านแล้ว', value: checkedOutCount, color: '#EDE8E0', textColor: 'var(--muted)' },
                        { label: 'ยังไม่มา', value: absentCount, color: '#FFF0ED', textColor: 'var(--coral)' },
                    ].map(s => (
                        <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: s.color }}>
                            <div className="text-3xl font-bold" style={{ color: s.textColor }}>{s.value}</div>
                            <div className="text-xs mt-1" style={{ color: s.textColor }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Date picker */}
            <div className="flex items-center gap-3">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-3.5 py-2 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid var(--warm)', background: 'white', color: 'var(--text)' }}
                />
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    {new Date(selectedDate).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
            </div>

            {/* Level filter */}
            {levels.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedLevelId('all')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                            background: selectedLevelId === 'all' ? 'var(--forest)' : 'white',
                            color: selectedLevelId === 'all' ? 'white' : 'var(--muted)',
                            border: `1px solid ${selectedLevelId === 'all' ? 'var(--forest)' : 'var(--warm)'}`,
                        }}
                    >
                        🏫 ทุกชั้น
                    </button>
                    {levels.map(lv => {
                        const active = selectedLevelId === lv.id
                        const c = getLevelColor(lv.color)
                        return (
                            <button
                                key={lv.id}
                                onClick={() => setSelectedLevelId(lv.id)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                                style={{
                                    background: active ? lv.color : 'white',
                                    color: active ? 'white' : c.text,
                                    border: `1px solid ${active ? lv.color : 'var(--warm)'}`,
                                }}
                            >
                                <span
                                    className="w-2 h-2 rounded-full inline-block shrink-0"
                                    style={{ background: active ? 'rgba(255,255,255,0.7)' : lv.color }}
                                />
                                {lv.name}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {(['today', 'qr', 'manual'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: tab === t ? 'var(--leaf)' : 'white',
                            color: tab === t ? 'white' : 'var(--muted)',
                            border: `1px solid ${tab === t ? 'var(--leaf)' : 'var(--warm)'}`,
                        }}
                    >
                        {t === 'today' ? '📋 สรุปวันนี้' : t === 'qr' ? '📱 QR สำหรับผู้ปกครอง' : '✏️ เช็กชื่อด้วยตนเอง'}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === 'today' && (
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                    {loading ? (
                        <div className="p-4">
                            <TableSkeleton rows={5} cols={6} />
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-4xl mb-2">📋</p>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ยังไม่มีการเช็กชื่อ{selectedLevelId !== 'all' ? 'ในชั้นนี้' : 'ในวันนี้'}</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--warm)' }}>
                                    {['เด็ก', 'ชั้น', 'เวลาเข้า', 'เวลาออก', 'วิธี', 'สถานะ'].map(h => (
                                        <th key={h} className="text-left text-xs font-semibold px-4 py-3" style={{ color: 'var(--muted)' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map(r => {
                                    const lv = getChildLevel(r.childId)
                                    const lc = lv ? getLevelColor(lv.color) : null
                                    return (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--warm)' }}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                                                        style={{
                                                            background: r.child.gender === 'male' ? '#DBE9F4' : '#FDE8F0',
                                                            color: r.child.gender === 'male' ? 'var(--sky)' : '#C2185B',
                                                        }}
                                                    >
                                                        {r.child.nickname.slice(0, 1)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{r.child.nickname}</p>
                                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{r.child.firstName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {lv && lc ? (
                                                    <span
                                                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                                        style={{ background: lc.bg, color: lc.text }}
                                                    >
                                                        {lv.code}
                                                    </span>
                                                ) : <span className="text-xs" style={{ color: 'var(--muted)' }}>—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--text)' }}>
                                                {r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--muted)' }}>
                                                {r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                                    {r.method === 'qr' ? '📱 QR' : '✏️ ด้วยตนเอง'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                                    style={r.checkOutAt
                                                        ? { background: '#F0EDEA', color: 'var(--muted)' }
                                                        : r.checkInAt
                                                            ? { background: '#D8F3DC', color: '#1B4332' }
                                                            : { background: '#FFF0ED', color: 'var(--coral)' }
                                                    }
                                                >
                                                    {r.checkOutAt ? 'กลับบ้าน' : r.checkInAt ? 'อยู่ศูนย์' : 'ยังไม่มา'}
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
                    {/* QR Code card */}
                    <div
                        className="rounded-2xl p-6 text-center"
                        style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                        <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                            📱 QR Code สำหรับผู้ปกครอง
                        </h3>
                        <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
                            ผู้ปกครอง scan → ค้นหาชื่อลูก → กดเช็กเข้า/ออก
                        </p>
                        {qrDataUrl ? (
                            <>
                                <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-2xl mb-4" style={{ width: 200, height: 200 }} />
                                <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                                    ใช้ได้สำหรับวันที่ {new Date(selectedDate).toLocaleDateString('th-TH')}
                                </p>
                                <button
                                    onClick={() => {
                                        const a = document.createElement('a')
                                        a.href = qrDataUrl
                                        a.download = `checkin-qr-${selectedDate}.png`
                                        a.click()
                                    }}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                                    style={{ background: 'var(--leaf)' }}
                                >
                                    ⬇️ บันทึก QR Code
                                </button>
                            </>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-3xl animate-pulse">⏳</p>
                            </div>
                        )}
                    </div>

                    {/* Instructions */}
                    <div
                        className="rounded-2xl p-6"
                        style={{ background: 'var(--cream)', border: '1px solid var(--warm)' }}
                    >
                        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>วิธีใช้</h3>
                        {[
                            ['1️⃣', 'ครูพิมพ์ QR Code แล้วติดไว้หน้าศูนย์'],
                            ['2️⃣', 'ผู้ปกครอง scan QR ด้วยกล้องมือถือ'],
                            ['3️⃣', 'หน้าจอจะเปิดขึ้น → ค้นหาชื่อลูก'],
                            ['4️⃣', 'กดปุ่ม "เช็กเข้า" ตอนส่งเด็ก'],
                            ['5️⃣', 'กดปุ่ม "เช็กออก" ตอนรับเด็กกลับ'],
                        ].map(([num, text]) => (
                            <div key={num} className="flex gap-3 mb-3">
                                <span className="text-lg shrink-0">{num}</span>
                                <p className="text-sm" style={{ color: 'var(--text)' }}>{text}</p>
                            </div>
                        ))}
                        <div
                            className="mt-4 p-3 rounded-xl text-xs"
                            style={{ background: '#D8F3DC', color: '#1B4332' }}
                        >
                            💡 ไม่ต้องล็อกอิน ผู้ปกครอง scan แล้วใช้ได้เลย
                        </div>
                    </div>
                </div>
            )}

            {tab === 'manual' && (
                <div
                    className="rounded-2xl p-5"
                    style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                    <div className="relative mb-4">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2">🔍</span>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ค้นหาชื่อเด็ก..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                            style={{ border: '1px solid var(--warm)', background: 'var(--cream)', color: 'var(--text)' }}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredChildren.map(child => {
                            const rec = getRecord(child.id)
                            return (
                                <div
                                    key={child.id}
                                    className="rounded-xl p-3.5 flex items-center gap-3"
                                    style={{ border: '1px solid var(--warm)', background: 'var(--cream)' }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                                        style={{
                                            background: child.gender === 'male' ? '#DBE9F4' : '#FDE8F0',
                                            color: child.gender === 'male' ? 'var(--sky)' : '#C2185B',
                                        }}
                                    >
                                        {child.nickname.slice(0, 1)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{child.nickname}</p>
                                            {(() => {
                                                const lv = getChildLevel(child.id)
                                                if (!lv) return null
                                                const lc = getLevelColor(lv.color)
                                                return (
                                                    <span
                                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                                        style={{ background: lc.bg, color: lc.text }}
                                                    >
                                                        {lv.code}
                                                    </span>
                                                )
                                            })()}
                                        </div>
                                        <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{child.firstName} {child.lastName}</p>
                                        {rec?.checkInAt && (
                                            <p className="text-xs" style={{ color: 'var(--sage)' }}>
                                                เข้า {new Date(rec.checkInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                {rec.checkOutAt && ` · ออก ${new Date(rec.checkOutAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {!rec?.checkInAt && (
                                            <button
                                                onClick={() => handleManualCheckIn(child.id, 'in')}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                                                style={{ background: 'var(--sage)' }}
                                            >
                                                เข้า
                                            </button>
                                        )}
                                        {rec?.checkInAt && !rec.checkOutAt && (
                                            <button
                                                onClick={() => handleManualCheckIn(child.id, 'out')}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                style={{ background: '#FFF0ED', color: 'var(--coral)' }}
                                            >
                                                ออก
                                            </button>
                                        )}
                                        {rec?.checkOutAt && (
                                            <span className="text-xs" style={{ color: 'var(--muted)' }}>✓ กลับบ้าน</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}