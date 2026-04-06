import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { enrollmentApplicationSchema } from '@/lib/enrollmentApplications'

export const dynamic = 'force-dynamic'

const applicationInclude = {
  academicYear: {
    select: {
      id: true,
      year: true,
      name: true,
      isActive: true,
    },
  },
  level: {
    select: {
      id: true,
      code: true,
      name: true,
      color: true,
    },
  },
} satisfies Prisma.EnrollmentApplicationInclude

function getValidationMessage(error: string) {
  return error || 'กรุณาตรวจสอบข้อมูลใบสมัครอีกครั้ง'
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const yearId = searchParams.get('yearId')
  const status = searchParams.get('status')

  const applications = await prisma.enrollmentApplication.findMany({
    where: {
      ...(yearId ? { academicYearId: Number(yearId) } : {}),
      ...(status && status !== 'all' ? { status } : {}),
    },
    include: applicationInclude,
    orderBy: [{ createdAt: 'desc' }],
  })

  return NextResponse.json(applications)
}

export async function POST(req: NextRequest) {
  try {
    const payload = enrollmentApplicationSchema.safeParse(await req.json())

    if (!payload.success) {
      const firstError = payload.error.issues[0]?.message
      return NextResponse.json(
        { message: getValidationMessage(firstError) },
        { status: 400 }
      )
    }

    const data = payload.data

    const targetLevel = await prisma.classLevel.findFirst({
      where: {
        id: data.levelId,
        academicYearId: data.academicYearId,
      },
      select: {
        id: true,
        name: true,
        academicYear: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    })

    if (!targetLevel) {
      return NextResponse.json(
        { message: 'ไม่พบปีการศึกษาหรือระดับชั้นที่เลือก' },
        { status: 400 }
      )
    }

    const duplicatePending = await prisma.enrollmentApplication.findFirst({
      where: {
        status: 'pending',
        academicYearId: data.academicYearId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        parentPhone: data.parentPhone,
      },
      select: {
        referenceNo: true,
      },
    })

    if (duplicatePending) {
      return NextResponse.json(
        {
          message: 'มีใบสมัครรอพิจารณาอยู่แล้วสำหรับข้อมูลนี้',
          referenceNo: duplicatePending.referenceNo,
        },
        { status: 409 }
      )
    }

    const application = await prisma.enrollmentApplication.create({
      data: {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
      },
      include: applicationInclude,
    })

    return NextResponse.json(
      {
        message: 'ส่งใบสมัครเรียบร้อยแล้ว',
        referenceNo: application.referenceNo,
        application,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'ไม่สามารถส่งใบสมัครได้ในขณะนี้' },
      { status: 500 }
    )
  }
}
