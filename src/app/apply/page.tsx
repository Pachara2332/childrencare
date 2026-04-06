'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Baby, CheckCircle2, ClipboardCheck, Clock3, FilePlus2, HeartHandshake, Loader2, School, Send } from 'lucide-react'

interface ClassLevel {
  id: number
  code: string
  name: string
  color: string
  minAgeMonths: number
  maxAgeMonths: number
  order: number
}

interface AcademicYear {
  id: number
  year: string
  name: string
  isActive: boolean
  classLevels: ClassLevel[]
}

interface FormState {
  academicYearId: string
  levelId: string
  firstName: string
  lastName: string
  nickname: string
  gender: 'male' | 'female'
  dateOfBirth: string
  bloodType: '' | 'A' | 'B' | 'AB' | 'O'
  disease: string
  allergy: string
  parentName: string
  parentPhone: string
  parentPhone2: string
  parentRelation: 'mother' | 'father' | 'guardian'
  address: string
  note: string
}

const initialForm: FormState = {
  academicYearId: '',
  levelId: '',
  firstName: '',
  lastName: '',
  nickname: '',
  gender: 'male',
  dateOfBirth: '',
  bloodType: '',
  disease: '',
  allergy: '',
  parentName: '',
  parentPhone: '',
  parentPhone2: '',
  parentRelation: 'mother',
  address: '',
  note: '',
}

function calcAge(dateOfBirth: string) {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (now.getDate() < birth.getDate()) {
    months = Math.max(0, months - 1)
  }
  return {
    text: `${years} ปี ${months} เดือน`,
    months: years * 12 + months,
  }
}

function inputClassName() {
  return 'input-field w-full rounded-2xl px-4 py-3 text-sm'
}

export default function ApplyPage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ referenceNo: string } | null>(null)

  useEffect(() => {
    const loadYears = async () => {
      try {
        const response = await fetch('/api/academic-years')
        const data: AcademicYear[] = await response.json()
        setYears(data)
        const activeYear = data.find((year) => year.isActive) ?? data[0]
        if (activeYear) {
          setForm((current) => ({
            ...current,
            academicYearId: String(activeYear.id),
            levelId: current.levelId || String(activeYear.classLevels[0]?.id ?? ''),
          }))
        }
      } catch {
        setError('ไม่สามารถโหลดข้อมูลปีการศึกษาได้')
      } finally {
        setLoading(false)
      }
    }

    loadYears()
  }, [])

  const selectedYear = useMemo(
    () => years.find((year) => String(year.id) === form.academicYearId) ?? null,
    [years, form.academicYearId]
  )

  const levels = useMemo(() => selectedYear?.classLevels ?? [], [selectedYear])
  const age = calcAge(form.dateOfBirth)

  const recommendedLevel = useMemo(() => {
    if (!age) return null
    return levels.find(
      (level) => age.months >= level.minAgeMonths && age.months <= level.maxAgeMonths
    )
  }, [age, levels])

  useEffect(() => {
    if (!selectedYear) return
    const hasLevel = selectedYear.classLevels.some((level) => String(level.id) === form.levelId)
    if (!hasLevel) {
      setForm((current) => ({
        ...current,
        levelId: String(recommendedLevel?.id ?? selectedYear.classLevels[0]?.id ?? ''),
      }))
    }
  }, [form.levelId, recommendedLevel, selectedYear])

  const setField =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) => {
      setForm((current) => ({ ...current, [key]: value }))
      setError('')
    }

  const submitForm = async () => {
    setError('')
    setSuccess(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          academicYearId: Number(form.academicYearId),
          levelId: Number(form.levelId),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message ?? 'ไม่สามารถส่งใบสมัครได้')
        return
      }

      setSuccess({ referenceNo: data.referenceNo })
      setForm((current) => ({
        ...initialForm,
        academicYearId: current.academicYearId,
        levelId: current.levelId,
      }))
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  const isSubmitDisabled =
    submitting ||
    !form.academicYearId ||
    !form.levelId ||
    !form.firstName ||
    !form.lastName ||
    !form.nickname ||
    !form.dateOfBirth ||
    !form.parentName ||
    !form.parentPhone

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle at top left, oklch(0.97 0.04 150), transparent 32%), linear-gradient(180deg, oklch(0.98 0.012 84), var(--cream))',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            style={{ background: 'white', color: 'var(--text)', border: '1px solid var(--warm)' }}
          >
            <ArrowLeft size={16} />
            กลับหน้าเข้าสู่ระบบ
          </Link>
          <div
            className="rounded-full px-4 py-2 text-xs font-semibold"
            style={{ background: 'oklch(0.95 0.03 160)', color: 'var(--leaf)' }}
          >
            สมัครเรียนออนไลน์
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section
            className="overflow-hidden rounded-[2rem] p-6 sm:p-8"
            style={{
              background: 'var(--forest)',
              boxShadow: '0 20px 50px oklch(0.22 0.03 160 / 0.18)',
            }}
          >
            <div className="max-w-xl">
              <div
                className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'oklch(1 0 0 / 0.1)' }}
              >
                <School size={28} color="white" />
              </div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
                Childcare Admission
              </p>
              <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                เปิดรับสมัครเด็กเข้าเรียนผ่านระบบออนไลน์
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/76 sm:text-base">
                ผู้ปกครองกรอกข้อมูลเบื้องต้นได้ด้วยตนเอง จากนั้นเจ้าหน้าที่จะตรวจสอบใบสมัครและติดต่อกลับเพื่อยืนยันการเข้าเรียน
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: FilePlus2,
                  title: 'กรอกใบสมัคร',
                  detail: 'ข้อมูลเด็กและผู้ปกครองในครั้งเดียว',
                },
                {
                  icon: ClipboardCheck,
                  title: 'รอตรวจสอบ',
                  detail: 'เจ้าหน้าที่ตรวจทานข้อมูลและชั้นเรียน',
                },
                {
                  icon: HeartHandshake,
                  title: 'ยืนยันเข้าเรียน',
                  detail: 'อนุมัติแล้วจึงสร้างทะเบียนนักเรียนจริง',
                },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className={`rounded-3xl p-4 animate-fade-up delay-${index + 1}`}
                    style={{
                      background: 'oklch(1 0 0 / 0.08)',
                      border: '1px solid oklch(1 0 0 / 0.08)',
                    }}
                  >
                    <Icon size={20} color="white" />
                    <p className="mt-3 text-sm font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-6 text-white/72">{item.detail}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section
            className="rounded-[2rem] p-6 sm:p-8"
            style={{
              background: 'white',
              border: '1px solid var(--warm)',
              boxShadow: '0 18px 42px oklch(0.22 0.03 160 / 0.08)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--sage)' }}>
                  ขั้นตอนเร็ว
                </p>
                <h2 className="mt-2 text-2xl font-bold" style={{ color: 'var(--text)' }}>
                  ยื่นใบสมัคร
                </h2>
              </div>
              <div
                className="rounded-2xl px-4 py-3 text-right"
                style={{ background: 'var(--cream)' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                  สถานะ
                </p>
                <p className="mt-1 text-sm font-bold" style={{ color: 'var(--leaf)' }}>
                  ส่งออนไลน์ทันที
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                'เลือกปีการศึกษาและระดับชั้นที่ต้องการสมัคร',
                'กรอกข้อมูลเด็กและผู้ปกครองให้ครบถ้วน',
                'รับเลขอ้างอิงสำหรับติดตามผล',
              ].map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-2xl p-3" style={{ background: 'var(--cream)' }}>
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: 'white', color: 'var(--leaf)', border: '1px solid var(--warm)' }}
                  >
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-6" style={{ color: 'var(--text)' }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="mt-6 flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                <Loader2 size={16} className="animate-spin" />
                กำลังโหลดข้อมูลปีการศึกษา...
              </div>
            ) : (
              <div className="mt-6 rounded-3xl p-5" style={{ background: 'oklch(0.98 0.018 85)' }}>
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  <Clock3 size={16} />
                  คำแนะนำก่อนสมัคร
                </div>
                <p className="mt-2 text-sm leading-7" style={{ color: 'var(--muted)' }}>
                  เตรียมวันเกิดของเด็ก เบอร์โทรผู้ปกครอง และเลือกชั้นเรียนให้ตรงกับช่วงอายุ หากไม่แน่ใจระบบจะแนะนำระดับชั้นให้โดยอัตโนมัติ
                </p>
              </div>
            )}
          </section>
        </div>

        <section
          className="mt-6 rounded-[2rem] p-6 sm:p-8"
          style={{
            background: 'white',
            border: '1px solid var(--warm)',
            boxShadow: '0 18px 42px oklch(0.22 0.03 160 / 0.06)',
          }}
        >
          {success && (
            <div
              className="mb-6 rounded-[1.5rem] p-5"
              style={{ background: 'oklch(0.95 0.04 150)', border: '1px solid oklch(0.9 0.04 150)' }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--leaf)' }}>
                    <CheckCircle2 size={18} />
                    ส่งใบสมัครเรียบร้อยแล้ว
                  </p>
                  <p className="mt-2 text-sm leading-7" style={{ color: 'var(--text)' }}>
                    เลขอ้างอิงของคุณคือ <span className="font-bold">{success.referenceNo}</span>
                    {' '}กรุณาเก็บไว้สำหรับติดตามผล
                  </p>
                </div>
                <div
                  className="rounded-2xl px-4 py-3 text-sm font-semibold"
                  style={{ background: 'white', color: 'var(--leaf)', border: '1px solid oklch(0.9 0.04 150)' }}
                >
                  รอเจ้าหน้าที่ตรวจสอบ
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              className="mb-6 rounded-2xl px-4 py-3 text-sm"
              style={{ background: '#FFF0ED', color: 'var(--coral)', border: '1px solid #F6C2B2' }}
            >
              {error}
            </div>
          )}

          <div className="grid gap-8 xl:grid-cols-[1fr_0.42fr]">
            <div className="space-y-8">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ background: 'var(--cream)', color: 'var(--leaf)' }}
                  >
                    <School size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                      ข้อมูลการสมัคร
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      เลือกปีการศึกษาและชั้นเรียนที่ต้องการสมัคร
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      ปีการศึกษา
                    </span>
                    <select
                      value={form.academicYearId}
                      onChange={(event) => setField('academicYearId')(event.target.value)}
                      className={inputClassName()}
                    >
                      <option value="">เลือกปีการศึกษา</option>
                      {years.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.name} {year.isActive ? '(ปัจจุบัน)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      ระดับชั้น
                    </span>
                    <select
                      value={form.levelId}
                      onChange={(event) => setField('levelId')(event.target.value)}
                      className={inputClassName()}
                    >
                      <option value="">เลือกระดับชั้น</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name} ({level.code})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ background: 'var(--cream)', color: 'var(--leaf)' }}
                  >
                    <Baby size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                      ข้อมูลเด็ก
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      ชื่อ วันเกิด และข้อมูลสุขภาพเบื้องต้น
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      ชื่อจริง
                    </span>
                    <input
                      value={form.firstName}
                      onChange={(event) => setField('firstName')(event.target.value)}
                      className={inputClassName()}
                      placeholder="ชื่อจริง"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      นามสกุล
                    </span>
                    <input
                      value={form.lastName}
                      onChange={(event) => setField('lastName')(event.target.value)}
                      className={inputClassName()}
                      placeholder="นามสกุล"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      ชื่อเล่น
                    </span>
                    <input
                      value={form.nickname}
                      onChange={(event) => setField('nickname')(event.target.value)}
                      className={inputClassName()}
                      placeholder="ชื่อเล่น"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      เพศ
                    </span>
                    <select
                      value={form.gender}
                      onChange={(event) => setField('gender')(event.target.value as FormState['gender'])}
                      className={inputClassName()}
                    >
                      <option value="male">ชาย</option>
                      <option value="female">หญิง</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      วันเกิด
                    </span>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(event) => setField('dateOfBirth')(event.target.value)}
                      className={inputClassName()}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      กรุ๊ปเลือด
                    </span>
                    <select
                      value={form.bloodType}
                      onChange={(event) => setField('bloodType')(event.target.value as FormState['bloodType'])}
                      className={inputClassName()}
                    >
                      <option value="">ไม่ระบุ</option>
                      {['A', 'B', 'AB', 'O'].map((bloodType) => (
                        <option key={bloodType} value={bloodType}>
                          {bloodType}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      โรคประจำตัว
                    </span>
                    <input
                      value={form.disease}
                      onChange={(event) => setField('disease')(event.target.value)}
                      className={inputClassName()}
                      placeholder="ถ้าไม่มีเว้นว่าง"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      แพ้อาหารหรือยา
                    </span>
                    <input
                      value={form.allergy}
                      onChange={(event) => setField('allergy')(event.target.value)}
                      className={inputClassName()}
                      placeholder="ถ้าไม่มีเว้นว่าง"
                    />
                  </label>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ background: 'var(--cream)', color: 'var(--leaf)' }}
                  >
                    <HeartHandshake size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                      ข้อมูลผู้ปกครอง
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      ใช้สำหรับติดต่อกลับและยืนยันสิทธิ์เข้าเรียน
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      ชื่อผู้ปกครอง
                    </span>
                    <input
                      value={form.parentName}
                      onChange={(event) => setField('parentName')(event.target.value)}
                      className={inputClassName()}
                      placeholder="ชื่อ-นามสกุล"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      ความสัมพันธ์
                    </span>
                    <select
                      value={form.parentRelation}
                      onChange={(event) =>
                        setField('parentRelation')(event.target.value as FormState['parentRelation'])
                      }
                      className={inputClassName()}
                    >
                      <option value="mother">แม่</option>
                      <option value="father">พ่อ</option>
                      <option value="guardian">ผู้ปกครอง</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      เบอร์โทรหลัก
                    </span>
                    <input
                      value={form.parentPhone}
                      onChange={(event) => setField('parentPhone')(event.target.value)}
                      className={inputClassName()}
                      placeholder="08x-xxx-xxxx"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      เบอร์โทรสำรอง
                    </span>
                    <input
                      value={form.parentPhone2}
                      onChange={(event) => setField('parentPhone2')(event.target.value)}
                      className={inputClassName()}
                      placeholder="ถ้ามี"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      ที่อยู่
                    </span>
                    <textarea
                      rows={3}
                      value={form.address}
                      onChange={(event) => setField('address')(event.target.value)}
                      className={inputClassName()}
                      style={{ resize: 'vertical' }}
                      placeholder="บ้านเลขที่ หมู่ ถนน ตำบล อำเภอ จังหวัด"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      หมายเหตุเพิ่มเติม
                    </span>
                    <textarea
                      rows={3}
                      value={form.note}
                      onChange={(event) => setField('note')(event.target.value)}
                      className={inputClassName()}
                      style={{ resize: 'vertical' }}
                      placeholder="เช่น ต้องการให้ติดต่อช่วงเวลาใด หรือข้อมูลสำคัญเพิ่มเติม"
                    />
                  </label>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[1.75rem] p-5" style={{ background: 'var(--cream)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                  สรุปก่อนส่ง
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      ปีการศึกษา
                    </p>
                    <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text)' }}>
                      {selectedYear?.name ?? 'ยังไม่ได้เลือก'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      ระดับชั้น
                    </p>
                    <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text)' }}>
                      {levels.find((level) => String(level.id) === form.levelId)?.name ?? 'ยังไม่ได้เลือก'}
                    </p>
                    {recommendedLevel && (
                      <p className="mt-2 text-xs" style={{ color: 'var(--leaf)' }}>
                        ระบบแนะนำ: {recommendedLevel.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      อายุปัจจุบัน
                    </p>
                    <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text)' }}>
                      {age?.text ?? 'กรุณาเลือกวันเกิด'}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-[1.75rem] p-5"
                style={{ background: 'white', border: '1px solid var(--warm)' }}
              >
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  หลังส่งใบสมัครแล้ว
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    'ระบบจะออกเลขอ้างอิงให้ทันที',
                    'เจ้าหน้าที่ตรวจสอบข้อมูลและชั้นเรียน',
                    'หากอนุมัติ ระบบจะสร้างทะเบียนนักเรียนให้โดยอัตโนมัติ',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm">
                      <span
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: 'var(--sage)' }}
                      />
                      <span style={{ color: 'var(--muted)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={submitForm}
                disabled={isSubmitDisabled}
                className="flex w-full items-center justify-center gap-2 rounded-[1.35rem] px-5 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  background: 'linear-gradient(135deg, var(--leaf), var(--sage))',
                  boxShadow: '0 14px 26px oklch(0.42 0.1 160 / 0.22)',
                }}
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                ส่งใบสมัครออนไลน์
              </button>
            </aside>
          </div>
        </section>
      </div>
    </div>
  )
}
