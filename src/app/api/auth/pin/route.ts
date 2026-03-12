// app/api/auth/pin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyPin } from '@/lib/auth'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json()

    if (!pin || typeof pin !== 'string' || pin.length !== 6) {
      return NextResponse.json(
        { success: false, message: 'PIN ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const isValid = await verifyPin(pin)

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'PIN ไม่ถูกต้อง กรุณาลองใหม่' },
        { status: 401 }
      )
    }

    const session = await getSession()
    session.isAuthenticated = true
    session.authenticatedAt = Date.now()
    await session.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PIN auth error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const session = await getSession()
  session.destroy()
  return NextResponse.json({ success: true })
}