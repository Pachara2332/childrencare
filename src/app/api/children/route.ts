// app/api/children/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createChildRecord } from '@/lib/childRecords'
import { normalizeEnrollmentStatus } from '@/lib/enrollmentStatus'
import { getEffectiveAcademicYearId } from '@/lib/activeEnrollment'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const yearId = searchParams.get('yearId')
  const lite = searchParams.get('lite') === '1'
  const requestedStatus = searchParams.has('status')
    ? normalizeEnrollmentStatus(searchParams.get('status'))
    : lite
      ? 'active'
      : 'all'
  const effectiveYearId =
    requestedStatus !== 'all'
      ? await getEffectiveAcademicYearId(prisma, yearId ? Number(yearId) : null)
      : yearId
        ? Number(yearId)
        : null

  const where = effectiveYearId
    ? {
        enrollments: {
          some: {
            academicYearId: effectiveYearId,
            ...(requestedStatus !== 'all' && { status: requestedStatus }),
          },
        },
      }
    : requestedStatus !== 'all'
      ? { id: -1 }
      : {}

  if (lite) {
    const children = await prisma.child.findMany({
      where,
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        nickname: true,
        gender: true,
        qrToken: true,
        disease: true,
        parentName: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(children)
  }

  const children = await prisma.child.findMany({
    where,
    include: {
      enrollments: {
        include: { academicYear: true },
        orderBy: { enrolledAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(children)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      firstName,
      lastName,
      nickname,
      gender,
      dateOfBirth,
      bloodType,
      disease,
      allergy,
      parentName,
      parentPhone,
      parentPhone2,
      parentRelation,
      address,
      academicYearId,
      levelId,
    } = body

    if (
      !firstName ||
      !lastName ||
      !nickname ||
      !gender ||
      !dateOfBirth ||
      !parentName ||
      !parentPhone
    ) {
      return NextResponse.json(
        { message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ' },
        { status: 400 }
      )
    }

    const child = await prisma.$transaction((tx) =>
      createChildRecord(tx, {
        firstName,
        lastName,
        nickname,
        gender,
        dateOfBirth,
        bloodType,
        disease,
        allergy,
        parentName,
        parentPhone,
        parentPhone2,
        parentRelation,
        address,
        academicYearId: academicYearId ? Number(academicYearId) : null,
        levelId: levelId ? Number(levelId) : null,
      })
    )

    return NextResponse.json(child, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการบันทึก' },
      { status: 500 }
    )
  }
}
