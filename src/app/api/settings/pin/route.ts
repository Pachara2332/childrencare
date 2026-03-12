// app/api/settings/pin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPin } from '@/lib/auth'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPin, newPin } = await req.json()

  if (!await verifyPin(currentPin)) {
    return NextResponse.json({ message: 'PIN ปัจจุบันไม่ถูกต้อง' }, { status: 400 })
  }

  if (!/^\d{6}$/.test(newPin)) {
    return NextResponse.json({ message: 'PIN ใหม่ต้องเป็นตัวเลข 6 หลัก' }, { status: 400 })
  }

  await prisma.appConfig.upsert({
    where: { key: 'pin' },
    update: { value: { pin: newPin } },
    create: { key: 'pin', value: { pin: newPin } },
  })

  return NextResponse.json({ message: 'เปลี่ยน PIN สำเร็จ' })
}