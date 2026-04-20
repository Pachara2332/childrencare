import { randomUUID } from 'crypto'
import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { enrollmentApplicationSchema } from '@/lib/enrollmentApplications'
import {
  APPLICATION_DOCUMENTS,
  APPLICATION_DOCUMENT_MIME_TYPES,
  getApplicationDocumentLabel,
  type ApplicationDocumentType,
} from '@/lib/applicationDocuments'

export const dynamic = 'force-dynamic'

const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024

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

function getValidationMessage(error: string) {
  return error || 'กรุณาตรวจสอบข้อมูลใบสมัครอีกครั้ง'
}

type ParsedDocumentUpload = {
  type: ApplicationDocumentType
  file: File
}

function getUploadFieldName(type: ApplicationDocumentType) {
  return `documents.${type}`
}

function isMultipartRequest(req: NextRequest) {
  return req.headers.get('content-type')?.includes('multipart/form-data') ?? false
}

function normalizeFormValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : ''
}

function sanitizeFileName(fileName: string, fallbackExtension: string) {
  const originalExtension = path.extname(fileName).toLowerCase()
  const extension = originalExtension || fallbackExtension
  const basename = path
    .basename(fileName, originalExtension)
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

  return `${Date.now()}-${randomUUID().slice(0, 8)}-${basename || 'document'}${extension}`
}

function extensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    case 'application/pdf':
      return '.pdf'
    default:
      return '.jpg'
  }
}

function validateDocumentFile(file: File, type: ApplicationDocumentType) {
  if (!APPLICATION_DOCUMENT_MIME_TYPES.has(file.type)) {
    throw new Error(`INVALID_FILE_TYPE:${type}`)
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    throw new Error(`FILE_TOO_LARGE:${type}`)
  }
}

async function parseSubmission(req: NextRequest) {
  if (!isMultipartRequest(req)) {
    return {
      rawData: await req.json(),
      documents: [] as ParsedDocumentUpload[],
    }
  }

  const formData = await req.formData()
  const rawData = {
    academicYearId: normalizeFormValue(formData.get('academicYearId')),
    levelId: normalizeFormValue(formData.get('levelId')),
    firstName: normalizeFormValue(formData.get('firstName')),
    lastName: normalizeFormValue(formData.get('lastName')),
    nickname: normalizeFormValue(formData.get('nickname')),
    gender: normalizeFormValue(formData.get('gender')),
    dateOfBirth: normalizeFormValue(formData.get('dateOfBirth')),
    bloodType: normalizeFormValue(formData.get('bloodType')),
    disease: normalizeFormValue(formData.get('disease')),
    allergy: normalizeFormValue(formData.get('allergy')),
    parentName: normalizeFormValue(formData.get('parentName')),
    parentPhone: normalizeFormValue(formData.get('parentPhone')),
    parentPhone2: normalizeFormValue(formData.get('parentPhone2')),
    parentRelation: normalizeFormValue(formData.get('parentRelation')),
    address: normalizeFormValue(formData.get('address')),
    note: normalizeFormValue(formData.get('note')),
  }

  const documents: ParsedDocumentUpload[] = []

  for (const definition of APPLICATION_DOCUMENTS) {
    const files = formData
      .getAll(getUploadFieldName(definition.type))
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)

    if (files.length > definition.maxFiles) {
      throw new Error(`TOO_MANY_FILES:${definition.type}`)
    }

    for (const file of files) {
      validateDocumentFile(file, definition.type)
      documents.push({ type: definition.type, file })
    }
  }

  return { rawData, documents }
}

function validateRequiredDocuments(documents: ParsedDocumentUpload[]) {
  const counts = documents.reduce<Record<string, number>>((result, item) => {
    result[item.type] = (result[item.type] ?? 0) + 1
    return result
  }, {})

  const missing = APPLICATION_DOCUMENTS.find(
    (definition) => definition.required && (counts[definition.type] ?? 0) === 0
  )

  return missing ? `กรุณาแนบเอกสาร: ${missing.label}` : null
}

async function saveDocuments(referenceNo: string, documents: ParsedDocumentUpload[]) {
  const uploadDirectory = path.join(
    process.cwd(),
    'public',
    'uploads',
    'applications',
    referenceNo
  )

  await mkdir(uploadDirectory, { recursive: true })

  const savedFiles: string[] = []
  const storedDocuments: Prisma.EnrollmentApplicationDocumentCreateManyInput[] = []

  for (const document of documents) {
    const savedFileName = sanitizeFileName(
      document.file.name,
      extensionFromMimeType(document.file.type)
    )
    const targetPath = path.join(uploadDirectory, savedFileName)
    const bytes = Buffer.from(await document.file.arrayBuffer())

    await writeFile(targetPath, bytes)
    savedFiles.push(targetPath)
    storedDocuments.push({
      type: document.type,
      fileName: document.file.name,
      mimeType: document.file.type,
      fileSize: document.file.size,
      url: `/uploads/applications/${referenceNo}/${savedFileName}`,
    })
  }

  return { savedFiles, storedDocuments }
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
  let createdApplicationId: number | null = null
  let savedFiles: string[] = []

  try {
    const { rawData, documents } = await parseSubmission(req)
    const payload = enrollmentApplicationSchema.safeParse(rawData)

    if (!payload.success) {
      const firstError = payload.error.issues[0]?.message
      return NextResponse.json(
        { message: getValidationMessage(firstError) },
        { status: 400 }
      )
    }

    const requiredDocumentsMessage = validateRequiredDocuments(documents)
    if (requiredDocumentsMessage) {
      return NextResponse.json({ message: requiredDocumentsMessage }, { status: 400 })
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

    createdApplicationId = application.id

    const saved = await saveDocuments(application.referenceNo, documents)
    savedFiles = saved.savedFiles

    if (saved.storedDocuments.length > 0) {
      await prisma.enrollmentApplicationDocument.createMany({
        data: saved.storedDocuments.map((item) => ({
          ...item,
          applicationId: application.id,
        })),
      })
    }

    const createdApplication = await prisma.enrollmentApplication.findUnique({
      where: { id: application.id },
      include: applicationInclude,
    })

    return NextResponse.json(
      {
        message: 'ส่งใบสมัครเรียบร้อยแล้ว',
        referenceNo: application.referenceNo,
        application: createdApplication,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith('TOO_MANY_FILES:')) {
        const type = error.message.split(':')[1]
        const document = APPLICATION_DOCUMENTS.find((item) => item.type === type)
        return NextResponse.json(
          { message: `แนบไฟล์ ${document?.label ?? type} ได้ไม่เกิน ${document?.maxFiles ?? 1} ไฟล์` },
          { status: 400 }
        )
      }

      if (error.message.startsWith('INVALID_FILE_TYPE:')) {
        const type = error.message.split(':')[1]
        return NextResponse.json(
          { message: `ไฟล์ ${getApplicationDocumentLabel(type)} ต้องเป็น JPG, PNG, WEBP หรือ PDF เท่านั้น` },
          { status: 400 }
        )
      }

      if (error.message.startsWith('FILE_TOO_LARGE:')) {
        const type = error.message.split(':')[1]
        return NextResponse.json(
          { message: `ไฟล์ ${getApplicationDocumentLabel(type)} ต้องมีขนาดไม่เกิน 10 MB ต่อไฟล์` },
          { status: 400 }
        )
      }
    }

    if (createdApplicationId) {
      await prisma.enrollmentApplication.delete({
        where: { id: createdApplicationId },
      }).catch(() => null)
    }

    await Promise.all(savedFiles.map((filePath) => unlink(filePath).catch(() => null)))

    console.error(error)
    return NextResponse.json(
      { message: 'ไม่สามารถส่งใบสมัครได้ในขณะนี้' },
      { status: 500 }
    )
  }
}
