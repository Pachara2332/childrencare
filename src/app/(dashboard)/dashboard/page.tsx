// app/(dashboard)/dashboard/page.tsx
import { prisma } from '@/lib/prisma'
import { School, ClipboardList, Inbox, Megaphone, Calendar, PlayCircle, AlertTriangle, UserCheck } from 'lucide-react'
import DashboardClient from './DashboardClient'
import DashboardBadge from './DashboardBadge'

async function getDashboardData() {
    const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
    })

    if (!activeYear) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalChildren, presentToday, announcements, recentActivities, pendingPayments] =
        await Promise.all([
            prisma.childEnrollment.count({
                where: { academicYearId: activeYear.id, status: 'active' },
            }),
            prisma.checkIn.count({
                where: {
                    date: today,
                    checkInAt: { not: null },
                    checkOutAt: null,
                },
            }),
            prisma.announcement.findMany({
                where: {
                    academicYearId: activeYear.id,
                    OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
                },
                orderBy: [{ isUrgent: 'desc' }, { publishedAt: 'desc' }],
                take: 5,
            }),
            prisma.dailyActivity.findMany({
                where: { date: today, academicYearId: activeYear.id },
                include: { child: true },
                take: 5,
            }),
            prisma.payment.count({
                where: {
                    academicYearId: activeYear.id,
                    status: { in: ['pending', 'overdue'] },
                },
            }),
        ])

    const children = await prisma.child.findMany({
        where: {
            enrollments: {
                some: { academicYearId: activeYear.id, status: 'active' }
            }
        },
        include: {
            enrollments: {
                where: { academicYearId: activeYear.id, status: 'active' },
                include: { level: true },
                take: 1
            }
        }
    })

    const checkInsTodayArray = await prisma.checkIn.findMany({
        where: { date: today },
        include: { child: true },
        orderBy: { checkInAt: 'desc' },
    })
    
    const checkInsToday = checkInsTodayArray.slice(0, 8)

    return {
        activeYear,
        totalChildren,
        presentToday,
        absentToday: totalChildren - presentToday,
        announcements,
        recentActivities,
        pendingPayments,
        checkInsToday,
        allChildren: children,
        allCheckInsToday: checkInsTodayArray,
    }
}

export default async function DashboardPage() {
    const data = await getDashboardData()

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="mb-2"><School size={48} color="var(--muted)" /></div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                    ยังไม่มีปีการศึกษาที่ใช้งานอยู่
                </h2>
                <p style={{ color: 'var(--muted)' }} className="text-sm text-center max-w-xs">
                    กรุณาไปที่ตั้งค่า → สร้างปีการศึกษาและเปิดใช้งาน
                </p>
                <a
                    href="/settings"
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold btn-primary"
                >
                    ไปตั้งค่า
                </a>
            </div>
        )
    }

    const typeIcon: Record<string, React.ReactNode> = {
        general: <Megaphone size={16} />, holiday: <Calendar size={16} />, activity: <PlayCircle size={16} />, emergency: <AlertTriangle size={16} />
    }

    return (
        <div className="space-y-5 animate-fade-up">
            {/* Quick stats — horizontal strip instead of 4 identical cards */}
            <div
                className="rounded-2xl p-5 card"
                style={{ background: 'var(--forest)', border: 'none' }}
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-xs mb-1" style={{ color: 'var(--mint)' }}>
                            {data.activeYear.name}
                        </p>
                        <p className="text-2xl font-bold text-white">
                            {data.presentToday}
                            <span className="text-sm font-normal ml-1" style={{ color: 'oklch(1 0 0 / 0.5)' }}>
                                / {data.totalChildren} คน มาเรียนวันนี้
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <DashboardBadge />
                        {[
                            { label: 'ขาดเรียน', value: data.absentToday, color: 'oklch(0.8 0.1 25)' },
                            { label: 'ค้างจ่าย', value: data.pendingPayments, color: 'oklch(0.8 0.1 70)' },
                        ].map(s => (
                            <div key={s.label} className="text-right">
                                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                                <p className="text-xs" style={{ color: 'oklch(1 0 0 / 0.4)' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Check-in today (3 cols) */}
                <div className="lg:col-span-3 card rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                            การเช็กชื่อวันนี้
                        </h3>
                        <div className="flex gap-2">
                            <DashboardClient children={data.allChildren} checkInsToday={data.allCheckInsToday} />
                            <a
                                href="/checkin"
                                className="text-xs font-medium px-2.5 py-1 rounded-lg"
                                style={{ color: 'var(--leaf)', background: 'oklch(0.95 0.02 160)' }}
                            >
                                ดูทั้งหมด →
                            </a>
                        </div>
                    </div>

                    {data.checkInsToday.length === 0 ? (
                        <div className="py-10 text-center flex flex-col items-center">
                            <div className="mb-3"><ClipboardList size={36} color="var(--muted)" /></div>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ยังไม่มีการเช็กชื่อวันนี้</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {data.checkInsToday.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 table-row"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                        style={{
                                            background: c.child.gender === 'male'
                                                ? 'oklch(0.90 0.04 240)' : 'oklch(0.92 0.04 350)',
                                            color: c.child.gender === 'male'
                                                ? 'var(--sky)' : 'oklch(0.50 0.12 350)',
                                        }}
                                    >
                                        {c.child.nickname.slice(0, 1)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                                            {c.child.nickname}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                            {c.checkInAt
                                                ? new Date(c.checkInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                                                : '—'}
                                            {c.checkOutAt && ` → ${new Date(c.checkOutAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`}
                                        </p>
                                    </div>
                                    <span
                                        className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                                        style={c.checkOutAt
                                            ? { background: 'var(--warm)', color: 'var(--muted)' }
                                            : { background: 'oklch(0.93 0.04 160)', color: 'var(--leaf)' }
                                        }
                                    >
                                        {c.checkOutAt ? 'กลับบ้าน' : 'อยู่ศูนย์'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Announcements (2 cols) */}
                <div className="lg:col-span-2 card rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                            ประกาศล่าสุด
                        </h3>
                        <a
                            href="/announcements"
                            className="text-xs font-medium px-2.5 py-1 rounded-lg"
                            style={{ color: 'var(--leaf)', background: 'oklch(0.95 0.02 160)' }}
                        >
                            ดูทั้งหมด →
                        </a>
                    </div>

                    {data.announcements.length === 0 ? (
                        <div className="py-10 text-center flex flex-col items-center">
                            <div className="mb-3"><Inbox size={32} color="var(--muted)" /></div>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ไม่มีประกาศ</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {data.announcements.map((a) => (
                                <div
                                    key={a.id}
                                    className="rounded-xl px-3.5 py-3"
                                    style={{
                                        background: a.isUrgent ? 'oklch(0.96 0.03 25)' : 'var(--cream)',
                                        borderLeft: a.isUrgent ? '3px solid var(--coral)' : '3px solid var(--warm)',
                                    }}
                                >
                                    <p className="text-sm font-semibold leading-tight flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                                        <span>{typeIcon[a.type] ?? <Megaphone size={16} />}</span>
                                        {a.title}
                                        {a.isUrgent && (
                                            <span className="ml-1.5 text-xs font-bold" style={{ color: 'var(--coral)' }}>
                                                ด่วน
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>
                                        {a.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}