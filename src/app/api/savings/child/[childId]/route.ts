import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { childId: string } }) {
    try {
        const childId = Number(params.childId)
        if (isNaN(childId)) return NextResponse.json({ error: 'Invalid childId' }, { status: 400 })

        const activeYear = await prisma.academicYear.findFirst({
            where: { isActive: true }
        })

        if (!activeYear) return NextResponse.json({ error: 'No active academic year' }, { status: 404 })

        const transactions = await prisma.saving.findMany({
            where: { childId, academicYearId: activeYear.id },
            orderBy: { createdAt: 'desc' },
            include: {
                child: {
                    select: {
                        qrToken: true
                    }
                }
            }
        })

        const balance = transactions.reduce((sum: number, t: any) => sum + t.amount, 0)
        let qrToken = null
        if (transactions.length > 0) {
            qrToken = transactions[0].child.qrToken
        } else {
            const child = await prisma.child.findUnique({ where: { id: childId }, select: { qrToken: true } })
            if (child) qrToken = child.qrToken
        }

        return NextResponse.json({ balance, qrToken, transactions })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
