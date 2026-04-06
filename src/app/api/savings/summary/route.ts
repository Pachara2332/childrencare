import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type ClassSummary = {
    levelId: number
    name: string
    color: string
    order: number
    total: number
    children: {
        childId: number
        code: string
        nickname: string
        firstName: string
        lastName: string
        balance: number
    }[]
}

export async function GET() {
    try {
        const activeYear = await prisma.academicYear.findFirst({
            where: { isActive: true }
        })

        if (!activeYear) {
            return NextResponse.json({ error: 'No active academic year found' }, { status: 404 })
        }

        const [enrollments, balances] = await Promise.all([
            prisma.childEnrollment.findMany({
                where: { academicYearId: activeYear.id, status: { not: 'leave' } },
                select: {
                    childId: true,
                    levelId: true,
                    child: {
                        select: {
                            code: true,
                            nickname: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    level: {
                        select: {
                            name: true,
                            color: true,
                            order: true,
                        }
                    }
                }
            }),
            prisma.saving.groupBy({
                by: ['childId'],
                where: { academicYearId: activeYear.id },
                _sum: {
                    amount: true
                }
            })
        ])

        const balanceMap = new Map<number, number>(
            balances.map((item) => [item.childId, item._sum.amount ?? 0])
        )

        let totalAll = 0
        const classMap = new Map<number, ClassSummary>()

        for (const en of enrollments) {
            const childTotal = balanceMap.get(en.childId) ?? 0
            totalAll += childTotal

            if (!classMap.has(en.levelId)) {
                classMap.set(en.levelId, {
                    levelId: en.levelId,
                    name: en.level.name,
                    color: en.level.color,
                    order: en.level.order,
                    total: 0,
                    children: []
                })
            }

            const c = classMap.get(en.levelId)!
            c.total += childTotal
            c.children.push({
                childId: en.childId,
                code: en.child.code,
                nickname: en.child.nickname,
                firstName: en.child.firstName,
                lastName: en.child.lastName,
                balance: childTotal
            })
        }

        const byClass = Array.from(classMap.values()).sort((a, b) => a.order - b.order)

        return NextResponse.json({
            totalAll,
            byClass: byClass.map((item) => ({
                levelId: item.levelId,
                name: item.name,
                color: item.color,
                total: item.total,
                children: item.children,
            }))
        })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
