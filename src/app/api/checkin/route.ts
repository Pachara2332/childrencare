// app/api/checkin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json([], { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  const records = await prisma.checkIn.findMany({
    where: { date },
    include: { child: true },
    orderBy: { checkInAt: 'desc' },
  })

  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  // Allow both authenticated (teacher manual) and unauthenticated (parent QR)
  const { childId, type, date: dateStr, method = 'manual', note } = await req.json()

  if (!childId || !type) {
    return NextResponse.json({ message: 'ข้อมูลไม่ครบ' }, { status: 400 })
  }

  const date = new Date(dateStr ?? new Date().toISOString().split('T')[0])
  date.setHours(0, 0, 0, 0)

  const now = new Date()

  try {
    const existing = await prisma.checkIn.findUnique({
      where: { childId_date: { childId: Number(childId), date } },
    })

    if (type === 'in') {
      if (existing?.checkInAt) {
        return NextResponse.json({ message: 'เช็กชื่อเข้าแล้ว' }, { status: 400 })
      }
      const record = await prisma.checkIn.upsert({
        where: { childId_date: { childId: Number(childId), date } },
        update: { checkInAt: now, method, note },
        create: { childId: Number(childId), date, checkInAt: now, method, note },
        include: { child: true },
      })
      return NextResponse.json(record)
    } else {
      if (!existing?.checkInAt) {
        return NextResponse.json({ message: 'ยังไม่ได้เช็กชื่อเข้า' }, { status: 400 })
      }
      if (existing.checkOutAt) {
        return NextResponse.json({ message: 'เช็กชื่อออกแล้ว' }, { status: 400 })
      }
      const record = await prisma.checkIn.update({
        where: { childId_date: { childId: Number(childId), date } },
        data: { checkOutAt: now, note },
        include: { child: true },
      })
      return NextResponse.json(record)
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}