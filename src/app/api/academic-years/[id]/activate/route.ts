import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const targetYearId = Number(id)

  const oldActiveYear = await prisma.academicYear.findFirst({
    where: { isActive: true }
  })

  await prisma.academicYear.updateMany({ data: { isActive: false } })
  const year = await prisma.academicYear.update({
    where: { id: targetYearId },
    data: { isActive: true },
  })

  let promotedCount = 0
  let graduatedCount = 0

  if (oldActiveYear && oldActiveYear.id !== targetYearId) {
    const enrollments = await prisma.childEnrollment.findMany({
      where: {
        academicYearId: oldActiveYear.id,
        status: 'active'
      },
      include: {
        level: true
      }
    })

    const targetLevels = await prisma.classLevel.findMany({
      where: { academicYearId: targetYearId }
    })

    await prisma.$transaction(async (tx) => {
      for (const enrollment of enrollments) {
        if (enrollment.level.code === 'KG0') {
          const kg1Level = targetLevels.find(l => l.code === 'KG1')
          if (kg1Level) {
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
          await tx.childEnrollment.update({
            where: { id: enrollment.id },
            data: {
              status: 'graduated',
              statusDate: new Date(),
              statusReason: 'จบการศึกษา อ.1 (ระบบปรับอัตโนมัติจากการเปลี่ยนปี)'
            }
          })
          graduatedCount++
        }
      }
    })
  }

  return NextResponse.json({
      ...year,
      promotedCount,
      graduatedCount,
      message: (oldActiveYear && oldActiveYear.id !== targetYearId && (promotedCount > 0 || graduatedCount > 0))
              ? `ตั้งเป็นปัจจุบัน เเละทำการเลื่อนชั้นเด็กขึ้น อ.1 อัตโนมัติ ${promotedCount} คน และจัดเด็ก อ.1 จบศึกษา ${graduatedCount} คน`
              : 'ตั้งปีการศึกษาปัจจุบันสำเร็จ'
  })
}