// app/api/academic-years/[id]/levels/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const levels = await prisma.classLevel.findMany({
    where: { academicYearId: Number(id) },
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { enrollments: true } },
    },
  })

  return NextResponse.json(levels)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const level = await prisma.classLevel.create({
    data: {
      academicYearId: Number(id),
      code:         body.code,
      name:         body.name,
      minAgeMonths: Number(body.minAgeMonths),
      maxAgeMonths: Number(body.maxAgeMonths),
      color:        body.color ?? '#52B788',
      order:        Number(body.order ?? 0),
    },
  })

  return NextResponse.json(level, { status: 201 })
}