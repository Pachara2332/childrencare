// components/layout/Header.tsx
'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const pageTitles: Record<string, { title: string; subtitle: string; accent: string }> = {
    '/dashboard': { title: 'ภาพรวม', subtitle: 'สรุปสถานะศูนย์ประจำวัน', accent: 'var(--leaf)' },
    '/children': { title: 'ข้อมูลเด็ก', subtitle: 'จัดการทะเบียนนักเรียน', accent: 'var(--sage)' },
    '/checkin': { title: 'เช็กชื่อเข้า-ออก', subtitle: 'บันทึกการมาเรียน', accent: 'var(--sky)' },
    '/announcements': { title: 'แจ้งข่าวผู้ปกครอง', subtitle: 'ประกาศและข่าวสาร', accent: 'var(--coral)' },
    '/development': { title: 'บันทึกพัฒนาการ', subtitle: 'ติดตามการเติบโตของเด็ก', accent: 'var(--sun)' },
    '/activities': { title: 'กิจกรรมประจำวัน', subtitle: 'บันทึกกิจกรรมของเด็กแต่ละคน', accent: 'var(--gold)' },
    '/payments': { title: 'ค่าใช้จ่าย', subtitle: 'จัดการค่าเทอมและค่าอาหาร', accent: '#40916C' },
    '/reports': { title: 'รายงาน', subtitle: 'รายงานสำหรับ อบต./เทศบาล', accent: 'var(--forest)' },
    '/settings': { title: 'ตั้งค่า', subtitle: 'ตั้งค่าระบบและบัญชีผู้ใช้', accent: 'var(--muted)' },
}

export default function Header() {
    const pathname = usePathname()
    const [now, setNow] = useState(new Date())
    const [presentCount, setPresentCount] = useState<number | null>(null)

    // Match page title
    const pageKey = Object.keys(pageTitles).find(k => pathname.startsWith(k)) ?? '/dashboard'
    const { title, subtitle, accent } = pageTitles[pageKey] ?? pageTitles['/dashboard']

    // Update clock
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(t)
    }, [])

    // Fetch today's present count
    useEffect(() => {
        fetch('/api/checkin/today-count')
            .then(r => r.json())
            .then(d => setPresentCount(d.count))
            .catch(() => { })
    }, [pathname])

    const dateStr = now.toLocaleDateString('th-TH', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    const timeStr = now.toLocaleTimeString('th-TH', {
        hour: '2-digit', minute: '2-digit',
    })

    return (
        <header
            className="shrink-0 flex items-center justify-between px-6"
            style={{
                height: 64,
                background: 'white',
                borderBottom: '1px solid var(--warm)',
                boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                position: 'sticky',
                top: 0,
                zIndex: 40,
            }}
        >
            {/* Page info with accent bar */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full" style={{ background: accent }} />
                <div>
                    <h1 className="font-bold text-base" style={{ color: 'var(--text)', lineHeight: 1.2 }}>
                        {title}
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {subtitle}
                    </p>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Present count chip */}
                {presentCount !== null && (
                    <div
                        className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold"
                        style={{ background: '#E8F5EE', color: 'var(--leaf)' }}
                    >
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--sage)' }} />
                        <span>{presentCount} คน อยู่ที่ศูนย์</span>
                    </div>
                )}

                {/* Date + Time */}
                <div className="text-right hidden md:block">
                    <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{dateStr}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{timeStr} น.</p>
                </div>

                {/* Avatar */}
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, var(--sage), var(--leaf))', color: 'white' }}
                >
                    ค
                </div>
            </div>
        </header>
    )
}