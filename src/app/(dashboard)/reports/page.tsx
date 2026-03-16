// app/(dashboard)/reports/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from '@/app/components/ui/Skeleton'
import { Inbox, Leaf } from 'lucide-react'

interface ReportData {
    centerName: string; location: string; academicYear: string
    totalChildren: number; maleCount: number; femaleCount: number
    teacherCount: number; avgAttendance: number; presentToday: number
    totalRevenue: number; pendingRevenue: number
    monthlyAttendance: { month: string; rate: number; count: number }[]
    paymentSummary: { status: string; count: number; amount: number }[]
    childrenList: {
        code: string; name: string; nickname: string; age: string
        parent: string; phone: string; attendanceRate: number; disease: string | null
    }[]
}

const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const now = new Date()

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())
    const [exporting, setExporting] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/reports?month=${selectedMonth}&year=${selectedYear}`)
            .then(r => r.json()).then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [selectedMonth, selectedYear])

    const handleExport = async (type: 'pdf' | 'csv') => {
        setExporting(type)
        const res = await fetch(`/api/reports/export?month=${selectedMonth}&year=${selectedYear}&type=${type}`)
        if (res.ok) {
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `report-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.${type === 'pdf' ? 'html' : 'csv'}`
            a.click()
        }
        setExporting(null)
    }

    if (loading) return (
        <div className="space-y-5 animate-fade-up">
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
                <div className="ml-auto flex gap-2"><Skeleton className="h-9 w-28" /><Skeleton className="h-9 w-28" /></div>
            </div>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        </div>
    )

    if (!data) return (
        <div className="text-center py-20 card rounded-2xl flex flex-col items-center">
            <div className="mb-3"><Inbox size={32} color="var(--muted)" /></div>
            <p style={{ color: 'var(--muted)' }}>ไม่พบข้อมูล กรุณาตรวจสอบปีการศึกษา</p>
        </div>
    )

    const payColors: Record<string, string> = { paid: 'var(--leaf)', pending: 'var(--sun)', overdue: 'var(--coral)' }
    const payLabels: Record<string, string> = { paid: 'ชำระแล้ว', pending: 'รอชำระ', overdue: 'เกินกำหนด' }

    return (
        <div className="space-y-5 animate-fade-up">
            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="px-3 py-1.5 rounded-lg text-sm input-field">
                    {thaiMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="w-24 px-3 py-1.5 rounded-lg text-sm input-field" />
                <div className="ml-auto flex gap-2">
                    <button onClick={() => handleExport('csv')} disabled={!!exporting} className="px-4 py-2 rounded-xl text-sm font-semibold btn-secondary disabled:opacity-50">
                        {exporting === 'csv' ? '...' : 'CSV'}
                    </button>
                    <button onClick={() => handleExport('pdf')} disabled={!!exporting} className="px-4 py-2 rounded-xl text-sm font-semibold btn-primary disabled:opacity-50">
                        {exporting === 'pdf' ? '...' : 'PDF'}
                    </button>
                </div>
            </div>

            {/* Center header */}
            <div className="card rounded-2xl p-5" style={{ background: 'var(--forest)', border: 'none' }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(1 0 0 / 0.08)' }}>
                        <Leaf size={24} color="var(--sage)" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">{data.centerName}</h2>
                        <p className="text-sm" style={{ color: 'var(--mint)' }}>{data.location}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'oklch(1 0 0 / 0.4)' }}>
                            {thaiMonths[selectedMonth - 1]} {selectedYear} · {data.academicYear}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats strip */}
            <div className="card rounded-2xl p-4 flex items-center gap-6 flex-wrap">
                {[
                    { label: 'เด็กทั้งหมด', value: data.totalChildren, sub: `ชาย ${data.maleCount} · หญิง ${data.femaleCount}`, color: 'var(--text)' },
                    { label: 'อยู่ศูนย์วันนี้', value: data.presentToday, color: 'var(--leaf)' },
                    { label: 'เฉลี่ยเข้าเรียน', value: `${data.avgAttendance}%`, color: 'var(--sun)' },
                    { label: 'รายรับเดือนนี้', value: `฿${data.totalRevenue.toLocaleString()}`, color: 'var(--sky)' },
                ].map(s => (
                    <div key={s.label}>
                        <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.label}</p>
                        {'sub' in s && s.sub && <p className="text-[10px]" style={{ color: 'var(--sand)' }}>{s.sub}</p>}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Attendance chart */}
                <div className="card rounded-2xl p-5">
                    <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>อัตราการเข้าเรียนรายเดือน</h3>
                    <div className="flex items-end gap-2 h-36">
                        {data.monthlyAttendance.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold" style={{ color: 'var(--leaf)' }}>{m.rate}%</span>
                                <div
                                    className="w-full rounded-t-lg"
                                    style={{
                                        height: `${Math.max(m.rate, 5)}%`,
                                        background: i === data.monthlyAttendance.length - 1 ? 'var(--leaf)' : 'var(--mint)',
                                        opacity: 0.6 + (i / data.monthlyAttendance.length) * 0.4,
                                        transition: 'height 0.6s var(--ease-out-expo)',
                                    }}
                                />
                                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{m.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment summary */}
                <div className="card rounded-2xl p-5">
                    <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>สรุปการชำระเงิน</h3>
                    <div className="space-y-3">
                        {data.paymentSummary.map(ps => {
                            const pct = data.totalChildren ? Math.round(ps.count / data.totalChildren * 100) : 0
                            const color = payColors[ps.status] ?? 'var(--muted)'
                            return (
                                <div key={ps.status}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{payLabels[ps.status] ?? ps.status}</span>
                                        <span className="text-sm font-bold" style={{ color }}>{ps.count} คน · ฿{ps.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="rounded-full overflow-hidden h-1.5" style={{ background: 'var(--warm)' }}>
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: 'width 0.7s var(--ease-out-expo)' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Children table */}
            <div className="card rounded-2xl overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--warm)', background: 'var(--cream)' }}>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                        ทะเบียนเด็ก ({data.childrenList.length} คน)
                    </h3>
                    <div className="flex gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                        <span>ชาย {data.maleCount}</span>
                        <span>หญิง {data.femaleCount}</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--warm)' }}>
                                {['รหัส', 'ชื่อ', 'อายุ', 'ผู้ปกครอง', 'เบอร์', 'เข้าเรียน', 'โรค'].map(h => (
                                    <th key={h} className="text-left text-xs font-semibold px-4 py-2.5" style={{ color: 'var(--muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.childrenList.map((c, i) => (
                                <tr key={i} className="table-row" style={{ borderBottom: '1px solid var(--warm)' }}>
                                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: 'var(--muted)' }}>{c.code}</td>
                                    <td className="px-4 py-2.5">
                                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{c.nickname}</p>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.name}</p>
                                    </td>
                                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--text)' }}>{c.age}</td>
                                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--text)' }}>{c.parent}</td>
                                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--text)' }}>{c.phone}</td>
                                    <td className="px-4 py-2.5">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                            style={c.attendanceRate >= 80
                                                ? { background: 'oklch(0.93 0.04 160)', color: 'var(--leaf)' }
                                                : c.attendanceRate >= 60
                                                    ? { background: 'oklch(0.95 0.04 70)', color: 'var(--sun)' }
                                                    : { background: 'oklch(0.95 0.04 25)', color: 'var(--coral)' }
                                            }
                                        >{c.attendanceRate}%</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-sm" style={{ color: c.disease ? 'var(--coral)' : 'var(--muted)' }}>
                                        {c.disease ?? '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}