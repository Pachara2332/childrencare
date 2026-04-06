import { Prisma } from '@prisma/client'

export interface ChildRecordInput {
  firstName: string
  lastName: string
  nickname: string
  gender: string
  dateOfBirth: string
  bloodType?: string | null
  disease?: string | null
  allergy?: string | null
  parentName: string
  parentPhone: string
  parentPhone2?: string | null
  parentRelation: string
  address?: string | null
  academicYearId?: number | null
  levelId?: number | null
}

function nextChildCodeFrom(code: string | null | undefined) {
  const match = code?.match(/^KD(\d+)$/)
  const nextSeq = match ? Number(match[1]) + 1 : 1
  return `KD${String(nextSeq).padStart(3, '0')}`
}

export async function findDuplicateChild(
  tx: Prisma.TransactionClient,
  input: Pick<ChildRecordInput, 'firstName' | 'lastName' | 'dateOfBirth' | 'parentPhone'>
) {
  return tx.child.findFirst({
    where: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      dateOfBirth: new Date(input.dateOfBirth),
      parentPhone: input.parentPhone.trim(),
    },
    select: {
      id: true,
      code: true,
      firstName: true,
      lastName: true,
      nickname: true,
    },
  })
}

export async function createChildRecord(
  tx: Prisma.TransactionClient,
  input: ChildRecordInput
) {
  const latestChild = await tx.child.findFirst({
    orderBy: { id: 'desc' },
    select: { code: true },
  })

  return tx.child.create({
    data: {
      code: nextChildCodeFrom(latestChild?.code),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      nickname: input.nickname.trim(),
      gender: input.gender,
      dateOfBirth: new Date(input.dateOfBirth),
      bloodType: input.bloodType?.trim() || null,
      disease: input.disease?.trim() || null,
      allergy: input.allergy?.trim() || null,
      parentName: input.parentName.trim(),
      parentPhone: input.parentPhone.trim(),
      parentPhone2: input.parentPhone2?.trim() || null,
      parentRelation: input.parentRelation,
      address: input.address?.trim() || null,
      enrollments:
        input.academicYearId && input.levelId
          ? {
              create: {
                academicYearId: input.academicYearId,
                levelId: input.levelId,
              },
            }
          : undefined,
    },
    include: { enrollments: true },
  })
}
