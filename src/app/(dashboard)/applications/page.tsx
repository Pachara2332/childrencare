'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSearch,
  Loader2,
  RefreshCw,
  Search,
  SendToBack,
  UserRoundPlus,
  XCircle,
} from 'lucide-react'

interface ClassLevel {
  id: number
  code: string
  name: string
  color: string
}

interface AcademicYear {
  id: number
  name: string
  year: string
  isActive: boolean
  classLevels: ClassLevel[]
}

interface EnrollmentApplication {
  id: number
  referenceNo: string
  status: 'pending' | 'approved' | 'rejected'
  firstName: string
  lastName: string
  nickname: string
  gender: string
  dateOfBirth: string
  bloodType: string | null
  disease: string | null
  allergy: string | null
  parentName: string
  parentPhone: string
  parentPhone2: string | null
  parentRelation: string
  address: string | null
  note: string | null
  reviewNote: string | null
  reviewedAt: string | null
  approvedChildId: number | null
  createdAt: string
  academicYear: {
    id: number
    name: string
    year: string
    isActive: boolean
  }
  level: ClassLevel
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function ageText(dateOfBirth: string) {
  const birth = new Date(dateOfBirth)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) {
    years -= 1
    months += 12
  }
  return `${years} ปี ${months} เดือน`
}

function statusLabel(status: FilterStatus | EnrollmentApplication['status']) {
  switch (status) {
    case 'approved':
      return 'อนุมัติแล้ว'
    case 'rejected':
      return 'ปฏิเสธแล้ว'
    case 'pending':
      return 'รอตรวจสอบ'
    default:
      return 'ทั้งหมด'
  }
}

function statusStyles(status: EnrollmentApplication['status']) {
  switch (status) {
    case 'approved':
      return {
        background: 'oklch(0.95 0.04 150)',
        color: 'var(--leaf)',
      }
    case 'rejected':
      return {
        background: '#FFF0ED',
        color: 'var(--coral)',
      }
    default:
      return {
        background: 'oklch(0.96 0.02 90)',
        color: 'oklch(0.42 0.08 90)',
      }
  }
}

export default function ApplicationsPage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending')
  const [search, setSearch] = useState('')
  const [applications, setApplications] = useState<EnrollmentApplication[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const loadYears = useCallback(async () => {
    try {
      const response = await fetch('/api/academic-years')
      const data: AcademicYear[] = await response.json()
      setYears(data)
      const activeYear = data.find((year) => year.isActive) ?? data[0]
      if (activeYear) {
        setSelectedYearId((current) => (current === 'all' ? String(activeYear.id) : current))
      }
    } catch {
      setMessage({ text: 'ไม่สามารถโหลดข้อมูลปีการศึกษาได้', ok: false })
    }
  }, [])

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setMessage(null)

    try {
      const params = new URLSearchParams()
      if (selectedYearId !== 'all') params.set('yearId', selectedYearId)

      const response = await fetch(`/api/applications?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message ?? 'ไม่สามารถโหลดใบสมัครได้')
      }

      setApplications(data)
      setSelectedId((current) => current ?? data[0]?.id ?? null)
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'ไม่สามารถโหลดใบสมัครได้',
        ok: false,
      })
      setApplications([])
      setSelectedId(null)
    } finally {
      setLoading(false)
    }
  }, [selectedYearId])

  useEffect(() => {
    loadYears()
  }, [loadYears])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase()
    return applications
      .filter((application) => statusFilter === 'all' || application.status === statusFilter)
      .filter((application) =>
      [
        application.referenceNo,
        application.nickname,
        application.firstName,
        application.lastName,
        application.parentName,
        application.parentPhone,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    )
  }, [applications, search, statusFilter])

  useEffect(() => {
    if (!filteredApplications.some((application) => application.id === selectedId)) {
      setSelectedId(filteredApplications[0]?.id ?? null)
    }
  }, [filteredApplications, selectedId])

  const selectedApplication = useMemo(
    () => filteredApplications.find((application) => application.id === selectedId) ?? null,
    [filteredApplications, selectedId]
  )

  useEffect(() => {
    setReviewNote(selectedApplication?.reviewNote ?? '')
  }, [selectedApplication?.id, selectedApplication?.reviewNote])

  const counters = useMemo(
    () =>
      applications.reduce(
        (totals, application) => {
          totals[application.status] += 1
          return totals
        },
        { pending: 0, approved: 0, rejected: 0 }
      ),
    [applications]
  )

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedApplication) return
    setActing(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewNote }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message ?? 'ไม่สามารถอัปเดตใบสมัครได้')
      }

      setMessage({
        text: data.message,
        ok: true,
      })
      await loadApplications()
      setSelectedId(selectedApplication.id)
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'ไม่สามารถอัปเดตใบสมัครได้',
        ok: false,
      })
    } finally {
      setActing(false)
    }
  }

  const copyApplyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/apply`)
      setMessage({ text: 'คัดลอกลิงก์สมัครเรียนแล้ว', ok: true })
    } catch {
      setMessage({ text: 'ไม่สามารถคัดลอกลิงก์ได้', ok: false })
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            ใบสมัครเข้าเรียนออนไลน์
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            ตรวจสอบใบสมัครที่ผู้ปกครองส่งเข้ามา และอนุมัติเพื่อสร้างทะเบียนนักเรียนจริง
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyApplyLink}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{ background: 'white', color: 'var(--text)', border: '1px solid var(--warm)' }}
          >
            <Copy size={16} />
            คัดลอกลิงก์สมัคร
          </button>
          <Link
            href="/apply"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{ background: 'var(--leaf)', color: 'white' }}
          >
            <ExternalLink size={16} />
            เปิดฟอร์มสาธารณะ
          </Link>
        </div>
      </div>

      {message && (
        <div
          className="rounded-2xl px-4 py-3 text-sm"
          style={{
            background: message.ok ? 'oklch(0.95 0.04 150)' : '#FFF0ED',
            color: message.ok ? 'var(--leaf)' : 'var(--coral)',
            border: `1px solid ${message.ok ? 'oklch(0.9 0.04 150)' : '#F6C2B2'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { key: 'pending', label: 'รอตรวจสอบ', value: counters.pending },
          { key: 'approved', label: 'อนุมัติแล้ว', value: counters.approved },
          { key: 'rejected', label: 'ปฏิเสธแล้ว', value: counters.rejected },
        ].map((item) => (
          <div
            key={item.key}
            className="rounded-3xl p-5"
            style={{ background: 'white', border: '1px solid var(--warm)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--text)' }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.25fr]">
        <section
          className="rounded-[1.75rem] p-5"
          style={{ background: 'white', border: '1px solid var(--warm)' }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted)' }}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหาด้วยชื่อ ผู้ปกครอง หรือเลขอ้างอิง"
                className="input-field w-full rounded-2xl py-3 pl-9 pr-4 text-sm"
              />
            </div>

            <select
              value={selectedYearId}
              onChange={(event) => setSelectedYearId(event.target.value)}
              className="input-field rounded-2xl px-4 py-3 text-sm"
            >
              <option value="all">ทุกปีการศึกษา</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}
              className="input-field rounded-2xl px-4 py-3 text-sm"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธแล้ว</option>
            </select>

            <button
              onClick={loadApplications}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
              style={{ background: 'var(--cream)', color: 'var(--text)' }}
            >
              <RefreshCw size={16} />
              รีเฟรช
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 rounded-2xl p-4 text-sm" style={{ background: 'var(--cream)', color: 'var(--muted)' }}>
                <Loader2 size={16} className="animate-spin" />
                กำลังโหลดใบสมัคร...
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed p-10 text-center" style={{ borderColor: 'var(--warm)' }}>
                <FileSearch size={34} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  ไม่พบใบสมัครตามเงื่อนไขที่เลือก
                </p>
              </div>
            ) : (
              filteredApplications.map((application) => {
                const active = application.id === selectedId
                const tone = statusStyles(application.status)
                return (
                  <button
                    key={application.id}
                    onClick={() => setSelectedId(application.id)}
                    className="w-full rounded-[1.5rem] p-4 text-left transition-all"
                    style={{
                      background: active ? 'var(--forest)' : 'var(--cream)',
                      border: `1px solid ${active ? 'var(--forest)' : 'var(--warm)'}`,
                      boxShadow: active ? '0 12px 28px oklch(0.22 0.03 160 / 0.18)' : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p
                          className="text-lg font-bold"
                          style={{ color: active ? 'white' : 'var(--text)' }}
                        >
                          {application.nickname}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: active ? 'white' : 'var(--muted)' }}
                        >
                          {application.firstName} {application.lastName}
                        </p>
                      </div>
                      <div
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          background: active ? 'oklch(1 0 0 / 0.12)' : tone.background,
                          color: active ? 'white' : tone.color,
                        }}
                      >
                        {statusLabel(application.status)}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      <div style={{ color: active ? 'white' : 'var(--muted)' }}>
                        <span className="font-semibold">เลขอ้างอิง:</span> {application.referenceNo}
                      </div>
                      <div style={{ color: active ? 'white' : 'var(--muted)' }}>
                        <span className="font-semibold">ผู้ปกครอง:</span> {application.parentName}
                      </div>
                      <div style={{ color: active ? 'white' : 'var(--muted)' }}>
                        <span className="font-semibold">ชั้น:</span> {application.level.name}
                      </div>
                      <div style={{ color: active ? 'white' : 'var(--muted)' }}>
                        <span className="font-semibold">ส่งเมื่อ:</span> {formatDate(application.createdAt)}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </section>

        <section
          className="rounded-[1.75rem] p-5"
          style={{ background: 'white', border: '1px solid var(--warm)' }}
        >
          {!selectedApplication ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <SendToBack size={40} className="mb-3" style={{ color: 'var(--muted)' }} />
              <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                เลือกใบสมัครเพื่อดูรายละเอียด
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                      {selectedApplication.firstName} {selectedApplication.lastName}
                    </h3>
                    <div
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={statusStyles(selectedApplication.status)}
                    >
                      {statusLabel(selectedApplication.status)}
                    </div>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                    ชื่อเล่น {selectedApplication.nickname} • เลขอ้างอิง {selectedApplication.referenceNo}
                  </p>
                </div>

                {selectedApplication.approvedChildId && (
                  <Link
                    href={`/children/${selectedApplication.approvedChildId}`}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                    style={{ background: 'var(--cream)', color: 'var(--text)' }}
                  >
                    <UserRoundPlus size={16} />
                    เปิดข้อมูลนักเรียน
                  </Link>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ['ปีการศึกษา', selectedApplication.academicYear.name],
                  ['ระดับชั้น', `${selectedApplication.level.name} (${selectedApplication.level.code})`],
                  ['อายุปัจจุบัน', ageText(selectedApplication.dateOfBirth)],
                  ['ผู้ปกครอง', selectedApplication.parentName],
                  ['เบอร์โทรหลัก', selectedApplication.parentPhone],
                  ['ส่งเมื่อ', formatDate(selectedApplication.createdAt)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl p-4"
                    style={{ background: 'var(--cream)' }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[1.5rem] p-5" style={{ background: 'var(--cream)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    ข้อมูลเด็ก
                  </p>
                  <div className="mt-4 space-y-3 text-sm">
                    <p style={{ color: 'var(--muted)' }}>
                      เพศ: <span style={{ color: 'var(--text)' }}>{selectedApplication.gender === 'male' ? 'ชาย' : 'หญิง'}</span>
                    </p>
                    <p style={{ color: 'var(--muted)' }}>
                      วันเกิด: <span style={{ color: 'var(--text)' }}>{formatDate(selectedApplication.dateOfBirth)}</span>
                    </p>
                    <p style={{ color: 'var(--muted)' }}>
                      กรุ๊ปเลือด: <span style={{ color: 'var(--text)' }}>{selectedApplication.bloodType ?? '-'}</span>
                    </p>
                    <p style={{ color: 'var(--muted)' }}>
                      โรคประจำตัว: <span style={{ color: 'var(--text)' }}>{selectedApplication.disease || '-'}</span>
                    </p>
                    <p style={{ color: 'var(--muted)' }}>
                      แพ้อาหาร/ยา: <span style={{ color: 'var(--text)' }}>{selectedApplication.allergy || '-'}</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] p-5" style={{ background: 'var(--cream)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    ข้อมูลผู้ปกครอง
                  </p>
                  <div className="mt-4 space-y-3 text-sm">
                    <p style={{ color: 'var(--muted)' }}>
                      ความสัมพันธ์:{' '}
                      <span style={{ color: 'var(--text)' }}>
                        {selectedApplication.parentRelation === 'mother'
                          ? 'แม่'
                          : selectedApplication.parentRelation === 'father'
                            ? 'พ่อ'
                            : 'ผู้ปกครอง'}
                      </span>
                    </p>
                    <p style={{ color: 'var(--muted)' }}>
                      เบอร์สำรอง: <span style={{ color: 'var(--text)' }}>{selectedApplication.parentPhone2 || '-'}</span>
                    </p>
                    <p style={{ color: 'var(--muted)' }}>
                      ที่อยู่: <span style={{ color: 'var(--text)' }}>{selectedApplication.address || '-'}</span>
                    </p>
                    <p style={{ color: 'var(--muted)' }}>
                      หมายเหตุผู้สมัคร: <span style={{ color: 'var(--text)' }}>{selectedApplication.note || '-'}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] p-5" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  ความเห็นผู้ตรวจสอบ
                </p>
                <textarea
                  rows={4}
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  className="input-field mt-4 w-full rounded-2xl px-4 py-3 text-sm"
                  style={{ resize: 'vertical' }}
                  placeholder="บันทึกเหตุผลในการอนุมัติหรือปฏิเสธ"
                  disabled={selectedApplication.status !== 'pending'}
                />

                {selectedApplication.reviewNote && selectedApplication.status !== 'pending' && (
                  <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
                    บันทึกล่าสุด: {selectedApplication.reviewNote}
                  </p>
                )}
                {selectedApplication.reviewedAt && (
                  <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                    ดำเนินการเมื่อ {formatDate(selectedApplication.reviewedAt)}
                  </p>
                )}
              </div>

              {selectedApplication.status === 'pending' ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={acting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: 'var(--leaf)' }}
                  >
                    {acting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    อนุมัติและสร้างทะเบียนนักเรียน
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={acting}
                    className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
                    style={{ background: '#FFF0ED', color: 'var(--coral)', border: '1px solid #F6C2B2' }}
                  >
                    {acting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    ปฏิเสธใบสมัคร
                  </button>
                </div>
              ) : (
                <div
                  className="rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background:
                      selectedApplication.status === 'approved'
                        ? 'oklch(0.95 0.04 150)'
                        : '#FFF0ED',
                    color:
                      selectedApplication.status === 'approved'
                        ? 'var(--leaf)'
                        : 'var(--coral)',
                  }}
                >
                  ใบสมัครนี้ถูก{statusLabel(selectedApplication.status)}แล้ว
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
