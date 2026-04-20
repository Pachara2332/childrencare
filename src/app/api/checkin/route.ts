// app/api/checkin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { ensureChildActiveForAcademicYear } from '@/lib/activeEnrollment'
import { pushMessage } from '@/lib/line'

export const dynamic = 'force-dynamic'

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
  const {
    childId,
    type, // 'in' | 'out' | 'absent'
    date: dateStr,
    method = 'manual',
    note,
    pickupName,
    pickupRelation,
  } = await req.json()

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

    const activeCheck = await ensureChildActiveForAcademicYear(prisma, Number(childId))

    if (!activeCheck.ok && !(type === 'out' && existing?.checkInAt)) {
      return NextResponse.json({ message: 'นักเรียนไม่ได้อยู่ในสถานะกำลังเรียน' }, { status: 400 })
    }

    if (type === 'absent') {
      if (existing?.checkInAt) {
        return NextResponse.json({ message: 'เด็กเช็กชื่อเข้าแล้ว ไม่สามารถแจ้งลาได้' }, { status: 400 })
      }
      const record = await prisma.checkIn.upsert({
        where: { childId_date: { childId: Number(childId), date } },
        update: { isAbsent: true, absenceReason: note },
        create: { childId: Number(childId), date, isAbsent: true, absenceReason: note, method },
        include: { child: true },
      })
      return NextResponse.json(record)
    }

    if (type === 'in') {
      if (existing?.checkInAt) {
        return NextResponse.json({ message: 'เช็กชื่อเข้าแล้ว' }, { status: 400 })
      }
      if (existing?.isAbsent) {
        // If marked absent but now checking in, we override the absence
        const record = await prisma.checkIn.update({
          where: { childId_date: { childId: Number(childId), date } },
          data: { checkInAt: now, isAbsent: false, absenceReason: null, method, note },
          include: { child: true },
        })
        if (record.child.lineUserId) {
          pushMessage(record.child.lineUserId, `[เช็กชื่อเข้า] 🏫\nน้อง${record.child.nickname} เดินทางมาถึงศูนย์พัฒนาเด็กเล็กแล้ว\nเวลา: ${now.toLocaleTimeString('th-TH')} น.`)
        }
        return NextResponse.json(record)
      }
      const record = await prisma.checkIn.upsert({
        where: { childId_date: { childId: Number(childId), date } },
        update: { checkInAt: now, method, note },
        create: { childId: Number(childId), date, checkInAt: now, method, note },
        include: { child: true },
      })
      if (record.child.lineUserId) {
        pushMessage(record.child.lineUserId, `[เช็กชื่อเข้า] 🏫\nน้อง${record.child.nickname} เดินทางมาถึงศูนย์พัฒนาเด็กเล็กแล้ว\nเวลา: ${now.toLocaleTimeString('th-TH')} น.`)
      }
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
        data: {
          checkOutAt: now,
          note,
          ...(pickupName ? { pickupName } : {}),
          ...(pickupRelation ? { pickupRelation } : {}),
        },
        include: { child: true },
      })
      if (record.child.lineUserId) {
        pushMessage(record.child.lineUserId, `[เช็กชื่อกลับ] 🏠\nน้อง${record.child.nickname} เดินทางออกจากศูนย์พัฒนาเด็กเล็กแล้ว\nเวลา: ${now.toLocaleTimeString('th-TH')} น.\nผู้มารับ: ${pickupName || 'ผู้ปกครอง'} ${pickupRelation ? `(${pickupRelation})` : ''}`)
      }
      return NextResponse.json(record)
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
