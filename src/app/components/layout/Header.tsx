// components/layout/Header.tsx
'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useChildcareStore } from '@/store/useStore'
import { Menu } from 'lucide-react'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': { title: 'ภาพรวม', subtitle: 'สรุปสถานะศูนย์ประจำวัน' },
    '/children': { title: 'ข้อมูลเด็ก', subtitle: 'จัดการทะเบียนนักเรียน' },
    '/checkin': { title: 'เช็กชื่อเข้า-ออก', subtitle: 'บันทึกการมาเรียน' },
    '/announcements': { title: 'แจ้งข่าวผู้ปกครอง', subtitle: 'ประกาศและข่าวสาร' },
    '/development': { title: 'บันทึกพัฒนาการ', subtitle: 'ติดตามการเติบโตของเด็ก' },
    '/activities': { title: 'กิจกรรมประจำวัน', subtitle: 'บันทึกกิจกรรมของเด็กแต่ละคน' },
    '/payments': { title: 'ค่าใช้จ่าย', subtitle: 'จัดการค่าเทอมและค่าอาหาร' },
    '/reports': { title: 'รายงาน', subtitle: 'รายงานสำหรับ อบต./เทศบาล' },
    '/settings': { title: 'ตั้งค่า', subtitle: 'ตั้งค่าระบบและบัญชีผู้ใช้' },
}

export default function Header() {
    const pathname = usePathname()
    const [now, setNow] = useState(new Date())

    // Zustand Store
    const { presentCount, fetchPresentCount, setMobileMenuOpen } = useChildcareStore()

    // Match page title
    const pageKey = Object.keys(pageTitles).find(k => pathname.startsWith(k)) ?? '/dashboard'
    const { title, subtitle } = pageTitles[pageKey] ?? pageTitles['/dashboard']

    // Update clock
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(t)
    }, [])

    // Fetch today's present count
    useEffect(() => {
        fetchPresentCount()
    }, [pathname, fetchPresentCount])

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
                height: 60,
                background: 'white',
                borderBottom: '1px solid var(--warm)',
                position: 'sticky',
                top: 0,
                zIndex: 40,
            }}
        >
            {/* Left side: Hamburger (Mobile) + Page info */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden p-1.5 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div>
                    <h1 className="font-bold text-base" style={{ color: 'var(--text)', lineHeight: 1.2 }}>
                        {title}
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {subtitle}
                    </p>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Present count chip */}
                {presentCount !== null && (
                    <div
                        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                        style={{ background: 'oklch(0.95 0.02 160)', color: 'var(--leaf)' }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                                background: 'var(--sage)',
                                animation: 'pulse-dot 2s ease-in-out infinite',
                            }}
                        />
                        <span>{presentCount} คน</span>
                    </div>
                )}

                {/* Date + Time */}
                <div className="text-right hidden md:block">
                    <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{dateStr}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{timeStr} น.</p>
                </div>

                {/* Avatar */}
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--sage)', color: 'white' }}
                >
                    ค
                </div>
            </div>
        </header>
    )
}