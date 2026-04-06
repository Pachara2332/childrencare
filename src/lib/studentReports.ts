import { prisma } from '@/lib/prisma'
import {
  EnrollmentStatus,
  ENROLLMENT_STATUSES,
  enrollmentStatusLabels,
} from '@/lib/enrollmentStatus'

export interface StudentReportChild {
  code: string
  name: string
  nickname: string
  age: string
  parent: string
  phone: string
  attendanceRate: number
  disease: string | null
  status: EnrollmentStatus
  statusLabel: string
  levelName: string
  levelCode: string
  statusDate: string | null
  statusReason: string | null
}

export interface StudentReportData {
  centerName: string
  location: string
  academicYear: string
  totalChildren: number
  maleCount: number
  femaleCount: number
  avgAttendance: number
  presentToday: number
  selectedStatus: EnrollmentStatus | 'all'
  statusSummary: Record<EnrollmentStatus, number>
  childrenList: StudentReportChild[]
}

function formatAge(dateOfBirth: Date) {
  const now = new Date()
  let years = now.getFullYear() - dateOfBirth.getFullYear()
  let months = now.getMonth() - dateOfBirth.getMonth()
  if (months < 0) {
    years -= 1
    months += 12
  }
  return `${years} ปี ${months} เดือน`
}

function isoDate(value: Date | null) {
  return value ? value.toISOString() : null
}

export async function getStudentReport(params: {
  month: number
  year: number
  status: EnrollmentStatus | 'all'
}) {
  const academicYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  })

  if (!academicYear) {
    return null
  }

  const monthStart = new Date(params.year, params.month - 1, 1)
  const monthEnd = new Date(params.year, params.month, 0, 23, 59, 59, 999)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const [config, allEnrollments, activePresentToday, monthCheckIns] = await Promise.all([
    prisma.appConfig.findMany({
      where: {
        key: {
          in: ['center_name', 'center_location'],
        },
      },
    }),
    prisma.childEnrollment.findMany({
      where: {
        academicYearId: academicYear.id,
      },
      include: {
        child: true,
        level: true,
      },
      orderBy: [{ enrolledAt: 'desc' }, { child: { nickname: 'asc' } }],
    }),
    prisma.checkIn.count({
      where: {
        date: {
          gte: today,
          lte: todayEnd,
        },
        checkInAt: { not: null },
        child: {
          enrollments: {
            some: {
              academicYearId: academicYear.id,
              status: 'active',
            },
          },
        },
      },
    }),
    prisma.checkIn.findMany({
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        child: {
          enrollments: {
            some: {
              academicYearId: academicYear.id,
            },
          },
        },
      },
      select: {
        childId: true,
        date: true,
        checkInAt: true,
      },
    }),
  ])

  const centerNameConfig = config.find((item) => item.key === 'center_name')
  const centerLocationConfig = config.find((item) => item.key === 'center_location')
  const centerName =
    (centerNameConfig?.value as { name?: string } | undefined)?.name ??
    'ศูนย์พัฒนาเด็กเล็ก'
  const location =
    (centerLocationConfig?.value as { location?: string } | undefined)?.location ?? '-'

  const statusSummary = ENROLLMENT_STATUSES.reduce(
    (summary, status) => {
      summary[status] = allEnrollments.filter((item) => item.status === status).length
      return summary
    },
    {
      active: 0,
      leave: 0,
      graduated: 0,
    } as Record<EnrollmentStatus, number>
  )

  const filteredEnrollments =
    params.status === 'all'
      ? allEnrollments
      : allEnrollments.filter((item) => item.status === params.status)

  const uniqueDates = new Set(
    monthCheckIns.map((item) => item.date.toISOString().slice(0, 10))
  )
  const totalTrackedDays = uniqueDates.size

  const childAttendanceMap = new Map<number, number>()
  for (const record of monthCheckIns) {
    if (!record.checkInAt) continue
    childAttendanceMap.set(record.childId, (childAttendanceMap.get(record.childId) ?? 0) + 1)
  }

  const childrenList: StudentReportChild[] = filteredEnrollments.map((enrollment) => {
    const attendedDays = childAttendanceMap.get(enrollment.childId) ?? 0
    const attendanceRate =
      totalTrackedDays > 0 ? Math.round((attendedDays / totalTrackedDays) * 100) : 0

    return {
      code: enrollment.child.code,
      name: `${enrollment.child.firstName} ${enrollment.child.lastName}`,
      nickname: enrollment.child.nickname,
      age: formatAge(enrollment.child.dateOfBirth),
      parent: enrollment.child.parentName,
      phone: enrollment.child.parentPhone,
      attendanceRate,
      disease: enrollment.child.disease,
      status: enrollment.status as EnrollmentStatus,
      statusLabel: enrollmentStatusLabels[enrollment.status as EnrollmentStatus],
      levelName: enrollment.level.name,
      levelCode: enrollment.level.code,
      statusDate: isoDate(enrollment.statusDate),
      statusReason: enrollment.statusReason,
    }
  })

  const totalChildren = childrenList.length
  const maleCount = filteredEnrollments.filter((item) => item.child.gender === 'male').length
  const femaleCount = filteredEnrollments.filter((item) => item.child.gender === 'female').length
  const avgAttendance =
    childrenList.length > 0
      ? Math.round(
          childrenList.reduce((sum, item) => sum + item.attendanceRate, 0) /
            childrenList.length
        )
      : 0

  return {
    centerName,
    location,
    academicYear: academicYear.name,
    totalChildren,
    maleCount,
    femaleCount,
    avgAttendance,
    presentToday: activePresentToday,
    selectedStatus: params.status,
    statusSummary,
    childrenList,
  } satisfies StudentReportData
}
