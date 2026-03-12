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
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        enrollments: {
          include: { academicYear: true, level: true },
          orderBy: { enrolledAt: 'desc' },
        },
      },
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    return NextResponse.json(child)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch child' }, { status: 500 })
  }
}

export async function PATCH(
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
    const body = await req.json()
    const {
      firstName, lastName, nickname, gender, dateOfBirth,
      bloodType, disease, allergy,
      parentName, parentPhone, parentPhone2, parentRelation, address
    } = body

    const dataToUpdate: any = {}
    if (firstName !== undefined) dataToUpdate.firstName = firstName
    if (lastName !== undefined) dataToUpdate.lastName = lastName
    if (nickname !== undefined) dataToUpdate.nickname = nickname
    if (gender !== undefined) dataToUpdate.gender = gender
    if (dateOfBirth !== undefined) dataToUpdate.dateOfBirth = new Date(dateOfBirth)
    if (bloodType !== undefined) dataToUpdate.bloodType = bloodType
    if (disease !== undefined) dataToUpdate.disease = disease
    if (allergy !== undefined) dataToUpdate.allergy = allergy
    if (parentName !== undefined) dataToUpdate.parentName = parentName
    if (parentPhone !== undefined) dataToUpdate.parentPhone = parentPhone
    if (parentPhone2 !== undefined) dataToUpdate.parentPhone2 = parentPhone2
    if (parentRelation !== undefined) dataToUpdate.parentRelation = parentRelation
    if (address !== undefined) dataToUpdate.address = address

    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: dataToUpdate,
    })

    return NextResponse.json(updatedChild)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update child' }, { status: 500 })
  }
}
