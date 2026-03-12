// app/(dashboard)/payments/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { StatsCardsSkeleton, TableSkeleton } from '@/app/components/ui/Skeleton'

interface Payment {
    id: number
    childId: number
    month: number
    year: number
    tuitionFee: number
    foodFee: number
    otherFee: number
    otherFeeNote: string | null
    status: string
    paidAt: string | null
    paidMethod: string | null
    receiptNo: string | null
    note: string | null
    dueDate: string
    child: { nickname: string; firstName: string; lastName: string; gender: string }
}

interface Child { id: number; nickname: string; firstName: string; gender: string }

const statusConfig: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    paid: { label: 'ชำระแล้ว', bg: '#D8F3DC', color: '#1B4332', icon: '✅' },
    pending: { label: 'รอชำระ', bg: '#FFF8E8', color: '#7D4E00', icon: '⏳' },
    overdue: { label: 'เกินกำหนด', bg: '#FFF0ED', color: '#9B1C1C', icon: '🔴' },
    waived: { label: 'ยกเว้น', bg: '#EFF4FF', color: '#1D3557', icon: '🎁' },
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
        tuitionFee: '500', foodFee: '300', otherFee: '0', otherFeeNote: '',
        dueDate: '', note: '',
    })
    const [payForm, setPayForm] = useState({ paidMethod: 'cash', receiptNo: '', note: '' })

    const fetchPayments = () => {
        setLoading(true)
        fetch(`/api/payments?month=${selectedMonth}&year=${selectedYear}`)
            .then(r => r.json())
            .then(d => { setPayments(d); setLoading(false) })
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
                childId: Number(addForm.childId),
                month: Number(addForm.month),
                year: Number(addForm.year),
                tuitionFee: Number(addForm.tuitionFee),
                foodFee: Number(addForm.foodFee),
                otherFee: Number(addForm.otherFee),
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
        if (res.ok) {
            setShowPay(null)
            fetchPayments()
        }
        setSaving(false)
    }

    const filtered = filterStatus === 'all' ? payments : payments.filter(p => p.status === filterStatus)
    const totalCollected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.tuitionFee + p.foodFee + p.otherFee, 0)
    const totalPending = payments.filter(p => p.status !== 'paid' && p.status !== 'waived').reduce((s, p) => s + p.tuitionFee + p.foodFee + p.otherFee, 0)

    return (
        <div className="space-y-5 animate-fade-up">
            {/* Month/Year selector */}
            <div className="flex items-center gap-3 flex-wrap">
                <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="px-3.5 py-2 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid var(--warm)', background: 'white', color: 'var(--text)' }}
                >
                    {thaiMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <input
                    type="number"
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="w-24 px-3.5 py-2 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid var(--warm)', background: 'white', color: 'var(--text)' }}
                />
                <button
                    onClick={() => setShowAdd(true)}
                    className="ml-auto px-4 py-2 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'var(--leaf)' }}
                >
                    + เพิ่มรายการ
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'รับแล้ว', value: `฿${totalCollected.toLocaleString()}`, icon: '💰', bg: '#D8F3DC', color: '#1B4332' },
                    { label: 'ค้างชำระ', value: `฿${totalPending.toLocaleString()}`, icon: '⏳', bg: '#FFF0ED', color: 'var(--coral)' },
                    { label: 'อัตราชำระ', value: `${payments.length ? Math.round(payments.filter(p => p.status === 'paid').length / payments.length * 100) : 0}%`, icon: '📊', bg: '#EFF4FF', color: 'var(--sky)' },
                ].map(s => (
                    <div key={s.label} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2" style={{ background: s.bg }}>{s.icon}</div>
                        <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {[['all', '📋 ทั้งหมด'], ...Object.entries(statusConfig).map(([k, v]) => [k, `${v.icon} ${v.label}`])].map(([val, label]) => (
                    <button
                        key={val}
                        onClick={() => setFilterStatus(val)}
                        className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: filterStatus === val ? 'var(--leaf)' : 'white',
                            color: filterStatus === val ? 'white' : 'var(--muted)',
                            border: `1px solid ${filterStatus === val ? 'var(--leaf)' : 'var(--warm)'}`,
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                {loading ? (
                    <div className="p-4">
                        <TableSkeleton rows={5} cols={7} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-4xl mb-2">💳</p>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>ไม่มีรายการ</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: 'var(--cream)', borderBottom: '2px solid var(--warm)' }}>
                                {['เด็ก', 'ค่าเทอม', 'ค่าอาหาร', 'รวม', 'ครบกำหนด', 'สถานะ', 'จัดการ'].map(h => (
                                    <th key={h} className="text-left text-xs font-bold px-4 py-3" style={{ color: 'var(--muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => {
                                const sc = statusConfig[p.status] ?? statusConfig.pending
                                const total = p.tuitionFee + p.foodFee + p.otherFee
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--warm)' }}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                                                    style={{
                                                        background: p.child.gender === 'male' ? '#DBE9F4' : '#FDE8F0',
                                                        color: p.child.gender === 'male' ? 'var(--sky)' : '#C2185B',
                                                    }}
                                                >
                                                    {p.child.nickname.slice(0, 1)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.child.nickname}</p>
                                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.child.firstName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>฿{p.tuitionFee}</td>
                                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>฿{p.foodFee}</td>
                                        <td className="px-4 py-3 text-sm font-bold" style={{ color: 'var(--text)' }}>฿{total.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                                            {new Date(p.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                                                {sc.icon} {sc.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.status !== 'paid' && p.status !== 'waived' ? (
                                                <button
                                                    onClick={() => { setShowPay(p); setPayForm({ paidMethod: 'cash', receiptNo: '', note: '' }) }}
                                                    className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold"
                                                    style={{ background: 'var(--sage)', border: 'none', cursor: 'pointer' }}
                                                >
                                                    บันทึกชำระ
                                                </button>
                                            ) : (
                                                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Modal */}
            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="เพิ่มรายการค่าเทอม" icon="💰">
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>เด็ก</label>
                        <select value={addForm.childId} onChange={e => setAddForm(f => ({ ...f, childId: e.target.value }))}
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none input-field">
                            {children.map(c => <option key={c.id} value={c.id}>{c.nickname} — {c.firstName}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[['ค่าเทอม', 'tuitionFee'], ['ค่าอาหาร', 'foodFee'], ['ค่าอื่นๆ', 'otherFee']].map(([label, key]) => (
                            <div key={key}>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>{label} (฿)</label>
                                <input
                                    type="number"
                                    value={addForm[key as keyof typeof addForm] as string}
                                    onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none input-field"
                                />
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>วันครบกำหนด</label>
                            <input
                                type="date"
                                value={addForm.dueDate}
                                onChange={e => setAddForm(f => ({ ...f, dueDate: e.target.value }))}
                                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none input-field"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm btn-secondary">ยกเลิก</button>
                    <button onClick={handleAddPayment} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm btn-primary">
                        {saving ? '⏳ กำลังบันทึก...' : '✅ บันทึก'}
                    </button>
                </div>
            </Modal>

            {/* Pay Modal */}
            <Modal open={!!showPay} onClose={() => setShowPay(null)} title="บันทึกการชำระเงิน" icon="✅" maxWidth="max-w-sm">
                {showPay && (
                    <>
                        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                            {showPay.child.nickname} — ฿{(showPay.tuitionFee + showPay.foodFee + showPay.otherFee).toLocaleString()}
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>วิธีชำระ</label>
                                <div className="flex gap-2">
                                    {[['cash', '💵 เงินสด'], ['transfer', '📱 โอนเงิน']].map(([val, label]) => (
                                        <button
                                            key={val}
                                            onClick={() => setPayForm(f => ({ ...f, paidMethod: val }))}
                                            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                                            style={{
                                                background: payForm.paidMethod === val ? 'var(--leaf)' : 'var(--cream)',
                                                color: payForm.paidMethod === val ? 'white' : 'var(--text)',
                                                border: 'none', cursor: 'pointer',
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>เลขที่ใบเสร็จ</label>
                                <input
                                    value={payForm.receiptNo}
                                    onChange={e => setPayForm(f => ({ ...f, receiptNo: e.target.value }))}
                                    placeholder="ไม่บังคับ"
                                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none input-field"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowPay(null)} className="flex-1 py-2.5 rounded-xl text-sm btn-secondary">ยกเลิก</button>
                            <button onClick={handleMarkPaid} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm btn-primary">
                                {saving ? '⏳' : '✅ ยืนยันชำระ'}
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    )
}