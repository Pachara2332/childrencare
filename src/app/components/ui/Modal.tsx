'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    icon?: string
    maxWidth?: string
    children: React.ReactNode
}

export default function Modal({
    open,
    onClose,
    title,
    icon,
    maxWidth = 'max-w-lg',
    children
}: ModalProps) {

    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [open, onClose])

    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
    }, [open])

    if (!open) return null

    const modal = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                ref={panelRef}
                className={`w-full ${maxWidth} rounded-2xl max-h-[90vh] overflow-y-auto`}
                style={{
                    background: 'white',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.15)'
                }}
            >
                {/* header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="font-bold flex items-center gap-2">
                        {icon && <span>{icon}</span>}
                        {title}
                    </h2>

                    <button onClick={onClose}>✕</button>
                </div>

                <div className="px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    )

    return createPortal(modal, document.body)
}