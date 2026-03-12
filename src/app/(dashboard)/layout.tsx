// app/(dashboard)/layout.tsx
import { requireAuth } from '@/lib/auth'
import Sidebar from '@/app/components/layout/Sidebar'
import Header from '@/app/components/layout/Header'
import StoreInitializer from '@/app/components/providers/StoreInitializer'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    await requireAuth()

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--cream)' }}>
            <StoreInitializer />
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}