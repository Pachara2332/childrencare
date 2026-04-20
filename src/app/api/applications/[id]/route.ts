import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createChildRecord, findDuplicateChild } from '@/lib/childRecords'
import { enrollmentApplicationActionSchema } from '@/lib/enrollmentApplications'
import { APPLICATION_DOCUMENTS } from '@/lib/applicationDocuments'

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
  documents: {
    orderBy: [{ createdAt: 'asc' }],
  },
} satisfies Prisma.EnrollmentApplicationInclude

type RouteParams = { params: Promise<{ id: string }> }

function validationMessage(message: string) {
  return message || 'ไม่สามารถประมวลผลคำขอได้'
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getSession()
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = enrollmentApplicationActionSchema.safeParse(await req.json())
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message
    return NextResponse.json(
      { message: validationMessage(firstError) },
      { status: 400 }
    )
  }

  const { id } = await params
  const applicationId = Number(id)

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json({ message: 'รหัสใบสมัครไม่ถูกต้อง' }, { status: 400 })
  }

  const { action, reviewNote } = parsed.data

  try {
    const existing = await prisma.enrollmentApplication.findUnique({
      where: { id: applicationId },
      include: applicationInclude,
    })

    if (!existing) {
      return NextResponse.json({ message: 'ไม่พบใบสมัครนี้' }, { status: 404 })
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { message: 'ใบสมัครนี้ถูกดำเนินการแล้ว' },
        { status: 409 }
      )
    }

    if (action === 'reject') {
      const rejected = await prisma.enrollmentApplication.update({
        where: { id: applicationId },
        data: {
          status: 'rejected',
          reviewNote: reviewNote ?? null,
          reviewedAt: new Date(),
        },
        include: applicationInclude,
      })

      return NextResponse.json({
        message: 'ปฏิเสธใบสมัครเรียบร้อยแล้ว',
        application: rejected,
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.enrollmentApplication.findUnique({
        where: { id: applicationId },
        include: {
          documents: true,
        },
      })

      if (!application) {
        throw new Error('APPLICATION_NOT_FOUND')
      }

      if (application.status !== 'pending') {
        throw new Error('APPLICATION_ALREADY_REVIEWED')
      }

      const duplicateChild = await findDuplicateChild(tx, {
        firstName: application.firstName,
        lastName: application.lastName,
        dateOfBirth: application.dateOfBirth.toISOString().slice(0, 10),
        parentPhone: application.parentPhone,
      })

      if (duplicateChild) {
        throw new Error(`DUPLICATE_CHILD:${duplicateChild.code}`)
      }

      const child = await createChildRecord(tx, {
        firstName: application.firstName,
        lastName: application.lastName,
        nickname: application.nickname,
        gender: application.gender,
        dateOfBirth: application.dateOfBirth.toISOString().slice(0, 10),
        bloodType: application.bloodType,
        disease: application.disease,
        allergy: application.allergy,
        parentName: application.parentName,
        parentPhone: application.parentPhone,
        parentPhone2: application.parentPhone2,
        parentRelation: application.parentRelation,
        address: application.address,
        academicYearId: application.academicYearId,
        levelId: application.levelId,
      })

      if (application.documents.length > 0) {
        await tx.childDocument.createMany({
          data: application.documents.map((document) => ({
            childId: child.id,
            type:
              APPLICATION_DOCUMENTS.find((item) => item.type === document.type)?.childDocumentType ??
              'other',
            url: document.url,
          })),
        })
      }

      const updatedApplication = await tx.enrollmentApplication.update({
        where: { id: applicationId },
        data: {
          status: 'approved',
          reviewNote: reviewNote ?? null,
          reviewedAt: new Date(),
          approvedChildId: child.id,
        },
        include: applicationInclude,
      })

      return { child, application: updatedApplication }
    })

    return NextResponse.json({
      message: 'อนุมัติใบสมัครและสร้างข้อมูลนักเรียนเรียบร้อยแล้ว',
      ...result,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'APPLICATION_NOT_FOUND') {
        return NextResponse.json({ message: 'ไม่พบใบสมัครนี้' }, { status: 404 })
      }

      if (error.message === 'APPLICATION_ALREADY_REVIEWED') {
        return NextResponse.json(
          { message: 'ใบสมัครนี้ถูกดำเนินการแล้ว' },
          { status: 409 }
        )
      }

      if (error.message.startsWith('DUPLICATE_CHILD:')) {
        const childCode = error.message.split(':')[1]
        return NextResponse.json(
          {
            message: `พบข้อมูลนักเรียนซ้ำในระบบแล้ว (${childCode}) กรุณาตรวจสอบก่อนอนุมัติ`,
          },
          { status: 409 }
        )
      }
    }

    console.error(error)
    return NextResponse.json(
      { message: 'ไม่สามารถอัปเดตสถานะใบสมัครได้' },
      { status: 500 }
    )
  }
}
