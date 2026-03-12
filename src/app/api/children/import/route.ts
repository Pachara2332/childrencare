// app/api/children/import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { children, academicYearId, levelId } = await req.json()

  let imported = 0
  const errors: string[] = []

  for (let i = 0; i < children.length; i++) {
    const c = children[i]
    try {
      if (!c.firstName || !c.lastName || !c.nickname) {
        errors.push(`แถว ${i + 1}: ขาด firstName / lastName / nickname`)
        continue
      }

      const count = await prisma.child.count()
      const code = `KD${String(count + 1).padStart(3, '0')}`

      await prisma.child.create({
        data: {
          code,
          firstName:      c.firstName,
          lastName:       c.lastName,
          nickname:       c.nickname,
          gender:         c.gender ?? 'male',
          dateOfBirth:    new Date(c.dateOfBirth ?? '2021-01-01'),
          bloodType:      c.bloodType ?? null,
          disease:        c.disease ?? null,
          allergy:        c.allergy ?? null,
          parentName:     c.parentName ?? 'ไม่ระบุ',
          parentPhone:    c.parentPhone ?? '000-000-0000',
          parentPhone2:   c.parentPhone2 ?? null,
          parentRelation: c.parentRelation ?? 'guardian',
          address:        c.address ?? null,
          enrollments: (academicYearId && levelId) ? {
            create: {
              academicYearId: Number(academicYearId),
              levelId:        Number(levelId),
            },
          } : undefined,
        },
      })
      imported++
    } catch (err) {
      errors.push(`แถว ${i + 1}: ${(err as Error).message}`)
    }
  }

  return NextResponse.json({ imported, errors })
}