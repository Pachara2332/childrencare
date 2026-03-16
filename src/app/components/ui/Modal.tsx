'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    icon?: React.ReactNode
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
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-backdrop"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                ref={panelRef}
                className={`w-full ${maxWidth} rounded-2xl max-h-[90vh] overflow-y-auto modal-panel`}
                style={{
                    background: 'white',
                    boxShadow: '0 24px 64px oklch(0.18 0.02 160 / 0.2), 0 0 0 1px oklch(0.18 0.02 160 / 0.04)',
                }}
            >
                {/* header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid var(--warm)' }}
                >
                    <h2
                        className="font-bold text-base flex items-center gap-2"
                        style={{ color: 'var(--text)' }}
                    >
                        {icon && <span>{icon}</span>}
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{
                            background: 'var(--cream)',
                            color: 'var(--muted)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--warm)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--cream)')}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    )

    return createPortal(modal, document.body)
}