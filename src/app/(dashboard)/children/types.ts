export interface ClassLevel {
    id: number
    code: string
    name: string
    color: string
    minAgeMonths: number
    maxAgeMonths: number
    order: number
    _count?: { enrollments: number }
}

export interface AcademicYear {
    id: number
    year: string
    name: string
    isActive: boolean
    classLevels: ClassLevel[]
    _count?: { enrollments: number }
}

export interface Child {
    id: number
    code: string
    firstName: string
    lastName: string
    nickname: string
    gender: string
    dateOfBirth: string
    disease: string | null
    allergy: string | null
    parentName: string
    parentPhone: string
    qrToken: string
}

export interface Enrollment {
    id: number
    childId: number
    status: string
    statusDate: string | null
    statusReason: string | null
    child: Child
    level: ClassLevel
    academicYear: { id: number; name: string }
}

export type MainTab = 'roster' | 'add' | 'import' | 'manage-levels' | 'graduated'
