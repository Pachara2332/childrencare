// app/api/children/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

function generateCode(seq: number): string {
  return `KD${String(seq).padStart(3, '0')}`
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const yearId = searchParams.get('yearId')

  const where = yearId
    ? { enrollments: { some: { academicYearId: Number(yearId) } } }
    : {}

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
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      firstName, lastName, nickname, gender, dateOfBirth,
      bloodType, disease, allergy,
      parentName, parentPhone, parentPhone2, parentRelation, address,
      academicYearId, levelId
    } = body

    if (!firstName || !lastName || !nickname || !gender || !dateOfBirth || !parentName || !parentPhone) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ' }, { status: 400 })
    }

    // Generate code
    const count = await prisma.child.count()
    const code = generateCode(count + 1)

    const child = await prisma.child.create({
      data: {
        code,
        firstName, lastName, nickname, gender,
        dateOfBirth: new Date(dateOfBirth),
        bloodType: bloodType || null,
        disease: disease || null,
        allergy: allergy || null,
        parentName, parentPhone,
        parentPhone2: parentPhone2 || null,
        parentRelation, address: address || null,
        enrollments: (academicYearId && levelId) ? {
          create: { 
            academicYearId: Number(academicYearId),
            levelId: Number(levelId)
          }
        } : undefined,
      },
      include: { enrollments: true },
    })

    return NextResponse.json(child, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการบันทึก' }, { status: 500 })
  }
}