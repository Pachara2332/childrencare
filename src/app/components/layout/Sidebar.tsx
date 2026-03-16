// components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, Baby, CheckSquare, Megaphone, TrendingUp, Camera, Wallet, FileText, Settings, Leaf, LogOut, ChevronRight, ChevronLeft } from 'lucide-react'

const navItems = [
    { href: '/dashboard', icon: Home, label: 'ภาพรวม' },
    { href: '/children', icon: Baby, label: 'ข้อมูลเด็ก' },
    { href: '/checkin', icon: CheckSquare, label: 'เช็กชื่อ' },
    { href: '/announcements', icon: Megaphone, label: 'แจ้งข่าว' },
    { href: '/development', icon: TrendingUp, label: 'พัฒนาการ' },
    { href: '/activities', icon: Camera, label: 'กิจกรรมรายวัน' },
    { href: '/payments', icon: Wallet, label: 'ค่าใช้จ่าย' },
    { href: '/reports', icon: FileText, label: 'รายงาน' },
    { href: '/settings', icon: Settings, label: 'ตั้งค่า' },
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
            className="flex flex-col shrink-0 h-full"
            style={{
                width: collapsed ? 68 : 220,
                background: 'var(--forest)',
                transition: 'width 0.3s var(--ease-out-expo)',
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-3 shrink-0"
                style={{
                    padding: collapsed ? '20px 0' : '20px 18px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderBottom: '1px solid oklch(1 0 0 / 0.06)',
                }}
            >
                <div
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: 'var(--sage)' }}
                >
                    <Leaf size={20} color="white" />
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
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="nav-item flex items-center gap-3 rounded-xl mb-0.5"
                            style={{
                                padding: collapsed ? '10px 0' : '10px 14px',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                background: active ? 'oklch(0.65 0.14 160 / 0.15)' : 'transparent',
                                color: active ? 'var(--mint)' : 'oklch(1 0 0 / 0.5)',
                                fontWeight: active ? 600 : 400,
                            }}
                            title={collapsed ? item.label : undefined}
                        >
                            <span className="shrink-0" style={{ opacity: active ? 1 : 0.7 }}>
                                <Icon size={20} />
                            </span>
                            {!collapsed && (
                                <span className="text-sm truncate">
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
                style={{ borderTop: '1px solid oklch(1 0 0 / 0.06)' }}
            >
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="nav-item flex items-center gap-3 rounded-xl w-full mb-1"
                    style={{
                        padding: collapsed ? '10px 0' : '10px 14px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        color: 'oklch(1 0 0 / 0.35)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <span
                        className="text-base"
                        style={{
                            transition: 'transform 0.3s var(--ease-out-expo)',
                        }}
                    >
                        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </span>
                    {!collapsed && <span className="text-sm">ย่อเมนู</span>}
                </button>

                <button
                    onClick={handleLogout}
                    className="nav-item flex items-center gap-3 rounded-xl w-full"
                    style={{
                        padding: collapsed ? '10px 0' : '10px 14px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        color: 'oklch(1 0 0 / 0.35)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <span><LogOut size={20} /></span>
                    {!collapsed && <span className="text-sm">ออกจากระบบ</span>}
                </button>
            </div>
        </aside>
    )
}