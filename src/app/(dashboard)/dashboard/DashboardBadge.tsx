'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, UserX, UserCheck, Loader2 } from 'lucide-react'
import Modal from '@/app/components/ui/Modal'

interface UncheckedChild {
    id: number
    nickname: string
    firstName: string
    gender: string
    levelCode: string | null
    levelColor: string | null
}

interface Summary {
    present: number
    checkedOut: number
    unchecked: number
    total: number
    uncheckedChildren: UncheckedChild[]
}

export default function DashboardBadge() {
    const [summary, setSummary] = useState<Summary | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [processing, setProcessing] = useState<number | null>(null)

    const todayDateStr = new Date().toISOString().split('T')[0]

    const fetchSummary = useCallback(async () => {
        try {
            const res = await fetch(`/api/checkin/summary?date=${todayDateStr}`)
            if (res.ok) {
                setSummary(await res.json())
            }
        } catch {
            // silently fail
        }
    }, [todayDateStr])

    // Initial fetch + poll every 30 seconds
    useEffect(() => {
        fetchSummary()
        const interval = setInterval(fetchSummary, 30000)
        return () => clearInterval(interval)
    }, [fetchSummary])

    const handleQuickCheckIn = async (childId: number) => {
        setProcessing(childId)
        try {
            await fetch('/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ childId, type: 'in', date: todayDateStr, method: 'manual' }),
            })
            // Re-fetch summary to update counts
            await fetchSummary()
        } catch {
            // silently fail
        } finally {
            setProcessing(null)
        }
    }

    if (!summary || summary.unchecked === 0) return null

    return (
        <>
            <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all animate-pulse-slow"
                style={{
                    background: 'oklch(0.95 0.06 25)',
                    color: 'var(--coral)',
                    border: '1.5px solid oklch(0.85 0.08 25)',
                }}
            >
                <AlertCircle size={14} />
                ยังไม่มา {summary.unchecked} คน
            </button>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={`เด็กที่ยังไม่มา (${summary.unchecked} คน)`}
                icon={<UserX size={18} color="var(--coral)" />}
                maxWidth="max-w-md"
            >
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {summary.uncheckedChildren.map(child => (
                        <div
                            key={child.id}
                            className="flex items-center gap-3 rounded-xl p-3"
                            style={{ background: 'var(--cream)', border: '1px solid var(--warm)' }}
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
                                    {child.levelCode && child.levelColor && (
                                        <span
                                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                            style={{ background: child.levelColor, color: 'white' }}
                                        >
                                            {child.levelCode}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>{child.firstName}</p>
                            </div>
                            <button
                                onClick={() => handleQuickCheckIn(child.id)}
                                disabled={processing === child.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 disabled:opacity-50"
                                style={{ background: 'var(--sage)' }}
                            >
                                {processing === child.id
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : <><UserCheck size={12} /> เช็กเข้า</>
                                }
                            </button>
                        </div>
                    ))}
                    {summary.uncheckedChildren.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ทุกคนมาครบแล้ว</p>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    )
}
