import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: Number(id) }
  })

  if (!leaveRequest) {
    return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
  }

  // Update status
  const updatedLeave = await prisma.leaveRequest.update({
    where: { id: Number(id) },
    data: { status: 'approved' }
  })

  // Create CheckIn records for the dates
  const dates: Date[] = []
  let currentDate = new Date(leaveRequest.startDate)
  const endDate = new Date(leaveRequest.endDate)
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  await prisma.$transaction(async (tx) => {
    for (const date of dates) {
      const existing = await tx.checkIn.findUnique({
        where: {
          childId_date: { childId: leaveRequest.childId, date }
        }
      })

      if (existing) {
        await tx.checkIn.update({
          where: { id: existing.id },
          data: {
            isAbsent: true,
            absenceReason: `[ลาล่วงหน้า] ${leaveRequest.reasonType}: ${leaveRequest.reasonDetail || ''}`.trim()
          }
        })
      } else {
        await tx.checkIn.create({
          data: {
            childId: leaveRequest.childId,
            date,
            isAbsent: true,
            absenceReason: `[ลาล่วงหน้า] ${leaveRequest.reasonType}: ${leaveRequest.reasonDetail || ''}`.trim(),
            method: 'manual'
          }
        })
      }
    }
  })

  return NextResponse.json({ message: 'Approved successfully', leaveRequest: updatedLeave })
}
