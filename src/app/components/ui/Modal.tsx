'use client'

import { useEffect, useRef } from 'react'

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    icon?: string
    maxWidth?: string
    children: React.ReactNode
}

export default function Modal({ open, onClose, title, icon, maxWidth = 'max-w-lg', children }: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null)

    // Close on Escape
    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [open, onClose])

    // Lock body scroll
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                ref={panelRef}
                className={`w-full ${maxWidth} rounded-2xl modal-panel max-h-[90vh] overflow-y-auto`}
                style={{ background: 'white', boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
                    style={{ background: 'white', borderBottom: '1px solid var(--warm)', borderRadius: '16px 16px 0 0' }}
                >
                    <h2 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text)' }}>
                        {icon && <span className="text-lg">{icon}</span>}
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-110"
                        style={{ background: 'var(--cream)', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    )
}
