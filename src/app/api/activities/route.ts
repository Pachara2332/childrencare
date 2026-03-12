import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  const dateStr = searchParams.get('date') // YYYY-MM-DD
  const academicYearId = searchParams.get('academicYearId')

  const whereClause: any = {}
  
  if (childId) {
    whereClause.childId = Number(childId)
  }
  
  if (academicYearId) {
    whereClause.academicYearId = Number(academicYearId)
  }

  if (dateStr) {
    whereClause.date = new Date(`${dateStr}T00:00:00.000Z`)
  }

  try {
    const activities = await prisma.dailyActivity.findMany({
      where: whereClause,
      include: {
        child: {
          select: { id: true, firstName: true, lastName: true, nickname: true, photoUrl: true }
        }
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      childId, academicYearId, date,
      meals, mealsNote, sleepMinutes, sleepNote,
      activities, activitiesNote, mood, teacherNote, photoUrls
    } = body

    if (!childId || !academicYearId || !date) {
      return NextResponse.json({ message: 'childId, academicYearId, and date are required' }, { status: 400 })
    }

    const activityDate = new Date(`${date}T00:00:00.000Z`)

    // Upsert to handle both create and update if already exists
    const dailyActivity = await prisma.dailyActivity.upsert({
      where: {
        childId_date: {
          childId: Number(childId),
          date: activityDate
        }
      },
      update: {
        meals: meals !== undefined ? meals : undefined,
        mealsNote: mealsNote !== undefined ? mealsNote : undefined,
        sleepMinutes: sleepMinutes !== undefined ? Number(sleepMinutes) : undefined,
        sleepNote: sleepNote !== undefined ? sleepNote : undefined,
        activities: activities !== undefined ? activities : undefined,
        activitiesNote: activitiesNote !== undefined ? activitiesNote : undefined,
        mood: mood !== undefined ? mood : undefined,
        teacherNote: teacherNote !== undefined ? teacherNote : undefined,
        photoUrls: photoUrls !== undefined ? photoUrls : undefined,
      },
      create: {
        childId: Number(childId),
        academicYearId: Number(academicYearId),
        date: activityDate,
        meals: meals || null,
        mealsNote: mealsNote || null,
        sleepMinutes: sleepMinutes ? Number(sleepMinutes) : null,
        sleepNote: sleepNote || null,
        activities: activities || [],
        activitiesNote: activitiesNote || null,
        mood: mood || null,
        teacherNote: teacherNote || null,
        photoUrls: photoUrls || [],
      },
    })

    return NextResponse.json(dailyActivity, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Failed to record daily activity' }, { status: 500 })
  }
}
