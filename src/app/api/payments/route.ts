import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { ensureChildActiveForAcademicYear } from '@/lib/activeEnrollment'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const academicYearId = searchParams.get('academicYearId')
  const month = searchParams.get('month')
  const year = searchParams.get('year')
  const status = searchParams.get('status')
  const childId = searchParams.get('childId')

  const whereClause: Prisma.PaymentWhereInput = {}
  
  if (academicYearId) whereClause.academicYearId = Number(academicYearId)
  if (month) whereClause.month = Number(month)
  if (year) whereClause.year = Number(year)
  if (status) whereClause.status = status
  if (childId) whereClause.childId = Number(childId)

  try {
    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        child: {
          select: { id: true, firstName: true, lastName: true, nickname: true, code: true }
        }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }]
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      childId, academicYearId, month, year,
      maintenanceFee, foodFee, otherFee, otherFeeNote, dueDate
    } = body

    if (!childId || !academicYearId || !month || !year || !dueDate) {
      return NextResponse.json({ message: 'childId, academicYearId, month, year, and dueDate are required' }, { status: 400 })
    }

    const activeCheck = await ensureChildActiveForAcademicYear(
      prisma,
      Number(childId),
      Number(academicYearId)
    )

    if (!activeCheck.ok) {
      return NextResponse.json({ message: 'Child is not active in this academic year' }, { status: 400 })
    }

    // Check if duplicate exists
    const existing = await prisma.payment.findUnique({
      where: {
        childId_academicYearId_month_year: {
          childId: Number(childId),
          academicYearId: Number(academicYearId),
          month: Number(month),
          year: Number(year)
        }
      }
    })

    if (existing) {
      return NextResponse.json({ message: 'Payment record for this month/year already exists' }, { status: 409 })
    }

    const payment = await prisma.payment.create({
      data: {
        childId: Number(childId),
        academicYearId: Number(academicYearId),
        month: Number(month),
        year: Number(year),
        maintenanceFee: maintenanceFee ? Number(maintenanceFee) : 0,
        foodFee: foodFee ? Number(foodFee) : 0,
        otherFee: otherFee ? Number(otherFee) : 0,
        otherFeeNote: otherFeeNote || null,
        dueDate: new Date(dueDate),
        status: 'pending'
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Failed to create payment record' }, { status: 500 })
  }
}
