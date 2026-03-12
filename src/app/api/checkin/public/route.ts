// app/api/checkin/public/route.ts — no auth required (parent page)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  const records = await prisma.checkIn.findMany({
    where: { date },
    select: { childId: true, checkInAt: true, checkOutAt: true },
  })

  return NextResponse.json(records)
}