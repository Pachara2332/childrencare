'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { PiggyBank, TrendingUp, TrendingDown, FileText, AlertCircle, Loader2 } from 'lucide-react'

// Reuse types from API
interface Transaction {
    id: number
    date: string
    amount: number
    type: string
    note: string | null
    recordedBy: string
}

interface SavingData {
    childName: string
    className: string
    balance: number
    transactions: Transaction[]
}

function ParentSaving() {
    const params = useSearchParams()
    const token = params.get('token')
    
    const [data, setData] = useState<SavingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!token) {
            setError('ไม่พบรหัสอ้างอิง (Token)')
            setLoading(false)
            return
        }

        fetch(`/api/savings/public?token=${token}`)
            .then(async res => {
                if (!res.ok) {
                    const errData = await res.json()
                    throw new Error(errData.error || 'ไม่สามารถดึงข้อมูลได้')
                }
                return res.json()
            })
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [token])

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--cream)' }}>
                <Loader2 size={40} className="animate-spin mb-4" style={{ color: 'var(--leaf)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>กำลังโหลดข้อมูลสมุดบัญชี...</p>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--cream)' }}>
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6" style={{ background: 'white', border: '1px solid var(--warm)', color: 'var(--rust)' }}>
                    <AlertCircle size={32} />
                </div>
                <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>เกิดข้อผิดพลาด</h1>
                <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>{error || 'ไม่สามารถเข้าถึงข้อมูลได้ กรุณาสแกน QR Code ใหม่อีกครั้ง'}</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-10" style={{ background: 'var(--cream)' }}>
            {/* Header */}
            <div className="p-6 pb-24 rounded-b-[2rem]" style={{ background: 'var(--forest)' }}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/10 text-white shrink-0">
                        <PiggyBank size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">สมุดออมเงิน</h1>
                        <p className="text-xs text-white/70">ศูนย์พัฒนาเด็กเล็กบ้านหนองนางเลิง</p>
                    </div>
                </div>
                
                <div className="animate-fade-up">
                    <p className="text-white/80 text-sm mb-1">สมุดบัญชีของ</p>
                    <h2 className="text-2xl font-bold text-white mb-1">{data.childName}</h2>
                    <p className="text-sm" style={{ color: 'var(--mint)' }}>{data.className}</p>
                </div>
            </div>

            {/* Balance Card - overlaps header */}
            <div className="px-4 -mt-16 relative z-10 animate-fade-up" style={{ animationDelay: '100ms' }}>
                <div className="bg-white rounded-3xl p-6 shadow-xl" style={{ border: '1px solid var(--warm)' }}>
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                            ยอดเงินออมคงเหลือ
                        </p>
                        <h3 className="text-5xl font-bold tracking-tight mb-2" style={{ color: 'var(--leaf)' }}>
                            ฿{data.balance.toLocaleString()}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-[10px] font-semibold" style={{ color: 'var(--ocean)' }}>
                            <FileText size={12} /> ข้อมูลอัปเดตล่าสุด
                        </div>
                    </div>
                </div>
            </div>

            {/* Statement / Transaction History */}
            <div className="mt-8 px-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
                <h4 className="text-sm font-bold mb-4 px-2" style={{ color: 'var(--text)' }}>รายการเดินบัญชี (Statement)</h4>
                
                <div className="bg-white rounded-3xl border overflow-hidden shadow-sm" style={{ borderColor: 'var(--warm)' }}>
                    {data.transactions.length === 0 ? (
                        <div className="p-8 text-center">
                            <PiggyBank size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ยังไม่มีรายการฝาก-ถอน</p>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--warm)' }}>
                            {data.transactions.map((t, idx) => (
                                <div key={t.id} className="p-4 flex justify-between items-center transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0" style={{ 
                                            background: t.type === 'deposit' ? 'oklch(0.95 0.04 160)' : 'oklch(0.95 0.04 25)',
                                            color: t.type === 'deposit' ? 'var(--leaf)' : 'var(--rust)'
                                        }}>
                                            {t.type === 'deposit' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm mb-0.5" style={{ color: 'var(--text)' }}>
                                                {t.type === 'deposit' ? 'ฝากเงิน' : t.type === 'payout' ? 'ถอนจบปีการศึกษา' : 'ถอนเงิน'}
                                            </p>
                                            <div className="flex gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                                                <span>{new Date(t.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                {t.note && <span className="truncate max-w-[100px]">• {t.note}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[15px]" style={{ color: t.type === 'deposit' ? 'var(--leaf)' : 'var(--text)' }}>
                                            {t.type === 'deposit' ? '+' : '-'}฿{Math.abs(t.amount).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{t.recordedBy === 'system/teacher' ? 'ระบบ' : 'ครู'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-8 text-center">
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--muted)' }}>
                    ศูนย์พัฒนาเด็กเล็ก
                </p>
            </div>
        </div>
    )
}

export default function SavingsParentPageWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--cream)' }}>
                 <Loader2 size={40} className="animate-spin mb-4" style={{ color: 'var(--leaf)' }} />
            </div>
        }>
            <ParentSaving />
        </Suspense>
    )
}
