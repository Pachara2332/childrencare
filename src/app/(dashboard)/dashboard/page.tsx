// app/(dashboard)/dashboard/page.tsx
import { prisma } from '@/lib/prisma'

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

    const checkInsToday = await prisma.checkIn.findMany({
        where: { date: today },
        include: { child: true },
        orderBy: { checkInAt: 'desc' },
        take: 8,
    })

    return {
        activeYear,
        totalChildren,
        presentToday,
        absentToday: totalChildren - presentToday,
        announcements,
        recentActivities,
        pendingPayments,
        checkInsToday,
    }
}

export default async function DashboardPage() {
    const data = await getDashboardData()

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="text-6xl animate-pulse">🏫</div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                    ยังไม่มีปีการศึกษาที่ใช้งานอยู่
                </h2>
                <p style={{ color: 'var(--muted)' }} className="text-sm text-center">
                    กรุณาไปที่ตั้งค่า → สร้างปีการศึกษาและเปิดใช้งาน
                </p>
                <a
                    href="/settings"
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold btn-primary"
                    style={{ background: 'var(--leaf)' }}
                >
                    ⚙️ ไปตั้งค่า
                </a>
            </div>
        )
    }

    const stats = [
        { label: 'เด็กทั้งหมด', value: data.totalChildren, icon: '👶', color: 'var(--leaf)', bg: '#E8F5EE' },
        { label: 'มาเรียนวันนี้', value: data.presentToday, icon: '✅', color: '#40916C', bg: '#D8F3DC' },
        { label: 'ขาดเรียน', value: data.absentToday, icon: '❌', color: 'var(--coral)', bg: '#FFF0ED' },
        { label: 'ค้างจ่ายค่าเทอม', value: data.pendingPayments, icon: '💳', color: 'var(--sun)', bg: '#FFF8E8' },
    ]

    const typeIcon: Record<string, string> = {
        general: '📢', holiday: '🎉', activity: '⚽', emergency: '🚨'
    }

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Year badge */}
            <div className="flex items-center gap-2">
                <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: '#E8F5EE', color: 'var(--leaf)' }}
                >
                    📚 {data.activeYear.name}
                </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div
                        key={s.label}
                        className={`rounded-2xl p-4 animate-fade-up delay-${i + 1}`}
                        style={{
                            background: 'white',
                            border: '1px solid var(--warm)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                            style={{ background: s.bg }}
                        >
                            {s.icon}
                        </div>
                        <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>
                            {s.value}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Check-in today (3 cols) */}
                <div
                    className="lg:col-span-3 rounded-2xl p-5"
                    style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                            ✅ การเช็กชื่อวันนี้
                        </h3>
                        <a href="/checkin" className="text-xs" style={{ color: 'var(--sage)' }}>
                            ดูทั้งหมด →
                        </a>
                    </div>

                    {data.checkInsToday.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-4xl mb-2">📋</p>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ยังไม่มีการเช็กชื่อวันนี้</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {data.checkInsToday.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                                    style={{ background: 'var(--cream)' }}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                        style={{ background: c.child.gender === 'male' ? '#DBE9F4' : '#FDE8F0', color: c.child.gender === 'male' ? 'var(--sky)' : '#C2185B' }}
                                    >
                                        {c.child.nickname.slice(0, 1)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                                            {c.child.nickname} — {c.child.firstName}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                            🟢 {c.checkInAt
                                                ? new Date(c.checkInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                                                : '—'}
                                            {c.checkOutAt && ` · 🔴 ${new Date(c.checkOutAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`}
                                        </p>
                                    </div>
                                    <span
                                        className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                                        style={c.checkOutAt
                                            ? { background: '#F0EDEA', color: 'var(--muted)' }
                                            : { background: '#D8F3DC', color: '#1B4332' }
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
                <div
                    className="lg:col-span-2 rounded-2xl p-5"
                    style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                            📢 ประกาศล่าสุด
                        </h3>
                        <a href="/announcements" className="text-xs" style={{ color: 'var(--sage)' }}>
                            ดูทั้งหมด →
                        </a>
                    </div>

                    {data.announcements.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-3xl mb-2">📭</p>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>ไม่มีประกาศ</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.announcements.map((a) => (
                                <div
                                    key={a.id}
                                    className="rounded-xl p-3"
                                    style={{
                                        background: a.isUrgent ? '#FFF0ED' : 'var(--cream)',
                                        border: a.isUrgent ? '1px solid #F4C0B0' : '1px solid var(--warm)',
                                    }}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-base shrink-0">{typeIcon[a.type] ?? '📢'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                                                {a.title}
                                                {a.isUrgent && (
                                                    <span className="ml-1.5 text-xs font-bold" style={{ color: 'var(--coral)' }}>
                                                        ด่วน!
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>
                                                {a.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}