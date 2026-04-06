import { PrismaClient } from '@prisma/client'

export async function getEffectiveAcademicYearId(
  prisma: PrismaClient,
  academicYearId?: number | null
) {
  if (academicYearId) {
    return academicYearId
  }

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    select: { id: true },
  })

  return activeYear?.id ?? null
}

export async function ensureChildActiveForAcademicYear(
  prisma: PrismaClient,
  childId: number,
  academicYearId?: number | null
) {
  const effectiveAcademicYearId = await getEffectiveAcademicYearId(prisma, academicYearId)

  if (!effectiveAcademicYearId) {
    return {
      ok: false as const,
      academicYearId: null,
      message: 'No active academic year found',
    }
  }

  const enrollment = await prisma.childEnrollment.findFirst({
    where: {
      childId,
      academicYearId: effectiveAcademicYearId,
      status: 'active',
    },
    select: { id: true },
  })

  if (!enrollment) {
    return {
      ok: false as const,
      academicYearId: effectiveAcademicYearId,
      message: 'Child is not active in the selected academic year',
    }
  }

  return {
    ok: true as const,
    academicYearId: effectiveAcademicYearId,
  }
}
