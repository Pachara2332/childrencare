'use client'

interface SkeletonProps {
    className?: string
    style?: React.CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
    return (
        <div
            className={`rounded-xl ${className}`}
            style={{
                background: 'linear-gradient(90deg, var(--warm) 25%, #f5f0e8 50%, var(--warm) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease infinite',
                ...style,
            }}
        />
    )
}

/** 3 stat cards in a row */
export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
                <div key={i} className="rounded-2xl p-4 text-center" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-3 w-20 mx-auto" />
                </div>
            ))}
        </div>
    )
}

/** 4 stat cards (dashboard style) */
export function StatsCardsSkeleton({ cols = 4 }: { cols?: number }) {
    return (
        <div className={`grid grid-cols-2 lg:grid-cols-${cols} gap-4`}>
            {Array.from({ length: cols }).map((_, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                    <Skeleton className="w-10 h-10 rounded-xl mb-3" />
                    <Skeleton className="h-7 w-20 mb-2" />
                    <Skeleton className="h-3 w-16" />
                </div>
            ))}
        </div>
    )
}

/** Table with header + rows */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--warm)' }}>
            {/* Header */}
            <div className="flex gap-4 px-4 py-3" style={{ background: 'var(--cream)', borderBottom: '1px solid var(--warm)' }}>
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-3 flex-1" style={{ maxWidth: i === 0 ? 120 : 80 }} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5" style={{ borderBottom: '1px solid var(--warm)' }}>
                    <div className="flex items-center gap-2.5 flex-1" style={{ maxWidth: 150 }}>
                        <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                        <div className="flex-1">
                            <Skeleton className="h-3.5 w-16 mb-1.5" />
                            <Skeleton className="h-2.5 w-12" />
                        </div>
                    </div>
                    {Array.from({ length: cols - 1 }).map((_, j) => (
                        <Skeleton key={j} className="h-3.5 flex-1" style={{ maxWidth: 80 }} />
                    ))}
                </div>
            ))}
        </div>
    )
}

/** Grid of child cards */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                    <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                        <div className="flex-1">
                            <Skeleton className="h-3.5 w-20 mb-1.5" />
                            <Skeleton className="h-2.5 w-14" />
                        </div>
                    </div>
                    <Skeleton className="h-16 w-full rounded-xl" />
                </div>
            ))}
        </div>
    )
}

/** Manual check-in child list skeleton */
export function ChildListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background: 'white', border: '1px solid var(--warm)' }}>
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1">
                        <Skeleton className="h-3.5 w-20 mb-1.5" />
                        <Skeleton className="h-2.5 w-28" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-xl shrink-0" />
                </div>
            ))}
        </div>
    )
}
