import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const targetYearId = Number(id)
  
  const { sourceYearId } = await req.json()

  if (!sourceYearId) {
    return NextResponse.json({ error: 'sourceYearId is required' }, { status: 400 })
  }

  // Get active enrollments in source year
  const enrollments = await prisma.childEnrollment.findMany({
    where: {
      academicYearId: Number(sourceYearId),
      status: 'active'
    },
    include: {
      level: true
    }
  })

  // Get target year levels
  const targetLevels = await prisma.classLevel.findMany({
    where: { academicYearId: targetYearId }
  })

  let promotedCount = 0
  let graduatedCount = 0

  await prisma.$transaction(async (tx) => {
    for (const enrollment of enrollments) {
      if (enrollment.level.code === 'KG0') {
        const kg1Level = targetLevels.find(l => l.code === 'KG1')
        if (kg1Level) {
          // Check if already enrolled
          const existing = await tx.childEnrollment.findUnique({
            where: {
              childId_academicYearId: {
                childId: enrollment.childId,
                academicYearId: targetYearId
              }
            }
          })

          if (!existing) {
            await tx.childEnrollment.create({
              data: {
                childId: enrollment.childId,
                academicYearId: targetYearId,
                levelId: kg1Level.id,
                status: 'active'
              }
            })
            promotedCount++
          }
        }
      } else if (enrollment.level.code === 'KG1') {
        // Mark as graduated in source year
        await tx.childEnrollment.update({
          where: { id: enrollment.id },
          data: {
            status: 'graduated',
            statusDate: new Date(),
            statusReason: 'จบการศึกษา อ.1'
          }
        })
        graduatedCount++
      }
    }
  })

  return NextResponse.json({
    message: `เลื่อนชั้นสำเร็จ (ขึ้น อ.1 จำนวน ${promotedCount} คน, จบการศึกษา ${graduatedCount} คน)`,
    promotedCount,
    graduatedCount
  })
}
