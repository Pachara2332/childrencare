import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const childId = Number(id)

  if (isNaN(childId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // optional filter "YYYY-MM"

  try {
    let whereClause: any = { childId }

    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      whereClause.date = {
        gte: startDate,
        lt: endDate
      }
    }

    const checkins = await prisma.checkIn.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(checkins)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 })
  }
}
