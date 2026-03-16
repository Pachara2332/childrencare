import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) return NextResponse.json({ error: 'Token missing' }, { status: 400 })

        const activeYear = await prisma.academicYear.findFirst({
            where: { isActive: true }
        })

        if (!activeYear) return NextResponse.json({ error: 'No active academic year' }, { status: 404 })

        const child = await prisma.child.findUnique({
            where: { qrToken: token },
            include: {
                enrollments: {
                    where: { academicYearId: activeYear.id },
                    include: { level: true }
                },
                savings: {
                    where: { academicYearId: activeYear.id },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!child) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

        const className = child.enrollments[0]?.level.name || 'ไม่ระบุชั้น'
        const childName = `${child.firstName} ${child.lastName} (${child.nickname})`
        const balance = child.savings.reduce((sum: number, s: any) => sum + s.amount, 0)

        return NextResponse.json({
            childName,
            className,
            balance,
            transactions: child.savings
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
