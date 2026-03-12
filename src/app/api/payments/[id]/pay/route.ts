import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const paymentId = Number(id)

  if (isNaN(paymentId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { paidMethod, receiptNo, note, paidAt } = body

    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    
    if (existingPayment.status === 'paid') {
      return NextResponse.json({ error: 'Payment is already marked as paid' }, { status: 400 })
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'paid',
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paidMethod: paidMethod || 'cash',
        receiptNo: receiptNo || null,
        note: note || null,
      },
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
