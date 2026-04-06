export const ENROLLMENT_STATUSES = ['active', 'leave', 'graduated'] as const

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number]

export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  active: 'กำลังเรียน',
  leave: 'ย้ายออก',
  graduated: 'จบการศึกษา',
}

export const enrollmentStatusShortLabels: Record<EnrollmentStatus, string> = {
  active: 'ปัจจุบัน',
  leave: 'ย้ายออก',
  graduated: 'จบแล้ว',
}

export function isEnrollmentStatus(value: string): value is EnrollmentStatus {
  return ENROLLMENT_STATUSES.includes(value as EnrollmentStatus)
}

export function normalizeEnrollmentStatus(value: string | null | undefined) {
  if (!value || value === 'all') return 'all' as const
  return isEnrollmentStatus(value) ? value : 'all'
}

export function getEnrollmentStatusTone(status: EnrollmentStatus) {
  switch (status) {
    case 'leave':
      return {
        bg: '#FFF0ED',
        text: 'var(--coral)',
      }
    case 'graduated':
      return {
        bg: 'oklch(0.95 0.04 70)',
        text: 'oklch(0.42 0.08 70)',
      }
    default:
      return {
        bg: 'oklch(0.95 0.04 150)',
        text: 'var(--leaf)',
      }
  }
}
