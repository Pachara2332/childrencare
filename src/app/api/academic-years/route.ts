// app/api/academic-years/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const years = await prisma.academicYear.findMany({
    orderBy: { year: 'desc' },
    include: {
      classLevels: { orderBy: { order: 'asc' } },
      _count: { select: { enrollments: true } },
    },
  })
  return NextResponse.json(years)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { year, name, startDate, endDate, isActive, autoCreateLevels } =
    await req.json()

  if (isActive) {
    await prisma.academicYear.updateMany({ data: { isActive: false } })
  }

  // Default levels ที่จะสร้างอัตโนมัติ
  const defaultLevels = [
    { code: 'KG0', name: 'เตรียมอนุบาล', minAgeMonths: 24, maxAgeMonths: 35, color: '#F4A261', order: 0 },
    { code: 'KG1', name: 'อนุบาล 1',     minAgeMonths: 36, maxAgeMonths: 47, color: '#52B788', order: 1 },
    { code: 'KG2', name: 'อนุบาล 2',     minAgeMonths: 48, maxAgeMonths: 59, color: '#457B9D', order: 2 },
    { code: 'KG3', name: 'อนุบาล 3',     minAgeMonths: 60, maxAgeMonths: 83, color: '#E76F51', order: 3 },
  ]

  const academicYear = await prisma.academicYear.create({
    data: {
      year, name,
      startDate: new Date(startDate),
      endDate:   new Date(endDate),
      isActive:  isActive ?? false,
      ...(autoCreateLevels !== false && {
        classLevels: { create: defaultLevels },
      }),
    },
    include: { classLevels: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json(academicYear, { status: 201 })
}