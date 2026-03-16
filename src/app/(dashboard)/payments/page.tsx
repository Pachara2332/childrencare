// app/(dashboard)/payments/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { StatsCardsSkeleton, TableSkeleton } from '@/app/components/ui/Skeleton'
import { CreditCard, Coins, CheckCircle, Banknote, Smartphone } from 'lucide-react'

interface Payment {
    id: number; childId: number; month: number; year: number
    tuitionFee: number; foodFee: number; otherFee: number
    otherFeeNote: string | null; status: string
    paidAt: string | null; paidMethod: string | null
    receiptNo: string | null; note: string | null; dueDate: string
    child: { nickname: string; firstName: string; lastName: string; gender: string }
}

interface Child { id: number; nickname: string; firstName: string; gender: string }

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    paid: { label: 'ชำระแล้ว', bg: 'oklch(0.93 0.04 160)', color: 'var(--leaf)' },
    pending: { label: 'รอชำระ', bg: 'oklch(0.95 0.04 70)', color: 'var(--sun)' },
    overdue: { label: 'เกินกำหนด', bg: 'oklch(0.95 0.04 25)', color: 'var(--coral)' },
    waived: { label: 'ยกเว้น', bg: 'oklch(0.94 0.03 240)', color: 'var(--sky)' },
}

const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [children, setChildren] = useState<Child[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('all')
    const [showAdd, setShowAdd] = useState(false)
    const [showPay, setShowPay] = useState<Payment | null>(null)
    const [saving, setSaving] = useState(false)

    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())

    const [addForm, setAddForm] = useState({
        childId: '', month: String(now.getMonth() + 1), year: String(now.getFullYear()),
        tuitionFee: '500', foodFee: '300', otherFee: '0', otherFeeNote: '', dueDate: '', note: '',
    })
    const [payForm, setPayForm] = useState({ paidMethod: 'cash', receiptNo: '', note: '' })

    const fetchPayments = () => {
        setLoading(true)
        fetch(`/api/payments?month=${selectedMonth}&year=${selectedYear}`)
            .then(r => r.json()).then(d => { setPayments(d); setLoading(false) })
    }

    useEffect(() => {
        fetch('/api/children').then(r => r.json()).then(d => {
            setChildren(d)
            if (d.length) setAddForm(f => ({ ...f, childId: String(d[0].id) }))
        })
    }, [])

    useEffect(() => { fetchPayments() }, [selectedMonth, selectedYear])

    const handleAddPayment = async () => {
        setSaving(true)
        const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...addForm,
                childId: Number(addForm.childId), month: Number(addForm.month), year: Number(addForm.year),
                tuitionFee: Number(addForm.tuitionFee), foodFee: Number(addForm.foodFee), otherFee: Number(addForm.otherFee),
            }),
        })
        if (res.ok) { setShowAdd(false); fetchPayments() }
        setSaving(false)
    }

    const handleMarkPaid = async () => {
        if (!showPay) return
        setSaving(true)
        const res = await fetch(`/api/payments/${showPay.id}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payForm),
        })
        if (res.ok) { setShowPay(null); fetchPayments() }
        setSaving(false)
    }

    const filtered = filterStatus === 'all' ? payments : payments.filter(p => p.status === filterStatus)
    const totalCollected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.tuitionFee + p.foodFee + p.otherFee, 0)
    const totalPending = payments.filter(p => p.status !== 'paid' && p.status !== 'waived').reduce((s, p) => s + p.tuitionFee + p.foodFee + p.otherFee, 0)
    const payRate = payments.length ? Math.round(payments.filter(p => p.status === 'paid').length / payments.length * 100) : 0

    return (
        <div className="space-y-4 animate-fade-up">
            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="px-3 py-1.5 rounded-lg text-sm input-field">
                    {thaiMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="w-24 px-3 py-1.5 rounded-lg text-sm input-field" />
                <button onClick={() => setShowAdd(true)} className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold btn-primary">
                    + เพิ่มรายการ
                </button>
            </div>

            {/* Stats strip */}
            <div className="card rounded-2xl p-4 flex items-center gap-6 flex-wrap">
                <div>
                    <p className="text-xl font-bold" style={{ color: 'var(--leaf)' }}>฿{totalCollected.toLocaleString()}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>รับแล้ว</p>
                </div>
                <div>
                    <p className="text-xl font-bold" style={{ color: 'var(--coral)' }}>฿{totalPending.toLocaleString()}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>ค้างชำระ</p>
                </div>
                <div>
                    <p className="text-xl font-bold" style={{ color: 'var(--sky)' }}>{payRate}%</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>อัตราชำระ</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-1.5 flex-wrap">
                {[['all', 'ทั้งหมด'], ...Object.entries(statusConfig).map(([k, v]) => [k, v.label])].map(([val, label]) => (
                    <button key={val} onClick={() => setFilterStatus(val)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                            background: filterStatus === val ? 'var(--leaf)' : 'white',
                            color: filterStatus === val ? 'white' : 'var(--muted)',
                            border: `1px solid ${filterStatus === val ? 'var(--leaf)' : 'var(--warm)'}`,
                            transition: 'all 0.15s var(--ease-out-quart)',
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="card rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-4"><TableSkeleton rows={5} cols={7} /></div>
                ) : filtered.length === 0 ? (
                    <div className="py-14 text-center flex flex-col items-center">
                        <div className="mb-3"><CreditCard size={36} color="var(--muted)" /></div>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>ไม่มีรายการ</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--warm)' }}>
                                    {['เด็ก', 'ค่าเทอม', 'ค่าอาหาร', 'รวม', 'ครบกำหนด', 'สถานะ', 'จัดการ'].map(h => (
                                        <th key={h} className="text-left text-xs font-semibold px-4 py-2.5 whitespace-nowrap" style={{ color: 'var(--muted)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => {
                                    const sc = statusConfig[p.status] ?? statusConfig.pending
                                    const total = p.tuitionFee + p.foodFee + p.otherFee
                                    return (
                                        <tr key={p.id} className="table-row" style={{ borderBottom: '1px solid var(--warm)' }}>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                                        style={{
                                                            background: p.child.gender === 'male' ? 'oklch(0.90 0.04 240)' : 'oklch(0.92 0.04 350)',
                                                            color: p.child.gender === 'male' ? 'var(--sky)' : 'oklch(0.50 0.12 350)',
                                                        }}>{p.child.nickname.slice(0, 1)}</div>
                                                    <div>
                                                        <p className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text)' }}>{p.child.nickname}</p>
                                                        <p className="text-xs whitespace-nowrap" style={{ color: 'var(--muted)' }}>{p.child.firstName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--text)' }}>฿{p.tuitionFee}</td>
                                            <td className="px-4 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--text)' }}>฿{p.foodFee}</td>
                                            <td className="px-4 py-2.5 text-sm font-bold whitespace-nowrap" style={{ color: 'var(--text)' }}>฿{total.toLocaleString()}</td>
                                            <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                                                {new Date(p.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block" style={{ background: sc.bg, color: sc.color }}>
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                {p.status !== 'paid' && p.status !== 'waived' ? (
                                                    <button
                                                        onClick={() => { setShowPay(p); setPayForm({ paidMethod: 'cash', receiptNo: '', note: '' }) }}
                                                        className="text-xs px-3 py-1.5 rounded-lg font-semibold btn-primary whitespace-nowrap"
                                                    >
                                                        บันทึกชำระ
                                                    </button>
                                                ) : (
                                                    <span className="text-xs whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                                                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="เพิ่มรายการค่าเทอม" icon={<Coins size={20} />}>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>เด็ก</label>
                        <select value={addForm.childId} onChange={e => setAddForm(f => ({ ...f, childId: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field">
                            {children.map(c => <option key={c.id} value={c.id}>{c.nickname} — {c.firstName}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[['ค่าเทอม', 'tuitionFee'], ['ค่าอาหาร', 'foodFee'], ['ค่าอื่นๆ', 'otherFee']].map(([label, key]) => (
                            <div key={key}>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>{label} (฿)</label>
                                <input type="number" value={addForm[key as keyof typeof addForm] as string} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field" />
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>วันครบกำหนด</label>
                            <input type="date" value={addForm.dueDate} onChange={e => setAddForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm btn-secondary">ยกเลิก</button>
                    <button onClick={handleAddPayment} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm btn-primary">
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </Modal>

            {/* Pay Modal */}
            <Modal open={!!showPay} onClose={() => setShowPay(null)} title="บันทึกการชำระเงิน" icon={<CheckCircle size={20} />} maxWidth="max-w-sm">
                {showPay && (
                    <>
                        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                            {showPay.child.nickname} — ฿{(showPay.tuitionFee + showPay.foodFee + showPay.otherFee).toLocaleString()}
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>วิธีชำระ</label>
                                <div className="flex gap-2">
                                    {[{val: 'cash', label: 'เงินสด', icon: <Banknote size={16}/>}, {val: 'transfer', label: 'โอนเงิน', icon: <Smartphone size={16}/>}].map(({val, label, icon}) => (
                                        <button key={val}
                                            onClick={() => setPayForm(f => ({ ...f, paidMethod: val }))}
                                            className="flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
                                            style={{
                                                background: payForm.paidMethod === val ? 'var(--leaf)' : 'var(--cream)',
                                                color: payForm.paidMethod === val ? 'white' : 'var(--text)',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s var(--ease-out-quart)',
                                            }}
                                        >{icon}{label}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>เลขที่ใบเสร็จ</label>
                                <input value={payForm.receiptNo} onChange={e => setPayForm(f => ({ ...f, receiptNo: e.target.value }))} placeholder="ไม่บังคับ" className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowPay(null)} className="flex-1 py-2.5 rounded-xl text-sm btn-secondary">ยกเลิก</button>
                            <button onClick={handleMarkPaid} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm btn-primary">
                                {saving ? '...' : 'ยืนยันชำระ'}
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    )
}