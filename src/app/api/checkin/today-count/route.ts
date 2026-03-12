// app/api/checkin/today-count/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session.isAuthenticated) {
    return NextResponse.json({ count: 0 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const count = await prisma.checkIn.count({
    where: {
      date: today,
      checkInAt: { not: null },
      checkOutAt: null,
    },
  })

  return NextResponse.json({ count })
}