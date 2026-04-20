import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const children = await prisma.child.findMany({
      where: {
        enrollments: {
          some: {
            status: 'graduated'
          }
        }
      },
      include: {
        enrollments: {
          orderBy: { enrolledAt: 'desc' },
          take: 1
        }
      }
    })

    const filtered = children.filter(child => 
      child.enrollments.length > 0 && child.enrollments[0].status === 'graduated'
    )

    // Map to lighter format for easier UI usage
    const result = filtered.map(c => ({
        id: c.id,
        code: c.code,
        firstName: c.firstName,
        lastName: c.lastName,
        nickname: c.nickname,
        gender: c.gender
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch graduated children' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
  try {
    const { childIds } = await req.json()
    if (!childIds || !Array.isArray(childIds) || childIds.length === 0) {
      return NextResponse.json({ error: 'childIds array is required' }, { status: 400 })
    }

    const result = await prisma.child.deleteMany({
      where: {
        id: { in: childIds }
      }
    })

    return NextResponse.json({ message: `ลบข้อมูลเด็กเรียบร้อยแล้ว (${result.count} รายการ)`, count: result.count })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete children' }, { status: 500 })
  }
}
