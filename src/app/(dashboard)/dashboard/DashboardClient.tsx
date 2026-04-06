'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, UserCheck, Loader2 } from 'lucide-react'
import Modal from '@/app/components/ui/Modal'
import { useRouter } from 'next/navigation'

interface Child {
    id: number
    nickname: string
    firstName: string
    lastName: string
    gender: string
    enrollments: { level: { code: string; color: string } }[]
}

interface CheckInRecord {
    childId: number
    checkInAt: Date | null
    checkOutAt: Date | null
}

export default function DashboardClient({
    childList,
    checkInsToday
}: {
    childList: Child[]
    checkInsToday: CheckInRecord[]
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [processing, setProcessing] = useState<number | null>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const todayDateStr = new Date().toISOString().split('T')[0]
    const recordByChildId = useMemo(
        () => new Map(checkInsToday.map((record) => [record.childId, record])),
        [checkInsToday]
    )

    // Debounce search — 200ms
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 200)
        return () => clearTimeout(timer)
    }, [search])

    const filteredChildren = useMemo(() => {
        const s = debouncedSearch.toLowerCase()
        const list = !s ? childList : childList.filter(c => 
            c.nickname.toLowerCase().includes(s) || 
            c.firstName.toLowerCase().includes(s)
        )
        // Sort: ยังไม่มา → อยู่ในศูนย์ → กลับบ้านแล้ว
        return [...list].sort((a, b) => {
            const recA = recordByChildId.get(a.id)
            const recB = recordByChildId.get(b.id)
            const orderA = !recA?.checkInAt ? 0 : !recA.checkOutAt ? 1 : 2
            const orderB = !recB?.checkInAt ? 0 : !recB.checkOutAt ? 1 : 2
            return orderA - orderB
        })
    }, [childList, debouncedSearch, recordByChildId])

    const getRecord = (childId: number) => recordByChildId.get(childId)

    const handleManualCheckIn = async (childId: number, type: 'in' | 'out') => {
        setProcessing(childId)
        try {
            await fetch('/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ childId, type, date: todayDateStr, method: 'manual' }),
            })
            router.refresh()
            // Auto-clear search and re-focus
            setSearch('')
            setDebouncedSearch('')
            setTimeout(() => searchRef.current?.focus(), 100)
        } catch (err) {
            console.error(err)
        } finally {
            setProcessing(null)
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors"
                style={{ color: 'white', background: 'var(--sage)' }}
            >
                <UserCheck size={14} /> เช็กชื่อแทน
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="เช็กชื่อแทนผู้ปกครอง" icon={<UserCheck size={18} color="var(--sage)" />} maxWidth="max-w-xl">
                <div className="relative mb-4">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}><Search size={16} /></span>
                    <input
                        ref={searchRef}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="พิมพ์ชื่อจริง หรือชื่อเล่น..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                        style={{ border: '2px solid var(--warm)', background: 'var(--cream)', color: 'var(--text)' }}
                        autoFocus
                    />
                </div>

                <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredChildren.map(child => {
                        const rec = getRecord(child.id)
                        const lv = child.enrollments[0]?.level
                        
                        return (
                            <div
                                key={child.id}
                                className="rounded-xl p-3 flex items-center gap-3"
                                style={{
                                    background: rec?.checkOutAt ? 'var(--cream)' : 'white',
                                    border: '1px solid var(--warm)',
                                    opacity: rec?.checkOutAt ? 0.6 : 1,
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
                                        {lv && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: lv.color, color: 'white' }}>{lv.code}</span>
                                        )}
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        {child.firstName} {child.lastName}
                                    </p>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    {!rec?.checkInAt && (
                                        <button 
                                            onClick={() => handleManualCheckIn(child.id, 'in')} 
                                            disabled={processing === child.id}
                                            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 text-white flex items-center gap-1"
                                            style={{ background: 'var(--sage)', boxShadow: '0 2px 8px rgba(82,183,136,0.3)' }}
                                        >
                                            {processing === child.id ? <Loader2 size={14} className="animate-spin" /> : 'เข้า'}
                                        </button>
                                    )}
                                    {rec?.checkInAt && !rec.checkOutAt && (
                                        <button
                                            onClick={() => handleManualCheckIn(child.id, 'out')}
                                            disabled={processing === child.id}
                                            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
                                            style={{ background: '#FFF0ED', color: 'var(--coral)', border: '1px solid #F4C0B0' }}
                                        >
                                            {processing === child.id ? <Loader2 size={14} className="animate-spin" /> : 'ออก'}
                                        </button>
                                    )}
                                    {rec?.checkOutAt && (
                                        <span style={{ color: 'var(--muted)' }} className="flex items-center gap-1 text-xs font-semibold px-2">✓ กลับแล้ว</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {filteredChildren.length === 0 && search && (
                        <div className="text-center py-8">
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ไม่พบ &quot;{search}&quot;</p>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    )
}
