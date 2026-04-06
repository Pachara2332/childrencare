'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from '@/app/components/ui/Skeleton'
import { Download, FileText, Inbox, Users } from 'lucide-react'
import {
  EnrollmentStatus,
  ENROLLMENT_STATUSES,
  enrollmentStatusLabels,
  normalizeEnrollmentStatus,
  getEnrollmentStatusTone,
} from '@/lib/enrollmentStatus'

interface ReportData {
  centerName: string
  location: string
  academicYear: string
  totalChildren: number
  maleCount: number
  femaleCount: number
  avgAttendance: number
  presentToday: number
  selectedStatus: EnrollmentStatus | 'all'
  statusSummary: Record<EnrollmentStatus, number>
  childrenList: {
    code: string
    name: string
    nickname: string
    age: string
    parent: string
    phone: string
    attendanceRate: number
    disease: string | null
    status: EnrollmentStatus
    statusLabel: string
    levelName: string
    levelCode: string
    statusDate: string | null
    statusReason: string | null
  }[]
}

const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const now = new Date()

function formatStatusDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedStatus, setSelectedStatus] = useState<EnrollmentStatus | 'all'>('active')
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/reports?month=${selectedMonth}&year=${selectedYear}&status=${selectedStatus}`
        )
        const report = await response.json()
        setData(response.ok ? report : null)
      } finally {
        setLoading(false)
      }
    }

    void fetchReport()
  }, [selectedMonth, selectedYear, selectedStatus])

  const handleExport = async (type: 'pdf' | 'csv') => {
    setExporting(type)
    const res = await fetch(
      `/api/reports/export?month=${selectedMonth}&year=${selectedYear}&status=${selectedStatus}&type=${type}`
    )
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `student-report-${selectedStatus}-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.${type === 'pdf' ? 'html' : 'csv'}`
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(null)
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-up">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Skeleton className="h-28 w-full rounded-3xl" />
        <div className="grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card flex flex-col items-center rounded-2xl py-20 text-center">
        <div className="mb-3">
          <Inbox size={32} color="var(--muted)" />
        </div>
        <p style={{ color: 'var(--muted)' }}>ไม่พบข้อมูล กรุณาตรวจสอบปีการศึกษา</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="input-field rounded-xl px-3 py-2 text-sm"
        >
          {thaiMonths.map((month, index) => (
            <option key={month} value={index + 1}>
              {month}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="input-field w-28 rounded-xl px-3 py-2 text-sm"
        />
        <select
          value={selectedStatus}
          onChange={(e) =>
            setSelectedStatus(normalizeEnrollmentStatus(e.target.value))
          }
          className="input-field rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">ทุกสถานะ</option>
          {ENROLLMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {enrollmentStatusLabels[status]}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            <Download size={14} />
            {exporting === 'csv' ? '...' : 'CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            <FileText size={14} />
            {exporting === 'pdf' ? '...' : 'PDF'}
          </button>
        </div>
      </div>

      <div className="card rounded-3xl p-6" style={{ background: 'var(--forest)', border: 'none' }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--mint)' }}>
              Student Lifecycle Report
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">{data.centerName}</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--mint)' }}>
              {data.location}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'oklch(1 0 0 / 0.62)' }}>
              {thaiMonths[selectedMonth - 1]} {selectedYear} • ปีการศึกษา {data.academicYear}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            style={{ background: 'oklch(1 0 0 / 0.12)', color: 'white' }}
          >
            <Users size={16} />
            {selectedStatus === 'all' ? 'ทุกสถานะ' : enrollmentStatusLabels[selectedStatus]}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'กำลังเรียน', value: data.statusSummary.active, tone: getEnrollmentStatusTone('active') },
          { label: 'ย้ายออก', value: data.statusSummary.leave, tone: getEnrollmentStatusTone('leave') },
          { label: 'จบการศึกษา', value: data.statusSummary.graduated, tone: getEnrollmentStatusTone('graduated') },
          { label: 'ตามตัวกรอง', value: data.totalChildren, tone: { bg: 'var(--cream)', text: 'var(--text)' } },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl p-5"
            style={{ background: 'white', border: '1px solid var(--warm)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: item.tone.text }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="card rounded-2xl p-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              {data.maleCount}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              ชาย
            </p>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              {data.femaleCount}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              หญิง
            </p>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--leaf)' }}>
              {data.presentToday}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              มาเรียนวันนี้
            </p>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--sun)' }}>
              {data.avgAttendance}%
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              เข้าเรียนเฉลี่ยเดือนนี้
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden rounded-2xl">
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid var(--warm)', background: 'var(--cream)' }}
        >
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            รายชื่อนักเรียน ({data.childrenList.length} คน)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--warm)' }}>
                {['รหัส', 'ชื่อ', 'ชั้น', 'สถานะ', 'วันที่', 'เหตุผล', 'ผู้ปกครอง', 'เบอร์', 'เข้าเรียน', 'โรค'].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap"
                    style={{ color: 'var(--muted)' }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.childrenList.map((child) => {
                const tone = getEnrollmentStatusTone(child.status)
                return (
                  <tr
                    key={`${child.code}-${child.status}-${child.levelCode}`}
                    className="table-row"
                    style={{ borderBottom: '1px solid var(--warm)' }}
                  >
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--muted)' }}>
                      {child.code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {child.nickname}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {child.name} • {child.age}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>
                      {child.levelName} ({child.levelCode})
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: tone.bg, color: tone.text }}
                      >
                        {child.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>
                      {formatStatusDate(child.statusDate)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>
                      {child.statusReason || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>
                      {child.parent}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>
                      {child.phone}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={
                          child.attendanceRate >= 80
                            ? { background: 'oklch(0.93 0.04 160)', color: 'var(--leaf)' }
                            : child.attendanceRate >= 60
                              ? { background: 'oklch(0.95 0.04 70)', color: 'var(--sun)' }
                              : { background: '#FFF0ED', color: 'var(--coral)' }
                        }
                      >
                        {child.attendanceRate}%
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: child.disease ? 'var(--coral)' : 'var(--muted)' }}
                    >
                      {child.disease ?? '-'}
                    </td>
                  </tr>
                )
              })}
              {data.childrenList.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                    ไม่พบข้อมูลในสถานะที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
