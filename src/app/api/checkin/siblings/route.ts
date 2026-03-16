// app/api/checkin/siblings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/checkin/siblings?childId=X&date=YYYY-MM-DD
// Returns siblings (same guardianPhone) with their check-in status for the date
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId = Number(searchParams.get('childId'))
  const dateStr = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  if (!childId) {
    return NextResponse.json([], { status: 400 })
  }

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  // Find the child to get their guardianPhone
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { guardianPhone: true, parentPhone: true },
  })

  if (!child) {
    return NextResponse.json([])
  }

  // Use guardianPhone if set, otherwise fall back to parentPhone
  const phone = child.guardianPhone || child.parentPhone
  if (!phone) {
    return NextResponse.json([])
  }

  // Find siblings (other children with same phone, excluding the current child)
  const siblings = await prisma.child.findMany({
    where: {
      id: { not: childId },
      OR: [
        { guardianPhone: phone },
        { parentPhone: phone },
      ],
    },
    select: {
      id: true,
      nickname: true,
      firstName: true,
      lastName: true,
      gender: true,
    },
  })

  if (siblings.length === 0) {
    return NextResponse.json([])
  }

  // Get check-in records for siblings on this date
  const siblingIds = siblings.map(s => s.id)
  const checkIns = await prisma.checkIn.findMany({
    where: {
      childId: { in: siblingIds },
      date,
    },
    select: {
      childId: true,
      checkInAt: true,
      checkOutAt: true,
    },
  })

  // Only return siblings that are NOT yet checked in (pending)
  const checkInMap = new Map(checkIns.map(c => [c.childId, c]))
  const pendingSiblings = siblings
    .filter(s => {
      const rec = checkInMap.get(s.id)
      return !rec?.checkInAt // not checked in yet
    })
    .map(s => ({
      ...s,
      checkIn: checkInMap.get(s.id) || null,
    }))

  return NextResponse.json(pendingSiblings)
}
