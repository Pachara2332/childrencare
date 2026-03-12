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

  try {
    const developments = await prisma.development.findMany({
      where: { childId },
      orderBy: { recordedAt: 'desc' },
    })

    return NextResponse.json(developments)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch developments' }, { status: 500 })
  }
}
