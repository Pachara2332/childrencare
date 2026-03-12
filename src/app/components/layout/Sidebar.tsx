// components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
    { href: '/dashboard', icon: '🏠', label: 'ภาพรวม' },
    { href: '/children', icon: '👶', label: 'ข้อมูลเด็ก' },
    { href: '/checkin', icon: '✅', label: 'เช็กชื่อ' },
    { href: '/announcements', icon: '📢', label: 'แจ้งข่าว' },
    { href: '/development', icon: '📈', label: 'พัฒนาการ' },
    { href: '/activities', icon: '📷', label: 'กิจกรรมรายวัน' },
    { href: '/payments', icon: '💰', label: 'ค่าใช้จ่าย' },
    { href: '/reports', icon: '📄', label: 'รายงาน' },
    { href: '/settings', icon: '⚙️', label: 'ตั้งค่า' },
]

export default function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    const handleLogout = async () => {
        await fetch('/api/auth/pin', { method: 'DELETE' })
        window.location.href = '/'
    }

    return (
        <aside
            className="flex flex-col shrink-0 transition-all duration-300 h-full"
            style={{
                width: collapsed ? 72 : 230,
                background: 'linear-gradient(180deg, #1C3D2E 0%, #163328 100%)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-3 px-4 py-5 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
                <div
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: 'linear-gradient(135deg, var(--sage), var(--leaf))' }}
                >
                    🌱
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <p className="text-white text-xs font-semibold leading-tight truncate">
                            ศูนย์พัฒนาเด็กเล็ก
                        </p>
                        <p className="text-xs font-light truncate" style={{ color: 'var(--mint)' }}>
                            บ้านหนองนางเลิง
                        </p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-3 px-2 overflow-y-auto">
                {navItems.map((item) => {
                    const active = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="nav-item flex items-center gap-3 rounded-xl mb-0.5 transition-all duration-150 group"
                            style={{
                                padding: collapsed ? '10px 0' : '10px 14px',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                background: active ? 'rgba(82,183,136,0.18)' : 'transparent',
                                borderLeft: active ? '3px solid var(--sage)' : '3px solid transparent',
                                color: active ? 'var(--mint)' : 'rgba(255,255,255,0.55)',
                            }}
                            title={collapsed ? item.label : undefined}
                        >
                            <span className="text-lg shrink-0" style={{ filter: active ? 'none' : 'grayscale(0.3)' }}>{item.icon}</span>
                            {!collapsed && (
                                <span
                                    className="text-sm truncate"
                                    style={{ fontWeight: active ? 600 : 400 }}
                                >
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Collapse toggle + Logout */}
            <div
                className="px-2 py-3 shrink-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="nav-item flex items-center gap-3 rounded-xl w-full mb-1 transition-all duration-150"
                    style={{
                        padding: collapsed ? '10px 0' : '10px 14px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        color: 'rgba(255,255,255,0.4)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <span className="text-lg transition-transform" style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}>«</span>
                    {!collapsed && <span className="text-sm">ย่อเมนู</span>}
                </button>

                <button
                    onClick={handleLogout}
                    className="nav-item flex items-center gap-3 rounded-xl w-full transition-all duration-150"
                    style={{
                        padding: collapsed ? '10px 0' : '10px 14px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        color: 'rgba(255,255,255,0.4)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <span className="text-lg">🚪</span>
                    {!collapsed && <span className="text-sm">ออกจากระบบ</span>}
                </button>
            </div>
        </aside>
    )
}