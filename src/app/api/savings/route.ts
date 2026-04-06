import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { childId, amount, type, note, recordedBy } = body

        if (!childId || amount === undefined || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const activeYear = await prisma.academicYear.findFirst({
            where: { isActive: true }
        })

        if (!activeYear) return NextResponse.json({ error: 'No active academic year' }, { status: 404 })

        const numericChildId = Number(childId)
        const [payoutRecord, balanceResult] = await Promise.all([
            prisma.saving.findFirst({
                where: { childId: numericChildId, academicYearId: activeYear.id, type: 'payout' }
            }),
            prisma.saving.aggregate({
                where: { childId: numericChildId, academicYearId: activeYear.id },
                _sum: { amount: true }
            })
        ])

        if (payoutRecord && type === 'deposit') {
            return NextResponse.json({ error: 'Cannot deposit after payout has been made' }, { status: 400 })
        }

        let finalAmount = Number(amount)
        if (type === 'withdraw' || type === 'payout') {
            finalAmount = -Math.abs(finalAmount)
        } else if (type === 'deposit') {
            finalAmount = Math.abs(finalAmount)
        }

        const currentBalance = balanceResult._sum.amount ?? 0

        if ((type === 'withdraw' || type === 'payout') && currentBalance + finalAmount < 0) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
        }

        const newSaving = await prisma.saving.create({
            data: {
                childId: numericChildId,
                academicYearId: activeYear.id,
                date: new Date(),
                amount: finalAmount,
                type,
                note,
                recordedBy: recordedBy || 'teacher'
            }
        })

        return NextResponse.json({
            transaction: newSaving,
            balance: currentBalance + finalAmount
        }, { status: 201 })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
