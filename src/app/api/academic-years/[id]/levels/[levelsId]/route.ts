// app/api/academic-years/[id]/levels/[levelsId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; levelsId: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { levelsId } = await params
  const body = await req.json()

  const level = await prisma.classLevel.update({
    where: { id: Number(levelsId) },
    data: {
      name:         body.name,
      minAgeMonths: body.minAgeMonths !== undefined ? Number(body.minAgeMonths) : undefined,
      maxAgeMonths: body.maxAgeMonths !== undefined ? Number(body.maxAgeMonths) : undefined,
      color:        body.color,
      order:        body.order !== undefined ? Number(body.order) : undefined,
    },
  })

  return NextResponse.json(level)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; levelsId: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { levelsId } = await params

  // ตรวจสอบว่ามีเด็กในชั้นนี้ไหม
  const count = await prisma.childEnrollment.count({
    where: { levelId: Number(levelsId) },
  })

  if (count > 0) {
    return NextResponse.json(
      { message: `ไม่สามารถลบได้ มีเด็ก ${count} คนในชั้นนี้` },
      { status: 400 }
    )
  }

  await prisma.classLevel.delete({ where: { id: Number(levelsId) } })
  return NextResponse.json({ success: true })
}