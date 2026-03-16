'use client'

import { useState, useEffect } from 'react'
import { PiggyBank, TrendingUp, TrendingDown, BookOpen, AlertCircle, ChevronDown, ChevronUp, Wallet, FileText, Download } from 'lucide-react'
import { exportCSV, exportPDF } from '@/lib/exportUtils'

type TabType = 'overview' | 'record' | 'payout' | 'history'

interface ClassSummary {
    levelId: number
    name: string
    color: string
    total: number
    children: {
        childId: number
        code: string
        nickname: string
        firstName: string
        lastName: string
        balance: number
    }[]
}

interface SummaryData {
    totalAll: number
    byClass: ClassSummary[]
}

interface ChildSummary {
    childId: number
    code: string
    nickname: string
    firstName: string
    lastName: string
    balance: number
    className?: string
}

export default function SavingsPage() {
    const [tab, setTab] = useState<TabType>('overview')
    const [summary, setSummary] = useState<SummaryData | null>(null)
    const [loading, setLoading] = useState(true)
    const [expandedClass, setExpandedClass] = useState<number | null>(null)

    // For Tab 2: Record
    const [childrenList, setChildrenList] = useState<ChildSummary[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [selectedChild, setSelectedChild] = useState<ChildSummary | null>(null)
    const [transactionAmount, setTransactionAmount] = useState('')
    const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit')
    const [transactionNote, setTransactionNote] = useState('')
    const [transactionLoading, setTransactionLoading] = useState(false)
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null)

    // For Tab 3: Payout
    const [payoutLoading, setPayoutLoading] = useState(false)
    const [payoutLevelId, setPayoutLevelId] = useState<number | ''>('')
    const [payoutChildId, setPayoutChildId] = useState<number | ''>('')

    // For Tab 4: History
    const [history, setHistory] = useState<any[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [historyChildId, setHistoryChildId] = useState<number | ''>('')

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    useEffect(() => {
        if (tab === 'overview') {
            loadSummary()
        } else if (tab === 'record') {
            loadChildrenList()
        } else if (tab === 'payout') {
            loadChildrenList()
        } else if (tab === 'history') {
            loadChildrenList()
        }
    }, [tab])

    const loadSummary = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/savings/summary')
            if (res.ok) {
                const data = await res.json()
                setSummary(data)
            }
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    const loadChildrenList = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/savings/summary') // Reusing summary to get list
            if (res.ok) {
                const data: SummaryData = await res.json()
                let all: ChildSummary[] = []
                data.byClass.forEach(c => {
                    const mapped = c.children.map(ch => ({
                        ...ch,
                        className: c.name
                    }))
                    all = [...all, ...mapped]
                })
                setChildrenList(all)
            }
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedChild || !transactionAmount || isNaN(Number(transactionAmount))) return

        setTransactionLoading(true)
        try {
            const res = await fetch('/api/savings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    childId: selectedChild.childId,
                    amount: Number(transactionAmount),
                    type: transactionType,
                    note: transactionNote || undefined
                })
            })
            
            const data = await res.json()
            if (res.ok) {
                setToast({ msg: 'บันทึกรายการสำเร็จ', type: 'success' })
                setTransactionAmount('')
                setTransactionNote('')
                setSelectedChild(null)
                loadChildrenList() // reload balances
                setTimeout(() => setToast(null), 3000)
            } else {
                setToast({ msg: data.error || 'เกิดข้อผิดพลาด', type: 'error' })
                setTimeout(() => setToast(null), 3000)
            }
        } catch (err) {
            setToast({ msg: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', type: 'error' })
            setTimeout(() => setToast(null), 3000)
        }
        setTransactionLoading(false)
    }

    const handlePayout = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!payoutLevelId && !payoutChildId) return
        
        if (!confirm('ยืนยันการทำรายการถอนเงินออมจบปี? รายการนี้จะถอนเงินคงเหลือทั้งหมดของเด็กที่เลือก และจะไม่สามารถรับฝากเพิ่มได้อีกในปีการศึกษานี้')) return

        setPayoutLoading(true)
        try {
            const res = await fetch('/api/savings/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    levelId: payoutLevelId ? Number(payoutLevelId) : undefined,
                    childId: payoutChildId ? Number(payoutChildId) : undefined
                })
            })
            
            const data = await res.json()
            if (res.ok) {
                setToast({ msg: `ทำรายการสำเร็จ ${data.count} รายการ`, type: 'success' })
                setPayoutLevelId('')
                setPayoutChildId('')
                if (tab === 'overview') loadSummary()
                setTimeout(() => setToast(null), 3000)
            } else {
                setToast({ msg: data.error || 'เกิดข้อผิดพลาด', type: 'error' })
                setTimeout(() => setToast(null), 3000)
            }
        } catch (err) {
            setToast({ msg: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', type: 'error' })
            setTimeout(() => setToast(null), 3000)
        }
        setPayoutLoading(false)
    }

    const loadHistory = async (childId: number) => {
        setHistoryLoading(true)
        try {
            const res = await fetch(`/api/savings/child/${childId}`)
            if (res.ok) {
                const data = await res.json()
                setHistory(data.transactions || [])
            }
        } catch (err) {
            console.error(err)
        }
        setHistoryLoading(false)
    }

    useEffect(() => {
        if (historyChildId) {
            loadHistory(Number(historyChildId))
        } else {
            setHistory([])
        }
    }, [historyChildId])

    const filteredChildren = childrenList.filter(c => 
        c.nickname.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        c.firstName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.lastName.toLowerCase().includes(debouncedSearch.toLowerCase())
    )

    const tabs: { id: TabType, label: string }[] = [
        { id: 'overview', label: 'ภาพรวม' },
        { id: 'record', label: 'บันทึก' },
        { id: 'payout', label: 'ถอนจบปี' },
        { id: 'history', label: 'ประวัติ' },
    ]

    return (
        <div className="max-w-4xl space-y-6 animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.93 0.04 160)', color: 'var(--leaf)' }}>
                    <PiggyBank size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>ระบบเงินออม</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>จัดการบันทึกการฝาก-ถอนเงินออมของเด็ก</p>
                </div>
                <div className="ml-auto flex gap-1.5">
                    <button
                        onClick={() => {
                            if (!summary) return
                            const headers = ['ชื่อเล่น', 'ชื่อ-สกุล', 'ชั้น', 'ยอดเงินออม']
                            const rows: (string | number)[][] = []
                            summary.byClass.forEach(cls => {
                                cls.children.forEach(ch => {
                                    rows.push([ch.nickname, `${ch.firstName} ${ch.lastName}`, cls.name, ch.balance])
                                })
                            })
                            exportCSV(headers, rows, 'savings-summary')
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                        style={{ background: 'white', color: 'var(--muted)', border: '1px solid var(--warm)' }}
                    >
                        <Download size={12} /> CSV
                    </button>
                    <button
                        onClick={() => {
                            if (!summary) return
                            const headers = ['ชื่อเล่น', 'ชื่อ-สกุล', 'ชั้น', 'ยอดเงินออม']
                            const rows: (string | number)[][] = []
                            summary.byClass.forEach(cls => {
                                cls.children.forEach(ch => {
                                    rows.push([ch.nickname, `${ch.firstName} ${ch.lastName}`, cls.name, ch.balance])
                                })
                            })
                            exportPDF('รายงานเงินออม', headers, rows, 'savings-summary', [
                                { label: 'ยอดรวม', value: `฿${summary.totalAll.toLocaleString()}` },
                            ])
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                        style={{ background: 'white', color: 'var(--muted)', border: '1px solid var(--warm)' }}
                    >
                        <Download size={12} /> PDF
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
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

            {/* Tab 1: Overview */}
            {tab === 'overview' && (
                <div className="space-y-6">
                    {loading ? (
                        <div className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>กำลังโหลด...</div>
                    ) : summary ? (
                        <>
                            {/* Grand Total */}
                            <div className="card rounded-2xl p-6 text-center" style={{ background: 'var(--leaf)' }}>
                                <p className="text-white/80 font-semibold mb-1">ยอดเงินออมรวมทั้งศูนย์</p>
                                <h2 className="text-4xl font-bold text-white tracking-tight">
                                    ฿{summary.totalAll.toLocaleString()}
                                </h2>
                            </div>

                            {/* Class Breakdown */}
                            <div className="grid grid-cols-1 gap-4">
                                {summary.byClass.map(cls => (
                                    <div key={cls.levelId} className="card rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--warm)' }}>
                                        <div 
                                            className="px-5 py-4 flex items-center justify-between cursor-pointer"
                                            onClick={() => setExpandedClass(expandedClass === cls.levelId ? null : cls.levelId)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-8 rounded-full" style={{ background: cls.color }}></div>
                                                <div>
                                                    <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{cls.name}</h3>
                                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>เด็ก {cls.children.length} คน</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-bold text-lg" style={{ color: 'var(--leaf)' }}>฿{cls.total.toLocaleString()}</p>
                                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>ยอดรวม</p>
                                                </div>
                                                <div style={{ color: 'var(--muted)' }}>
                                                    {expandedClass === cls.levelId ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>
                                        </div>

                                        {expandedClass === cls.levelId && (
                                            <div className="px-5 pb-4 pt-2 border-t" style={{ borderColor: 'var(--warm)', background: 'var(--cream)' }}>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {cls.children.map(child => (
                                                        <div key={child.childId} className="bg-white rounded-xl p-3 flex justify-between items-center shadow-sm" style={{ border: '1px solid var(--warm)' }}>
                                                            <div>
                                                                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>น้อง{child.nickname}</p>
                                                                <p className="text-xs" style={{ color: 'var(--muted)' }}>{child.firstName} {child.lastName}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold" style={{ color: 'var(--leaf)' }}>฿{child.balance.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {cls.children.length === 0 && (
                                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>ไม่มีข้อมูลเด็ก</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="py-10 text-center flex flex-col items-center">
                            <AlertCircle size={36} color="var(--muted)" className="mb-2" />
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ไม่สามารถโหลดข้อมูลได้ หรือไม่มีข้อมูลปีการศึกษาปัจจุบัน</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Record Transaction */}
            {tab === 'record' && (
                <div className="space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ หรือชื่อเล่น..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 rounded-2xl text-sm"
                            style={{ 
                                border: '1px solid var(--warm)',
                                background: 'white',
                                color: 'var(--text)'
                            }}
                        />
                    </div>

                    {/* Content Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Child selection */}
                        <div className="card rounded-2xl border" style={{ borderColor: 'var(--warm)', background: 'white', height: 'fit-content' }}>
                            <div className="p-4 border-b" style={{ borderColor: 'var(--warm)', background: 'oklch(0.97 0.02 90)' }}>
                                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>เลือกเด็กนักเรียน</h3>
                            </div>
                            <div className="p-2 max-h-[400px] overflow-y-auto">
                                {loading && childrenList.length === 0 ? (
                                    <div className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>กำลังโหลด...</div>
                                ) : filteredChildren.length === 0 ? (
                                    <div className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>ไม่พบข้อมูลเด็ก</div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredChildren.map(child => (
                                            <button
                                                key={child.childId}
                                                onClick={() => setSelectedChild(child)}
                                                className="w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors"
                                                style={{
                                                    background: selectedChild?.childId === child.childId ? 'var(--cream)' : 'transparent',
                                                    border: `1px solid ${selectedChild?.childId === child.childId ? 'var(--sand)' : 'transparent'}`
                                                }}
                                            >
                                                <div>
                                                    <p className="text-sm font-bold" style={{ color: selectedChild?.childId === child.childId ? 'var(--olive)' : 'var(--text)' }}>
                                                        น้อง{child.nickname}
                                                    </p>
                                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{child.firstName} {child.lastName} • {child.className}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold" style={{ color: 'var(--leaf)' }}>฿{child.balance.toLocaleString()}</p>
                                                    <p className="text-[10px]" style={{ color: 'var(--muted)' }}>ยอดปัจจุบัน</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Transaction form */}
                        <div className="card rounded-2xl border p-5" style={{ borderColor: 'var(--warm)', background: 'white', height: 'fit-content' }}>
                            {!selectedChild ? (
                                <div className="py-16 text-center flex flex-col items-center justify-center">
                                    <AlertCircle size={32} style={{ color: 'var(--sand)' }} className="mb-3" />
                                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>กรุณาเลือกเด็กนักเรียน</p>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>คลิกที่รายชื่อด้านซ้ายเพื่อทำรายการ</p>
                                </div>
                            ) : (
                                <form onSubmit={handleTransaction} className="space-y-4 animate-fade-in">
                                    <div className="pb-4 mb-4 border-b" style={{ borderColor: 'var(--warm)' }}>
                                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>กำลังทำรายการให้</p>
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>น้อง{selectedChild.nickname}</h3>
                                            <div className="text-right">
                                                <p className="text-xs" style={{ color: 'var(--muted)' }}>ยอดคงเหลือ</p>
                                                <p className="text-lg font-bold" style={{ color: 'var(--leaf)' }}>฿{selectedChild.balance.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Type Toggle */}
                                    <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--cream)' }}>
                                        <button
                                            type="button"
                                            onClick={() => setTransactionType('deposit')}
                                            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                            style={{
                                                background: transactionType === 'deposit' ? 'white' : 'transparent',
                                                color: transactionType === 'deposit' ? 'var(--leaf)' : 'var(--muted)',
                                                boxShadow: transactionType === 'deposit' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                                            }}
                                        >
                                            <TrendingUp size={16} /> ฝากเงิน
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTransactionType('withdraw')}
                                            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                            style={{
                                                background: transactionType === 'withdraw' ? 'white' : 'transparent',
                                                color: transactionType === 'withdraw' ? 'var(--rust)' : 'var(--muted)',
                                                boxShadow: transactionType === 'withdraw' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                                            }}
                                        >
                                            <TrendingDown size={16} /> ถอนเงิน
                                        </button>
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>จำนวนเงิน (บาท)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: 'var(--muted)' }}>฿</span>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max={transactionType === 'withdraw' ? selectedChild.balance : undefined}
                                                value={transactionAmount}
                                                onChange={(e) => setTransactionAmount(e.target.value)}
                                                className="w-full pl-8 pr-4 py-3 rounded-xl text-lg font-bold"
                                                style={{ border: '1px solid var(--warm)', background: 'white' }}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {transactionType === 'withdraw' && selectedChild.balance === 0 && (
                                            <p className="text-xs mt-1" style={{ color: 'var(--rust)' }}>ไม่มียอดเงินให้ถอน</p>
                                        )}
                                    </div>

                                    {/* Note */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>หมายเหตุ (ตัวเลือก)</label>
                                        <input
                                            type="text"
                                            value={transactionNote}
                                            onChange={(e) => setTransactionNote(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl text-sm"
                                            style={{ border: '1px solid var(--warm)', background: 'white' }}
                                            placeholder={transactionType === 'deposit' ? "เช่น ฝากประจำสัปดาห์..." : "เช่น ซื้อขนม..."}
                                        />
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={transactionLoading || (transactionType === 'withdraw' && (Number(transactionAmount) > selectedChild.balance || selectedChild.balance === 0))}
                                        className="w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                                        style={{ 
                                            background: transactionType === 'deposit' ? 'var(--leaf)' : 'var(--rust)',
                                            color: 'white'
                                        }}
                                    >
                                        {transactionLoading ? 'กำลังบันทึก...' : `ยืนยันการ${transactionType === 'deposit' ? 'ฝาก' : 'ถอน'}เงิน`}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 3: Payout */}
            {tab === 'payout' && (
                <div className="card rounded-2xl border p-6 md:p-8 animate-fade-in text-center max-w-2xl mx-auto" style={{ borderColor: 'var(--warm)', background: 'white' }}>
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'oklch(0.95 0.04 25)', color: 'var(--rust)' }}>
                        <Wallet size={32} />
                    </div>
                    <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>ถอนเงินออมจบปีการศึกษา / ลาออก</h2>
                    <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
                        ระบบจะทำการถอนเงินคงเหลือทั้งหมดของเด็กที่เลือก <br/>
                        และบันทึกเป็นรายการ "ถอนจบปี" โดยจะไม่สามารถฝากเงินเพิ่มได้อีกในเทอมนี้
                    </p>

                    <form onSubmit={handlePayout} className="space-y-6 text-left">
                        <div className="p-5 rounded-2xl border bg-slate-50 relative" style={{ borderColor: 'var(--warm)' }}>
                            <div className="absolute -top-3 left-4 px-2 bg-slate-50 text-xs font-bold" style={{ color: 'var(--ocean)' }}>ตัวเลือกที่ 1: ถอนยกชั้นเรียน</div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>เลือกชั้นเรียนระดับอนุบาล</label>
                            <select
                                value={payoutLevelId}
                                onChange={(e) => { setPayoutLevelId(Number(e.target.value)); setPayoutChildId('') }}
                                className="w-full px-4 py-3 rounded-xl border bg-white"
                                style={{ borderColor: 'var(--warm)' }}
                            >
                                <option value="">-- เลือกชั้นเรียน --</option>
                                {summary?.byClass.map(c => (
                                    <option key={c.levelId} value={c.levelId}>{c.name}</option>
                                ))}
                            </select>
                            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>หมายเหตุ: ระบบจะทำรายการให้ทุกคนในชั้นที่มีเงินออมเหลืออยู่</p>
                        </div>

                        <div className="text-center font-bold" style={{ color: 'var(--muted)' }}>หรือ</div>

                        <div className="p-5 rounded-2xl border bg-slate-50 relative" style={{ borderColor: 'var(--warm)' }}>
                            <div className="absolute -top-3 left-4 px-2 bg-slate-50 text-xs font-bold" style={{ color: 'var(--ocean)' }}>ตัวเลือกที่ 2: ถอนรายบุคคล</div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>เลือกเด็กนักเรียน (เฉพาะกรณีลาออกหรือต้องการถอนก่อนเพื่อน)</label>
                            <select
                                value={payoutChildId}
                                onChange={(e) => { setPayoutChildId(Number(e.target.value)); setPayoutLevelId('') }}
                                className="w-full px-4 py-3 rounded-xl border bg-white"
                                style={{ borderColor: 'var(--warm)' }}
                            >
                                <option value="">-- เลือกนักเรียน --</option>
                                {childrenList.filter(c => c.balance > 0).map(c => (
                                    <option key={c.childId} value={c.childId}>น้อง{c.nickname} ({c.firstName} {c.lastName}) - ดอกเบี้ย ฿{c.balance.toLocaleString()}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={payoutLoading || (!payoutLevelId && !payoutChildId)}
                            className="w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-md mt-6"
                            style={{ background: 'var(--rust)', color: 'white' }}
                        >
                            {payoutLoading ? 'กำลังประมวลผล...' : 'ยืนยันทำรายการถอนเงินจบปี'}
                        </button>
                    </form>
                </div>
            )}

            {/* Tab 4: History */}
            {tab === 'history' && (
                <div className="space-y-6">
                    <div className="card rounded-2xl border p-5 md:flex md:items-center md:justify-between gap-4" style={{ borderColor: 'var(--warm)', background: 'white' }}>
                        <div className="flex-1 mb-4 md:mb-0">
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>ดูประวัติการเดินบัญชีของนักเรียน</label>
                            <select
                                value={historyChildId}
                                onChange={(e) => setHistoryChildId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-4 py-3 rounded-xl border bg-white"
                                style={{ borderColor: 'var(--warm)' }}
                            >
                                <option value="">-- พิมพ์/เลือกชื่อนักเรียน --</option>
                                {childrenList.map(c => (
                                    <option key={c.childId} value={c.childId}>น้อง{c.nickname} ({c.firstName} {c.lastName}) - {c.className}</option>
                                ))}
                            </select>
                        </div>
                        {historyChildId && (
                            <div className="text-right shrink-0">
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>ยอดเงินออมปัจจุบัน</p>
                                <p className="text-3xl font-bold" style={{ color: 'var(--leaf)' }}>
                                    ฿{childrenList.find(c => c.childId === Number(historyChildId))?.balance.toLocaleString() || '0'}
                                </p>
                            </div>
                        )}
                    </div>

                    {historyChildId && (
                        <div className="card rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--warm)', background: 'white' }}>
                            <div className="p-4 border-b flex justify-between items-center bg-slate-50/50" style={{ borderColor: 'var(--warm)' }}>
                                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>รายการเดินบัญชี (Statement)</h3>
                                <button
                                    onClick={() => alert('ฟังก์ชันพิมพ์ใบแจ้งยอดจะมาในเวอร์ชันถัดไป')}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border shadow-sm flex items-center gap-1.5"
                                    style={{ color: 'var(--ocean)', borderColor: 'var(--warm)' }}
                                >
                                    <FileText size={14} /> พิมพ์ใบแจ้งยอด
                                </button>
                            </div>
                            
                            {historyLoading ? (
                                <div className="py-16 text-center text-sm" style={{ color: 'var(--muted)' }}>กำลังโหลดประวัติ...</div>
                            ) : history.length === 0 ? (
                                <div className="py-16 text-center text-sm" style={{ color: 'var(--muted)' }}>ไม่พบประวัติการฝาก-ถอนของเด็กคนนี้ในปีการศึกษาปัจจุบัน</div>
                            ) : (
                                <div className="divide-y" style={{ borderColor: 'var(--warm)' }}>
                                    {history.map((t, idx) => (
                                        <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ 
                                                    background: t.type === 'deposit' ? 'oklch(0.95 0.04 160)' : 'oklch(0.95 0.04 25)',
                                                    color: t.type === 'deposit' ? 'var(--leaf)' : 'var(--rust)'
                                                }}>
                                                    {t.type === 'deposit' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm mb-0.5" style={{ color: 'var(--text)' }}>
                                                        {t.type === 'deposit' ? 'ฝากเงิน' : t.type === 'payout' ? 'ถอนเงินจบปีการศึกษา' : 'ถอนเงิน'}
                                                    </p>
                                                    <div className="flex gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                                                        <span>{new Date(t.date).toLocaleDateString('th-TH')}</span>
                                                        {t.note && <span>• {t.note}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm" style={{ color: t.type === 'deposit' ? 'var(--leaf)' : 'var(--rust)' }}>
                                                    {t.type === 'deposit' ? '+' : '-'}฿{Math.abs(t.amount).toLocaleString()}
                                                </p>
                                                <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{t.recordedBy}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div 
                    className="fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-up z-50 text-white font-semibold text-sm"
                    style={{ background: toast.type === 'success' ? 'var(--leaf)' : 'var(--rust)' }}
                >
                    {toast.msg}
                </div>
            )}
        </div>
    )
}
