import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const academicYearId = searchParams.get('academicYearId')
  
  const whereClause: any = {}
  
  if (academicYearId) {
    whereClause.academicYearId = Number(academicYearId)
  }

  try {
    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      include: { academicYear: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      academicYearId, title, content, type, isUrgent, expiresAt
    } = body

    if (!academicYearId || !title || !content) {
      return NextResponse.json({ message: 'academicYearId, title, and content are required' }, { status: 400 })
    }

    const announcement = await prisma.announcement.create({
      data: {
        academicYearId: Number(academicYearId),
        title,
        content,
        type: type || 'general',
        isUrgent: isUrgent || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Failed to create announcement' }, { status: 500 })
  }
}
