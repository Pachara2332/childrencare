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
            targetChildrenIds = enrollments.map((e: any) => e.childId)
        }

        const summaries = []

        for (const cid of targetChildrenIds) {
            const existingPayout = await prisma.saving.findFirst({
                where: { childId: cid, academicYearId: activeYear.id, type: 'payout' }
            })
            
            if (existingPayout) continue

            const transactions = await prisma.saving.findMany({
                where: { childId: cid, academicYearId: activeYear.id }
            })
            
            const balance = transactions.reduce((sum: number, t: any) => sum + t.amount, 0)
            
            if (balance > 0) {
                const payout = await prisma.saving.create({
                    data: {
                        childId: cid,
                        academicYearId: activeYear.id,
                        date: new Date(),
                        amount: -balance,
                        type: 'payout',
                        note: 'ถอนจบปี / ลาออก',
                        recordedBy: 'system/teacher'
                    }
                })
                summaries.push(payout)
            }
        }

        return NextResponse.json({
            message: 'Payout completed',
            count: summaries.length,
            payouts: summaries
        }, { status: 201 })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
