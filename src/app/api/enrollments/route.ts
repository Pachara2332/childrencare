// app/api/enrollments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// เพิ่ม/แก้ enrollment
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { childId, academicYearId, levelId, status, note } = await req.json()

  const enrollment = await prisma.childEnrollment.upsert({
    where: { childId_academicYearId: { childId: Number(childId), academicYearId: Number(academicYearId) } },
    update: { levelId: Number(levelId), status: status ?? 'active', note },
    create: {
      childId:       Number(childId),
      academicYearId: Number(academicYearId),
      levelId:       Number(levelId),
      status:        status ?? 'active',
      note,
    },
    include: { level: true, academicYear: true },
  })

  return NextResponse.json(enrollment)
}

// ดึง enrollments ของปีนั้น พร้อมข้อมูลเด็กและระดับชั้น
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json([], { status: 401 })

  const { searchParams } = new URL(req.url)
  const yearId  = searchParams.get('yearId')
  const levelId = searchParams.get('levelId')

  const enrollments = await prisma.childEnrollment.findMany({
    where: {
      ...(yearId  && { academicYearId: Number(yearId) }),
      ...(levelId && { levelId: Number(levelId) }),
      status: 'active',
    },
    include: {
      child: true,
      level: true,
      academicYear: true,
    },
    orderBy: { child: { nickname: 'asc' } },
  })

  return NextResponse.json(enrollments)
}