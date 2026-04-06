// components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Home,
  Baby,
  CheckSquare,
  Megaphone,
  TrendingUp,
  Camera,
  Wallet,
  FileText,
  Settings,
  Leaf,
  LogOut,
  ChevronRight,
  ChevronLeft,
  X,
  PiggyBank,
  ClipboardList,
} from 'lucide-react'
import { useChildcareStore } from '@/store/useStore'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'ภาพรวม' },
  { href: '/children', icon: Baby, label: 'ข้อมูลเด็ก' },
  { href: '/applications', icon: ClipboardList, label: 'ใบสมัครออนไลน์' },
  { href: '/checkin', icon: CheckSquare, label: 'เช็กชื่อ' },
  { href: '/announcements', icon: Megaphone, label: 'แจ้งข่าว' },
  { href: '/development', icon: TrendingUp, label: 'พัฒนาการ' },
  { href: '/activities', icon: Camera, label: 'กิจกรรมรายวัน' },
  { href: '/payments', icon: Wallet, label: 'ค่าใช้จ่าย' },
  { href: '/savings', icon: PiggyBank, label: 'เงินออม' },
  { href: '/reports', icon: FileText, label: 'รายงาน' },
  { href: '/settings', icon: Settings, label: 'ตั้งค่า' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { mobileMenuOpen, setMobileMenuOpen } = useChildcareStore()

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname, setMobileMenuOpen])

  const handleLogout = async () => {
    await fetch('/api/auth/pin', { method: 'DELETE' })
    window.location.href = '/'
  }

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed z-50 flex h-full shrink-0 flex-col transform transition-transform duration-300 ease-out md:relative md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: collapsed ? 68 : 250,
          background: 'var(--forest)',
        }}
      >
        <div
          className="flex shrink-0 items-center gap-3"
          style={{
            padding: collapsed ? '20px 0' : '20px 18px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: '1px solid oklch(1 0 0 / 0.06)',
          }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ background: 'var(--sage)' }}
          >
            <Leaf size={20} color="white" />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold leading-tight text-white">
                ศูนย์พัฒนาเด็กเล็ก
              </p>
              <p className="truncate text-xs font-light" style={{ color: 'var(--mint)' }}>
                บ้านหนองนางเลิง
              </p>
            </div>
          )}
          <button
            className="ml-auto p-1.5 text-white/70 hover:text-white md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item mb-0.5 flex items-center gap-3 rounded-xl"
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
                {!collapsed && <span className="truncate text-sm">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div
          className="shrink-0 px-2 py-3"
          style={{ borderTop: '1px solid oklch(1 0 0 / 0.06)' }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="nav-item mb-1 flex w-full items-center gap-3 rounded-xl"
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
            className="nav-item flex w-full items-center gap-3 rounded-xl"
            style={{
              padding: collapsed ? '10px 0' : '10px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: 'oklch(1 0 0 / 0.35)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>
              <LogOut size={20} />
            </span>
            {!collapsed && <span className="text-sm">ออกจากระบบ</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
