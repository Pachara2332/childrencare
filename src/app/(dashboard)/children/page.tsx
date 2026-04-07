// app/(dashboard)/children/page.tsx
'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { Download, School, Search } from 'lucide-react'
import { exportCSV } from '@/lib/exportUtils'
import { EnrollmentStatus, enrollmentStatusLabels } from '@/lib/enrollmentStatus'

import { AcademicYear, Enrollment, MainTab } from './types'
import { calcAge, getLevelColor } from './utils'

// Dynamic imports for heavy components
const ChildGrid = dynamic(() => import('./components/ChildGrid'), {
    loading: () => <p className="text-sm text-gray-400 p-4">กำลังโหลดรายชื่อนักเรียน...</p>
})
const AddChildForm = dynamic(() => import('./components/AddChildForm'))
const ImportJSON = dynamic(() => import('./components/ImportJSON'))
const ManageLevels = dynamic(() => import('./components/ManageLevels'))

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ChildrenPage() {
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
    const [selectedLevelId, setSelectedLevelId] = useState<number | 'all'>('all')
    const [selectedStatus, setSelectedStatus] = useState<EnrollmentStatus | 'all'>('active')
    const [mainTab, setMainTab] = useState<MainTab>('roster')
    const [search, setSearch] = useState('')

    // 1. SWR for Academic Years
    const { data: years = [], mutate: mutateYears } = useSWR<AcademicYear[]>('/api/academic-years', fetcher, {
        onSuccess: (data) => {
            if (!selectedYearId && data.length > 0) {
                const active = data.find(y => y.isActive)
                setSelectedYearId(active ? active.id : data[0].id)
            }
        }
    })

    // 2. SWR for Enrollments (Dependent fetching)
    const { data: enrollments = [], isLoading: loadingEnrollments, mutate: mutateEnrollments } = useSWR<Enrollment[]>(
        selectedYearId ? `/api/enrollments?yearId=${selectedYearId}&status=all` : null,
        fetcher,
        { revalidateOnFocus: false }
    )

    const activeYear = years.find(y => y.id === selectedYearId)
    const levels = activeYear?.classLevels ?? []

    const statusFiltered = useMemo(() => (
        selectedStatus === 'all'
            ? enrollments
            : enrollments.filter(e => e.status === selectedStatus)
    ), [enrollments, selectedStatus])

    const filtered = useMemo(() => statusFiltered.filter(e =>
        (selectedLevelId === 'all' || e.level.id === selectedLevelId) &&
        `${e.child.nickname}${e.child.firstName}${e.child.lastName}${e.child.code}`
            .toLowerCase().includes(search.toLowerCase())
    ), [statusFiltered, selectedLevelId, search])

    const statusCounts = useMemo(() => ({
        active: enrollments.filter(e => e.status === 'active').length,
        leave: enrollments.filter(e => e.status === 'leave').length,
        graduated: enrollments.filter(e => e.status === 'graduated').length,
    }), [enrollments])

    // Count per level
    const levelCounts = useMemo(() => levels.map(l => ({
        ...l,
        count: statusFiltered.filter(e => e.level.id === l.id).length,
    })), [levels, statusFiltered])

    // Lazy load exportPDF
    const handleExportPDF = async () => {
        const { exportPDF } = await import('@/lib/exportUtils')
        const headers = ['รหัส', 'ชื่อเล่น', 'ชื่อ-สกุล', 'อายุ', 'ชั้น', 'สถานะ', 'วันที่', 'เหตุผล', 'ผู้ปกครอง', 'เบอร์โทร']
        const rows = filtered.map(e => [
            e.child.code, e.child.nickname,
            `${e.child.firstName} ${e.child.lastName}`,
            calcAge(e.child.dateOfBirth).text,
            e.level.name,
            enrollmentStatusLabels[e.status as EnrollmentStatus],
            e.statusDate ? new Date(e.statusDate).toLocaleDateString('th-TH') : '-',
            e.statusReason ?? '-',
            e.child.parentName, e.child.parentPhone,
        ])
        exportPDF('ทะเบียนนักเรียน', headers, rows, 'children-roster', [
            { label: 'ปีการศึกษา', value: activeYear?.name ?? '-' },
            { label: 'จำนวน', value: `${filtered.length} คน` },
            { label: 'สถานะ', value: selectedStatus === 'all' ? 'ทุกสถานะ' : enrollmentStatusLabels[selectedStatus] },
        ])
    }

    return (
        <div className="space-y-4 animate-fade-up">

            {/* ── Top bar: ปีการศึกษา ── */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>ปีการศึกษา</span>
                    <select
                        value={selectedYearId ?? ''}
                        onChange={e => { setSelectedYearId(Number(e.target.value)); setSelectedLevelId('all') }}
                        className="text-sm rounded-xl px-3 py-2 font-semibold input-field"
                    >
                        {years.map(y => (
                            <option key={y.id} value={y.id}>
                                {y.name} {y.isActive ? '(ปัจจุบัน)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="md:ml-auto flex flex-wrap gap-2">
                    {(['roster', 'add', 'import', 'manage-levels'] as MainTab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setMainTab(t)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{
                                background: mainTab === t ? 'var(--leaf)' : 'white',
                                color: mainTab === t ? 'white' : 'var(--muted)',
                                border: `1px solid ${mainTab === t ? 'var(--leaf)' : 'var(--warm)'}`,
                                transition: 'all 0.15s var(--ease-out-quart)',
                            }}
                        >
                            {t === 'roster' ? 'ทะเบียนนักเรียน'
                                : t === 'add' ? 'เพิ่มเด็ก'
                                    : t === 'import' ? 'นำเข้า JSON'
                                        : 'จัดการระดับชั้น'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Level summary cards ── */}
            {mainTab === 'roster' && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* All */}
                        <button
                            onClick={() => setSelectedLevelId('all')}
                            className="rounded-2xl p-4 text-left transition-all"
                            style={{
                                background: selectedLevelId === 'all' ? 'var(--forest)' : 'white',
                                border: `2px solid ${selectedLevelId === 'all' ? 'var(--forest)' : 'var(--warm)'}`,
                                boxShadow: selectedLevelId === 'all' ? '0 4px 16px rgba(28,61,46,0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                            }}
                        >
                            <div className="mb-2"><School size={28} style={{ color: selectedLevelId === 'all' ? 'white' : 'var(--text)', opacity: selectedLevelId === 'all' ? 1 : 0.7 }} /></div>
                            <div
                                className="text-2xl font-bold"
                                style={{ color: selectedLevelId === 'all' ? 'white' : 'var(--text)' }}
                            >
                                {statusFiltered.length}
                            </div>
                            <div
                                className="text-xs mt-0.5"
                                style={{ color: selectedLevelId === 'all' ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}
                            >
                                ทั้งหมด
                            </div>
                        </button>

                        {levelCounts.map(lv => {
                            const active = selectedLevelId === lv.id
                            const c = getLevelColor(lv.color)
                            return (
                                <button
                                    key={lv.id}
                                    onClick={() => setSelectedLevelId(lv.id)}
                                    className="rounded-2xl p-4 text-left transition-all"
                                    style={{
                                        background: active ? lv.color : 'white',
                                        border: `2px solid ${active ? lv.color : 'var(--warm)'}`,
                                        boxShadow: active ? `0 4px 16px ${lv.color}55` : '0 2px 8px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <div
                                        className="text-xs font-bold mb-1 px-2 py-0.5 rounded-full inline-block"
                                        style={{
                                            background: active ? 'rgba(255,255,255,0.25)' : c.bg,
                                            color: active ? 'white' : c.text,
                                        }}
                                    >
                                        {lv.code}
                                    </div>
                                    <div
                                        className="text-2xl font-bold"
                                        style={{ color: active ? 'white' : 'var(--text)' }}
                                    >
                                        {lv.count}
                                    </div>
                                    <div
                                        className="text-xs mt-0.5"
                                        style={{ color: active ? 'rgba(255,255,255,0.85)' : 'var(--muted)' }}
                                    >
                                        {lv.name}
                                    </div>
                                    <div
                                        className="text-xs mt-0.5"
                                        style={{ color: active ? 'rgba(255,255,255,0.6)' : 'var(--sand)' }}
                                    >
                                        อายุ {Math.floor(lv.minAgeMonths / 12)}-{Math.floor(lv.maxAgeMonths / 12)} ปี
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {([
                            ['all', `ทั้งหมด ${enrollments.length}`],
                            ['active', `กำลังเรียน ${statusCounts.active}`],
                            ['leave', `ย้ายออก ${statusCounts.leave}`],
                            ['graduated', `จบแล้ว ${statusCounts.graduated}`],
                        ] as [EnrollmentStatus | 'all', string][]).map(([status, label]) => (
                            <button
                                key={status}
                                onClick={() => setSelectedStatus(status)}
                                className="px-3 py-2 rounded-xl text-xs font-semibold"
                                style={{
                                    background: selectedStatus === status ? 'var(--forest)' : 'white',
                                    color: selectedStatus === status ? 'white' : 'var(--muted)',
                                    border: `1px solid ${selectedStatus === status ? 'var(--forest)' : 'var(--warm)'}`,
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Search + Export */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--muted)' }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="ค้นหาชื่อ ชื่อเล่น หรือรหัส..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm input-field"
                            />
                        </div>
                        <button
                            onClick={() => {
                                const headers = ['รหัส', 'ชื่อเล่น', 'ชื่อ-สกุล', 'อายุ', 'ชั้น', 'สถานะ', 'วันที่', 'เหตุผล', 'ผู้ปกครอง', 'เบอร์โทร']
                                const rows = filtered.map(e => [
                                    e.child.code, e.child.nickname,
                                    `${e.child.firstName} ${e.child.lastName}`,
                                    calcAge(e.child.dateOfBirth).text,
                                    e.level.name,
                                    enrollmentStatusLabels[e.status as EnrollmentStatus],
                                    e.statusDate ? new Date(e.statusDate).toLocaleDateString('th-TH') : '-',
                                    e.statusReason ?? '-',
                                    e.child.parentName, e.child.parentPhone,
                                ])
                                exportCSV(headers, rows, 'children-roster')
                            }}
                            className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                            style={{ background: 'white', color: 'var(--muted)', border: '1px solid var(--warm)' }}
                        >
                            <Download size={12} /> CSV
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                            style={{ background: 'white', color: 'var(--muted)', border: '1px solid var(--warm)' }}
                        >
                            <Download size={12} /> PDF
                        </button>
                    </div>

                    {/* Child grid */}
                    <ChildGrid
                        enrollments={filtered}
                        loading={loadingEnrollments && !enrollments.length}
                        levels={levels}
                        yearId={selectedYearId}
                        onRefresh={mutateEnrollments}
                    />
                </>
            )}

            {mainTab === 'add' && (
                <AddChildForm
                    years={years}
                    selectedYearId={selectedYearId}
                    onSuccess={() => { setMainTab('roster'); mutateEnrollments() }}
                />
            )}

            {mainTab === 'import' && (
                <ImportJSON
                    selectedYearId={selectedYearId}
                    levels={levels}
                    onSuccess={() => { setMainTab('roster'); mutateEnrollments() }}
                />
            )}

            {mainTab === 'manage-levels' && selectedYearId && (
                <ManageLevels
                    yearId={selectedYearId}
                    levels={levels}
                    onRefresh={mutateYears}
                />
            )}
        </div>
    )
}
