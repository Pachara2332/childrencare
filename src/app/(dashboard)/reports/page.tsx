// app/(dashboard)/reports/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { StatsCardsSkeleton, Skeleton } from '@/app/components/ui/Skeleton'

interface ReportData {
    centerName: string
    location: string
    academicYear: string
    totalChildren: number
    maleCount: number
    femaleCount: number
    teacherCount: number
    avgAttendance: number
    presentToday: number
    totalRevenue: number
    pendingRevenue: number
    monthlyAttendance: { month: string; rate: number; count: number }[]
    paymentSummary: { status: string; count: number; amount: number }[]
    childrenList: {
        code: string; name: string; nickname: string
        age: string; parent: string; phone: string
        attendanceRate: number; disease: string | null
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
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false) })
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
                <div className="ml-auto flex gap-2">
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <StatsCardsSkeleton cols={4} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                    <Skeleton className="h-4 w-40 mb-4" />
                    <Skeleton className="h-36 w-full" />
                </div>
                <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                    <Skeleton className="h-4 w-40 mb-4" />
                    <Skeleton className="h-36 w-full" />
                </div>
            </div>
        </div>
    )

    if (!data) return (
        <div className="text-center py-20">
            <p className="text-4xl mb-3">📭</p>
            <p style={{ color: 'var(--muted)' }}>ไม่พบข้อมูล กรุณาตรวจสอบปีการศึกษา</p>
        </div>
    )

    return (
        <div className="space-y-5 animate-fade-up">
            {/* Controls */}
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

                <div className="ml-auto flex gap-2">
                    <button
                        onClick={() => handleExport('csv')}
                        disabled={!!exporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: '#E8F5EE', color: 'var(--leaf)', border: '1px solid var(--sage)' }}
                    >
                        {exporting === 'csv' ? '⏳' : '📊'} Export CSV
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={!!exporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                        style={{ background: 'var(--leaf)' }}
                    >
                        {exporting === 'pdf' ? '⏳' : '📄'} Export PDF
                    </button>
                </div>
            </div>

            {/* Center info header */}
            <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--forest)', color: 'white' }}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                        🌱
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{data.centerName}</h2>
                        <p style={{ color: 'var(--mint)' }} className="text-sm">{data.location}</p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            รายงานประจำเดือน {thaiMonths[selectedMonth - 1]} {selectedYear} · {data.academicYear}
                        </p>
                    </div>
                </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'เด็กทั้งหมด', value: data.totalChildren, icon: '👶', bg: '#D8F3DC', color: '#1B4332' },
                    { label: 'อยู่ที่ศูนย์วันนี้', value: data.presentToday, icon: '✅', bg: '#EFF4FF', color: 'var(--sky)' },
                    { label: 'เฉลี่ยเข้าเรียน', value: `${data.avgAttendance}%`, icon: '📊', bg: '#FFF8E8', color: 'var(--sun)' },
                    { label: 'รายรับเดือนนี้', value: `฿${data.totalRevenue.toLocaleString()}`, icon: '💰', bg: '#F0FFF4', color: 'var(--leaf)' },
                ].map(s => (
                    <div key={s.label} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: s.bg }}>{s.icon}</div>
                        <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Attendance chart */}
                <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>📈 อัตราการเข้าเรียนรายเดือน</h3>
                    <div className="flex items-end gap-2 h-36">
                        {data.monthlyAttendance.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-xs font-bold" style={{ color: 'var(--leaf)' }}>{m.rate}%</span>
                                <div
                                    className="w-full rounded-t-lg"
                                    style={{
                                        height: `${Math.max(m.rate, 5)}%`,
                                        background: i === data.monthlyAttendance.length - 1 ? 'var(--leaf)' : 'var(--mint)',
                                        opacity: 0.6 + (i / data.monthlyAttendance.length) * 0.4,
                                        transition: 'height 0.5s ease',
                                    }}
                                />
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>{m.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment summary */}
                <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>💳 สรุปการชำระเงิน</h3>
                    <div className="space-y-3">
                        {data.paymentSummary.map(ps => {
                            const pct = data.totalChildren ? Math.round(ps.count / data.totalChildren * 100) : 0
                            const colors: Record<string, { bg: string; color: string }> = {
                                paid: { bg: '#D8F3DC', color: '#1B4332' },
                                pending: { bg: '#FFF8E8', color: '#7D4E00' },
                                overdue: { bg: '#FFF0ED', color: '#9B1C1C' },
                            }
                            const c = colors[ps.status] ?? { bg: 'var(--cream)', color: 'var(--muted)' }
                            const labels: Record<string, string> = { paid: 'ชำระแล้ว', pending: 'รอชำระ', overdue: 'เกินกำหนด' }
                            return (
                                <div key={ps.status}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{labels[ps.status] ?? ps.status}</span>
                                        <span className="text-sm font-bold" style={{ color: c.color }}>
                                            {ps.count} คน · ฿{ps.amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="rounded-full overflow-hidden h-2" style={{ background: 'var(--warm)' }}>
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${pct}%`, background: c.color, transition: 'width 0.7s ease' }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Children table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: 'var(--cream)', borderBottom: '1px solid var(--warm)' }}>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                        📋 ทะเบียนเด็กทั้งหมด ({data.childrenList.length} คน)
                    </h3>
                    <div className="flex gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                        <span>👦 ชาย {data.maleCount} คน</span>
                        <span>👧 หญิง {data.femaleCount} คน</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--warm)' }}>
                                {['รหัส', 'ชื่อ-ชื่อเล่น', 'อายุ', 'ผู้ปกครอง', 'เบอร์', 'เข้าเรียน', 'โรคประจำตัว'].map(h => (
                                    <th key={h} className="text-left text-xs font-bold px-4 py-3" style={{ color: 'var(--muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.childrenList.map((c, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--warm)' }}>
                                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--muted)' }}>{c.code}</td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.nickname}</p>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.name}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>{c.age}</td>
                                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>{c.parent}</td>
                                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>{c.phone}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                                            style={c.attendanceRate >= 80
                                                ? { background: '#D8F3DC', color: '#1B4332' }
                                                : c.attendanceRate >= 60
                                                    ? { background: '#FFF8E8', color: '#7D4E00' }
                                                    : { background: '#FFF0ED', color: '#9B1C1C' }
                                            }
                                        >
                                            {c.attendanceRate}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm" style={{ color: c.disease ? 'var(--coral)' : 'var(--muted)' }}>
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