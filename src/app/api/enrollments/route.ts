import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { normalizeEnrollmentStatus } from '@/lib/enrollmentStatus'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    childId,
    academicYearId,
    levelId,
    status,
    note,
    statusDate,
    statusReason,
  } = await req.json()

  const normalizedStatus =
    normalizeEnrollmentStatus(typeof status === 'string' ? status : 'active') === 'all'
      ? 'active'
      : normalizeEnrollmentStatus(typeof status === 'string' ? status : 'active')
  const trimmedReason = typeof statusReason === 'string' ? statusReason.trim() : ''

  if (normalizedStatus !== 'active' && !trimmedReason) {
    return NextResponse.json(
      { message: 'statusReason is required for leave or graduated status' },
      { status: 400 }
    )
  }

  if (normalizedStatus !== 'active' && !statusDate) {
    return NextResponse.json(
      { message: 'statusDate is required for leave or graduated status' },
      { status: 400 }
    )
  }

  const enrollment = await prisma.childEnrollment.upsert({
    where: {
      childId_academicYearId: {
        childId: Number(childId),
        academicYearId: Number(academicYearId),
      },
    },
    update: {
      levelId: Number(levelId),
      status: normalizedStatus,
      note,
      statusDate:
        normalizedStatus === 'active'
          ? null
          : statusDate
            ? new Date(statusDate)
            : new Date(),
      statusReason: normalizedStatus === 'active' ? null : trimmedReason,
    },
    create: {
      childId: Number(childId),
      academicYearId: Number(academicYearId),
      levelId: Number(levelId),
      status: normalizedStatus,
      note,
      statusDate:
        normalizedStatus === 'active'
          ? null
          : statusDate
            ? new Date(statusDate)
            : new Date(),
      statusReason: normalizedStatus === 'active' ? null : trimmedReason,
    },
    include: {
      child: true,
      level: true,
      academicYear: true,
    },
  })

  return NextResponse.json(enrollment)
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) {
    return NextResponse.json([], { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const yearId = searchParams.get('yearId')
  const levelId = searchParams.get('levelId')
  const status = searchParams.has('status')
    ? normalizeEnrollmentStatus(searchParams.get('status'))
    : 'active'

  const enrollments = await prisma.childEnrollment.findMany({
    where: {
      ...(yearId && { academicYearId: Number(yearId) }),
      ...(levelId && { levelId: Number(levelId) }),
      ...(status !== 'all' && { status }),
    },
    include: {
      child: true,
      level: true,
      academicYear: true,
    },
    orderBy: [{ enrolledAt: 'desc' }, { child: { nickname: 'asc' } }],
  })

  return NextResponse.json(enrollments)
}
