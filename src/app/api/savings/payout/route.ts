import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { childId, levelId } = body

        if (!childId && !levelId) {
            return NextResponse.json({ error: 'Must provide childId or levelId' }, { status: 400 })
        }

        const activeYear = await prisma.academicYear.findFirst({
            where: { isActive: true }
        })

        if (!activeYear) return NextResponse.json({ error: 'No active academic year' }, { status: 404 })

        let targetChildrenIds: number[] = []

        if (childId) {
            targetChildrenIds.push(Number(childId))
        } else if (levelId) {
            const enrollments = await prisma.childEnrollment.findMany({
                where: { academicYearId: activeYear.id, levelId: Number(levelId) }
            })
            targetChildrenIds = enrollments.map((enrollment) => enrollment.childId)
        }

        if (targetChildrenIds.length === 0) {
            return NextResponse.json({
                message: 'Payout completed',
                count: 0,
                payouts: []
            }, { status: 201 })
        }

        const [existingPayouts, balances] = await Promise.all([
            prisma.saving.findMany({
                where: {
                    childId: { in: targetChildrenIds },
                    academicYearId: activeYear.id,
                    type: 'payout'
                },
                select: { childId: true }
            }),
            prisma.saving.groupBy({
                by: ['childId'],
                where: {
                    childId: { in: targetChildrenIds },
                    academicYearId: activeYear.id
                },
                _sum: { amount: true }
            })
        ])

        const payoutChildIds = new Set(existingPayouts.map((item) => item.childId))
        const payoutRows = balances
            .filter((item) => !payoutChildIds.has(item.childId) && (item._sum.amount ?? 0) > 0)
            .map((item) => ({
                childId: item.childId,
                academicYearId: activeYear.id,
                date: new Date(),
                amount: -(item._sum.amount ?? 0),
                type: 'payout',
                note: 'เธ–เธญเธเธเธเธเธต / เธฅเธฒเธญเธญเธ',
                recordedBy: 'system/teacher'
            }))

        if (payoutRows.length > 0) {
            await prisma.saving.createMany({
                data: payoutRows
            })
        }

        return NextResponse.json({
            message: 'Payout completed',
            count: payoutRows.length,
            payouts: payoutRows
        }, { status: 201 })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
