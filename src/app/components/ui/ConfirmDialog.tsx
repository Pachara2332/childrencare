'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Trash2, Save, Info } from 'lucide-react'

type ConfirmVariant = 'danger' | 'warning' | 'success' | 'info'

interface ConfirmDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: ConfirmVariant
    loading?: boolean
}

const variantConfig: Record<ConfirmVariant, {
    icon: React.ReactNode
    iconBg: string
    iconColor: string
    btnBg: string
    btnHover: string
}> = {
    danger: {
        icon: <Trash2 size={24} />,
        iconBg: 'oklch(0.95 0.04 25)',
        iconColor: 'var(--coral)',
        btnBg: 'var(--rust)',
        btnHover: 'oklch(0.45 0.12 25)',
    },
    warning: {
        icon: <AlertTriangle size={24} />,
        iconBg: 'oklch(0.95 0.04 70)',
        iconColor: 'var(--sun)',
        btnBg: 'var(--sun)',
        btnHover: 'oklch(0.60 0.14 70)',
    },
    success: {
        icon: <Save size={24} />,
        iconBg: 'oklch(0.93 0.04 160)',
        iconColor: 'var(--leaf)',
        btnBg: 'var(--leaf)',
        btnHover: 'oklch(0.45 0.12 160)',
    },
    info: {
        icon: <Info size={24} />,
        iconBg: 'oklch(0.94 0.03 240)',
        iconColor: 'var(--sky)',
        btnBg: 'var(--sky)',
        btnHover: 'oklch(0.45 0.10 240)',
    },
}

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'ยืนยัน',
    cancelLabel = 'ยกเลิก',
    variant = 'danger',
    loading = false,
}: ConfirmDialogProps) {
    const cfg = variantConfig[variant]

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

    const dialog = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-backdrop"
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) onClose()
            }}
        >
            <div
                className="w-full max-w-sm rounded-2xl modal-panel"
                style={{
                    background: 'white',
                    boxShadow: '0 24px 64px oklch(0.18 0.02 160 / 0.2), 0 0 0 1px oklch(0.18 0.02 160 / 0.04)',
                }}
            >
                <div className="px-6 pt-6 pb-4 text-center">
                    {/* Icon */}
                    <div
                        className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{ background: cfg.iconBg, color: cfg.iconColor }}
                    >
                        {cfg.icon}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text)' }}>
                        {title}
                    </h3>

                    {/* Description */}
                    {description && (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                            {description}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        style={{
                            background: 'var(--cream)',
                            color: 'var(--text)',
                            border: '1px solid var(--warm)',
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-70 active:scale-[0.98]"
                        style={{
                            background: cfg.btnBg,
                            color: 'white',
                        }}
                    >
                        {loading ? 'กำลังดำเนินการ...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(dialog, document.body)
}
