'use client'

import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center h-96 gap-4 animate-fade-up">
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: '#FFF0ED' }}
            >
                <AlertTriangle size={32} color="var(--coral)" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                เกิดข้อผิดพลาด
            </h2>
            <p
                className="text-sm text-center max-w-xs"
                style={{ color: 'var(--muted)' }}
            >
                ไม่สามารถโหลดข้อมูลได้ อาจเกิดจากปัญหาการเชื่อมต่อ<br />
                กรุณาลองอีกครั้ง
            </p>
            <div className="flex gap-3 mt-2">
                <button
                    onClick={() => reset()}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold btn-primary flex items-center gap-2"
                >
                    <RefreshCw size={16} /> ลองอีกครั้ง
                </button>
                <a
                    href="/"
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
                    style={{
                        background: 'white',
                        color: 'var(--muted)',
                        border: '1px solid var(--warm)',
                    }}
                >
                    <Home size={16} /> หน้าหลัก
                </a>
            </div>
        </div>
    )
}
