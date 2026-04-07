import { School, ClipboardList, Megaphone } from 'lucide-react'

export default function DashboardLoading() {
    return (
        <div className="space-y-5 animate-pulse">
            {/* Stats row skeleton */}
            <div
                className="rounded-2xl p-5 card"
                style={{ background: 'var(--warm)', border: 'none', opacity: 0.6 }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="w-24 h-4 bg-gray-200 rounded-md mb-2"></div>
                        <div className="w-48 h-8 bg-gray-200 rounded-md mt-1"></div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-2 sm:mt-0">
                        {/* 4 small stat blocks */}
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="text-right flex flex-col items-end">
                                <div className="w-16 h-6 bg-gray-200 rounded-md mb-1.5"></div>
                                <div className="w-20 h-3 bg-gray-200 rounded-md"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main content grid skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Check-in today skeleton (3 cols) */}
                <div className="lg:col-span-3 card rounded-2xl p-5 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-32 h-5 bg-gray-200 rounded-md"></div>
                        <div className="w-20 h-6 bg-gray-200 rounded-lg"></div>
                    </div>

                    <div className="space-y-2.5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-gray-50">
                                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="w-32 h-4 bg-gray-200 rounded-md"></div>
                                    <div className="w-48 h-3 bg-gray-200 rounded-md"></div>
                                </div>
                                <div className="w-16 h-6 bg-gray-200 rounded-full shrink-0"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Announcements skeleton (2 cols) */}
                <div className="lg:col-span-2 card rounded-2xl p-5 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-24 h-5 bg-gray-200 rounded-md"></div>
                        <div className="w-20 h-6 bg-gray-200 rounded-lg"></div>
                    </div>

                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-xl px-3.5 py-3 bg-gray-50 border-l-4 border-gray-200">
                                <div className="w-40 h-4 bg-gray-200 rounded-md mb-2"></div>
                                <div className="w-full h-3 bg-gray-200 rounded-md mb-1.5"></div>
                                <div className="w-2/3 h-3 bg-gray-200 rounded-md"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
