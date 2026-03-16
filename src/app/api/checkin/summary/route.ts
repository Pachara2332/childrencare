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

  // Get all active enrolled children
  const enrolledChildren = await prisma.child.findMany({
    where: {
      enrollments: {
        some: { academicYearId: activeYear.id, status: 'active' },
      },
    },
    select: {
      id: true,
      nickname: true,
      firstName: true,
      gender: true,
      enrollments: {
        where: { academicYearId: activeYear.id, status: 'active' },
        include: { level: true },
        take: 1,
      },
    },
  })

  // Get today's check-ins
  const checkIns = await prisma.checkIn.findMany({
    where: { date },
    select: {
      childId: true,
      checkInAt: true,
      checkOutAt: true,
      isAbsent: true,
    },
  })

  const checkInMap = new Map(checkIns.map(c => [c.childId, c]))

  const present = checkIns.filter(c => c.checkInAt && !c.checkOutAt).length
  const checkedOut = checkIns.filter(c => c.checkOutAt).length
  const absent = checkIns.filter(c => c.isAbsent && !c.checkInAt).length
  const handledIds = new Set(checkIns.filter(c => c.checkInAt || c.isAbsent).map(c => c.childId))

  const uncheckedChildren = enrolledChildren
    .filter(c => !handledIds.has(c.id))
    .map(c => ({
      id: c.id,
      nickname: c.nickname,
      firstName: c.firstName,
      gender: c.gender,
      levelCode: c.enrollments[0]?.level?.code ?? null,
      levelColor: c.enrollments[0]?.level?.color ?? null,
    }))

  return NextResponse.json({
    present,
    checkedOut,
    absent,
    unchecked: uncheckedChildren.length,
    total: enrolledChildren.length,
    uncheckedChildren,
  })
}
