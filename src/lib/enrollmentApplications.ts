import { z } from 'zod'

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export const enrollmentApplicationSchema = z.object({
  academicYearId: z.coerce.number().int().positive(),
  levelId: z.coerce.number().int().positive(),
  firstName: z.string().trim().min(1, 'กรุณากรอกชื่อจริง'),
  lastName: z.string().trim().min(1, 'กรุณากรอกนามสกุล'),
  nickname: z.string().trim().min(1, 'กรุณากรอกชื่อเล่น'),
  gender: z.enum(['male', 'female'], { message: 'กรุณาเลือกเพศ' }),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'กรุณาเลือกวันเกิด'),
  bloodType: z.preprocess(emptyToUndefined, z.enum(['A', 'B', 'AB', 'O']).optional()),
  disease: z.preprocess(emptyToUndefined, z.string().trim().max(250).optional()),
  allergy: z.preprocess(emptyToUndefined, z.string().trim().max(250).optional()),
  parentName: z.string().trim().min(1, 'กรุณากรอกชื่อผู้ปกครอง'),
  parentPhone: z
    .string()
    .trim()
    .min(8, 'กรุณากรอกเบอร์โทรผู้ปกครอง')
    .max(20, 'เบอร์โทรยาวเกินไป'),
  parentPhone2: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  parentRelation: z.enum(['mother', 'father', 'guardian'], {
    message: 'กรุณาเลือกความสัมพันธ์',
  }),
  address: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
  note: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
})

export const enrollmentApplicationActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNote: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
})

export type EnrollmentApplicationInput = z.infer<typeof enrollmentApplicationSchema>
export type EnrollmentApplicationActionInput = z.infer<
  typeof enrollmentApplicationActionSchema
>
