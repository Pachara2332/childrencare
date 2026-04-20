import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { ensureChildActiveForAcademicYear } from '@/lib/activeEnrollment'
import { pushMessage } from '@/lib/line'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      childId, weight, height,
      scoreLanguage, scorePhysical, scoreIntellect, scoreEmotional, scoreSocial,
      note, recordedBy
    } = body

    if (!childId) {
      return NextResponse.json({ message: 'childId is required' }, { status: 400 })
    }

    const activeCheck = await ensureChildActiveForAcademicYear(prisma, Number(childId))

    if (!activeCheck.ok) {
      return NextResponse.json({ message: 'Child is not active in the current academic year' }, { status: 400 })
    }

    const development = await prisma.development.create({
      data: {
        childId: Number(childId),
        weight: weight ? Number(weight) : null,
        height: height ? Number(height) : null,
        scoreLanguage: scoreLanguage ? Number(scoreLanguage) : null,
        scorePhysical: scorePhysical ? Number(scorePhysical) : null,
        scoreIntellect: scoreIntellect ? Number(scoreIntellect) : null,
        scoreEmotional: scoreEmotional ? Number(scoreEmotional) : null,
        scoreSocial: scoreSocial ? Number(scoreSocial) : null,
        note: note || null,
        recordedBy: recordedBy || 'teacher',
      },
    })

    const child = await prisma.child.findUnique({ where: { id: Number(childId) } })
    if (child?.lineUserId) {
      pushMessage(child.lineUserId, `[พัฒนาการ] 📈\nคุณครูได้อัปเดทผลการวัดพัฒนาการ/น้ำหนัก/ส่วนสูง ของน้อง${child.nickname} เข้าสู่ระบบแล้ว\nผู้ปกครองสามารถติดตามความก้าวหน้าตลอดเทอมได้ในสมุดพกออนไลน์ครับ 😊`)
    }

    return NextResponse.json(development, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Failed to record development' }, { status: 500 })
  }
}
