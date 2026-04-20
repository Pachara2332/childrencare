import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()
  const { childId, startDate, endDate, reasonType, reasonDetail, requestedBy } = data

  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } })
  if (!activeYear) return NextResponse.json({ error: 'No active academic year' }, { status: 400 })

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      childId: Number(childId),
      academicYearId: activeYear.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reasonType,
      reasonDetail,
      requestedBy: requestedBy || 'parent',
      status: 'pending'
    }
  })

  return NextResponse.json(leaveRequest)
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } })
  if (!activeYear) return NextResponse.json([])

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: { academicYearId: activeYear.id },
    include: { child: true },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(leaveRequests)
}
