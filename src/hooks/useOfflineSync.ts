'use client'

import { useState, useEffect, useCallback } from 'react'

export interface OfflineAction {
    id: string
    childId: number
    type: 'in' | 'out' | 'absent'
    date: string
    method: string
    pickupName?: string
    pickupRelation?: string
    note?: string
    timestamp: number
}

function loadOfflineQueue(): OfflineAction[] {
    if (typeof window === 'undefined') return []

    try {
        const saved = localStorage.getItem('checkin_offline_queue')
        return saved ? JSON.parse(saved) as OfflineAction[] : []
    } catch (error) {
        console.error('Failed to load offline queue:', error)
        return []
    }
}

export function useOfflineSync(onSuccess?: () => void) {
    const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)
    const [queue, setQueue] = useState<OfflineAction[]>(loadOfflineQueue)
    const [isSyncing, setIsSyncing] = useState(false)

    const persistQueue = useCallback((nextQueue: OfflineAction[]) => {
        if (typeof window === 'undefined') return

        if (nextQueue.length === 0) {
            localStorage.removeItem('checkin_offline_queue')
            return
        }

        localStorage.setItem('checkin_offline_queue', JSON.stringify(nextQueue))
    }, [])

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const syncQueue = useCallback(async () => {
        if (!isOnline || queue.length === 0 || isSyncing) return

        setIsSyncing(true)
        const currentQueue = [...queue]
        const remainingQueue: OfflineAction[] = []
        let successCount = 0

        for (const action of currentQueue) {
            try {
                const res = await fetch('/api/checkin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(action),
                })
                
                if (res.ok) {
                    successCount++
                } else {
                    // If the server rejected it (e.g. already checked in), we still remove it from the queue
                    // to prevent infinite retry loops on bad data.
                    const data = await res.json().catch(() => null)
                    console.warn('Action failed but removing from queue to prevent block:', action, data)
                }
            } catch {
                // Network error, keep in queue
                remainingQueue.push(action)
            }
        }

        if (successCount > 0 && onSuccess) {
            onSuccess()
        }

        setQueue(remainingQueue)
        persistQueue(remainingQueue)
        setIsSyncing(false)
    }, [isOnline, queue, isSyncing, onSuccess, persistQueue])

    useEffect(() => {
        if (!isOnline || queue.length === 0 || isSyncing) return

        const timeoutId = window.setTimeout(() => {
            void syncQueue()
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [isOnline, queue.length, isSyncing, syncQueue])

    const addAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
        const fullAction: OfflineAction = {
            ...action,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now()
        }
        
        setQueue(prev => {
            const next = [...prev, fullAction]
            persistQueue(next)
            return next
        })
    }, [persistQueue])

    const clearQueue = useCallback(() => {
        setQueue([])
        if (typeof window !== 'undefined') {
            localStorage.removeItem('checkin_offline_queue')
        }
    }, [])

    return {
        isOnline,
        queue,
        isSyncing,
        addAction,
        clearQueue,
        syncQueue
    }
}
