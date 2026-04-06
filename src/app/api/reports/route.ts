import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getStudentReport } from '@/lib/studentReports'
import { normalizeEnrollmentStatus } from '@/lib/enrollmentStatus'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = Number(searchParams.get('month') ?? new Date().getMonth() + 1)
  const year = Number(searchParams.get('year') ?? new Date().getFullYear())
  const status = normalizeEnrollmentStatus(searchParams.get('status'))

  try {
    const report = await getStudentReport({ month, year, status })

    if (!report) {
      return NextResponse.json({ error: 'No active academic year' }, { status: 400 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
