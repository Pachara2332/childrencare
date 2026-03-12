// src/components/providers/StoreInitializer.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useChildcareStore } from '@/store/useStore'

export default function StoreInitializer() {
    const initialized = useRef(false)
    const fetchAcademicYears = useChildcareStore(state => state.fetchAcademicYears)
    const fetchPresentCount = useChildcareStore(state => state.fetchPresentCount)

    useEffect(() => {
        if (!initialized.current) {
            fetchAcademicYears()
            fetchPresentCount()
            initialized.current = true
        }
    }, [fetchAcademicYears, fetchPresentCount])

    return null
}
