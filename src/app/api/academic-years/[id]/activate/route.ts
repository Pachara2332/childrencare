// app/api/academic-years/[id]/activate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await prisma.academicYear.updateMany({ data: { isActive: false } })
  const year = await prisma.academicYear.update({
    where: { id: Number(id) },
    data: { isActive: true },
  })

  return NextResponse.json(year)
}