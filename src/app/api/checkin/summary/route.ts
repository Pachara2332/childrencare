// app/api/checkin/summary/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/checkin/summary?date=YYYY-MM-DD
// Returns: { present, checkedOut, unchecked, total, uncheckedChildren }
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  })

  if (!activeYear) {
    return NextResponse.json({ present: 0, checkedOut: 0, unchecked: 0, total: 0, uncheckedChildren: [] })
  }

  const [enrollments, checkIns] = await Promise.all([
    prisma.childEnrollment.findMany({
      where: {
        academicYearId: activeYear.id,
        status: 'active',
      },
      select: {
        childId: true,
        child: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            gender: true,
          },
        },
        level: {
          select: {
            code: true,
            color: true,
          },
        },
      },
    }),
    prisma.checkIn.findMany({
      where: { date },
      select: {
        childId: true,
        checkInAt: true,
        checkOutAt: true,
        isAbsent: true,
      },
    }),
  ])

  let present = 0
  let checkedOut = 0
  let absent = 0
  const handledIds = new Set<number>()

  for (const checkIn of checkIns) {
    if (checkIn.checkOutAt) checkedOut += 1
    if (checkIn.checkInAt && !checkIn.checkOutAt) present += 1
    if (checkIn.isAbsent && !checkIn.checkInAt) absent += 1
    if (checkIn.checkInAt || checkIn.isAbsent) handledIds.add(checkIn.childId)
  }

  const uncheckedChildren = enrollments
    .filter((enrollment) => !handledIds.has(enrollment.childId))
    .map((enrollment) => ({
      id: enrollment.child.id,
      nickname: enrollment.child.nickname,
      firstName: enrollment.child.firstName,
      gender: enrollment.child.gender,
      levelCode: enrollment.level.code,
      levelColor: enrollment.level.color,
    }))

  return NextResponse.json({
    present,
    checkedOut,
    absent,
    unchecked: uncheckedChildren.length,
    total: enrollments.length,
    uncheckedChildren,
  })
}
