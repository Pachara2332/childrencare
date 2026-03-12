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
  
  // Loading states
  loading: {
    stats: boolean
    years: boolean
  }

  // Actions
  fetchPresentCount: () => Promise<void>
  fetchAcademicYears: () => Promise<void>
  setActiveYear: (year: AcademicYear | null) => void
}

export const useChildcareStore = create<ChildcareState>((set, get) => ({
  // Initial state
  presentCount: null,
  academicYears: [],
  activeYear: null,
  loading: {
    stats: false,
    years: false,
  },

  // Actions
  fetchPresentCount: async () => {
    set((state) => ({ loading: { ...state.loading, stats: true } }))
    try {
      const res = await fetch('/api/checkin/today-count')
      const data = await res.json()
      set({ presentCount: data.count })
    } catch (error) {
      console.error('Failed to fetch today count:', error)
    } finally {
      set((state) => ({ loading: { ...state.loading, stats: false } }))
    }
  },

  fetchAcademicYears: async () => {
    set((state) => ({ loading: { ...state.loading, years: true } }))
    try {
      const res = await fetch('/api/academic-years')
      const data = await res.json()
      set({ 
        academicYears: data,
        activeYear: data.find((y: AcademicYear) => y.isActive) || null
      })
    } catch (error) {
      console.error('Failed to fetch academic years:', error)
    } finally {
      set((state) => ({ loading: { ...state.loading, years: false } }))
    }
  },

  setActiveYear: (year) => set({ activeYear: year }),
}))
