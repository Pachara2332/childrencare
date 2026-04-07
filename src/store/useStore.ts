// src/store/useStore.ts
import { create } from 'zustand'

interface AcademicYear {
  id: number
  year: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  _count?: {
    enrollments: number
  }
}

interface ChildcareState {
  // Data
  presentCount: number | null
  academicYears: AcademicYear[]
  activeYear: AcademicYear | null
  
  // UI State
  mobileMenuOpen: boolean
  
  // Loading states
  loading: {
    stats: boolean
    years: boolean
  }

  // Actions
  fetchPresentCount: () => Promise<void>
  fetchAcademicYears: () => Promise<void>
  setActiveYear: (year: AcademicYear | null) => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useChildcareStore = create<ChildcareState>((set, get) => ({
  // Initial state
  presentCount: null,
  academicYears: [],
  activeYear: null,
  mobileMenuOpen: false,
  loading: {
    stats: false,
    years: false,
  },

  // Actions
  fetchPresentCount: async () => {
    set((state) => ({ loading: { ...state.loading, stats: true } }))
    try {
      const res = await fetch('/api/checkin/today-count')
      if (res.ok) {
        const data = await res.json()
        set({ presentCount: data.count })
      } else {
        set({ presentCount: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch today count:', error)
      set({ presentCount: 0 })
    } finally {
      set((state) => ({ loading: { ...state.loading, stats: false } }))
    }
  },

  fetchAcademicYears: async () => {
    set((state) => ({ loading: { ...state.loading, years: true } }))
    try {
      const res = await fetch('/api/academic-years')
      if (res.ok) {
        const data = await res.json()
        set({ 
          academicYears: data,
          activeYear: data.find((y: AcademicYear) => y.isActive) || null
        })
      } else {
        set({ academicYears: [], activeYear: null })
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error)
      set({ academicYears: [], activeYear: null })
    } finally {
      set((state) => ({ loading: { ...state.loading, years: false } }))
    }
  },

  setActiveYear: (year) => set({ activeYear: year }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}))
