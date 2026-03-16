import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const activeYear = await prisma.academicYear.findFirst({
            where: { isActive: true }
        })

        if (!activeYear) {
            return NextResponse.json({ error: 'No active academic year found' }, { status: 404 })
        }

        const enrollments = await prisma.childEnrollment.findMany({
            where: { academicYearId: activeYear.id, status: { not: 'leave' } },
            include: {
                child: {
                    include: {
                        savings: {
                            where: { academicYearId: activeYear.id }
                        }
                    }
                },
                level: true
            }
        })

        let totalAll = 0
        const classMap = new Map<number, any>()

        for (const en of enrollments) {
            const childTotal = en.child.savings.reduce((sum: number, s: any) => sum + s.amount, 0)
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

        return NextResponse.json({ totalAll, byClass: byClass.map(({ order, ...rest }) => rest) })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
