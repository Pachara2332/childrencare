// app/page.tsx — Login
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf } from 'lucide-react'

export default function LoginPage() {
    const [pin, setPin] = useState(['', '', '', '', '', ''])
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const router = useRouter()

    useEffect(() => {
        inputRefs.current[0]?.focus()
    }, [])

    const handleChange = (i: number, val: string) => {
        if (!/^\d*$/.test(val)) return
        const next = [...pin]
        next[i] = val.slice(-1)
        setPin(next)
        setStatus('idle')
        if (val && i < 5) inputRefs.current[i + 1]?.focus()
    }

    const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[i] && i > 0) {
            inputRefs.current[i - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pasted.length === 6) {
            setPin(pasted.split(''))
            inputRefs.current[5]?.focus()
        }
    }

    const handleSubmit = useCallback(async () => {
        const code = pin.join('')
        if (code.length !== 6) return
        setStatus('loading')
        try {
            const res = await fetch('/api/auth/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: code }),
            })
            if (res.ok) {
                setStatus('success')
                setTimeout(() => router.push('/dashboard'), 400)
            } else {
                setStatus('error')
                setPin(['', '', '', '', '', ''])
                inputRefs.current[0]?.focus()
            }
        } catch {
            setStatus('error')
        }
    }, [pin, router])

    useEffect(() => {
        if (pin.every(d => d !== '')) handleSubmit()
    }, [pin, handleSubmit])

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{
                background: 'var(--forest)',
            }}
        >
            <div
                className="w-full max-w-xs text-center animate-fade-up"
                style={{ padding: '0 24px' }}
            >
                {/* Logo & Title */}
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
                    style={{ background: 'oklch(1 0 0 / 0.08)' }}
                >
                    <Leaf size={32} color="var(--sage)" />
                </div>
                <h1
                    className="text-xl font-bold mb-1"
                    style={{ color: 'white' }}
                >
                    ศูนย์พัฒนาเด็กเล็ก
                </h1>
                <p
                    className="text-sm mb-8"
                    style={{ color: 'var(--mint)' }}
                >
                    บ้านหนองนางเลิง
                </p>

                {/* PIN label */}
                <p
                    className="text-xs font-semibold mb-4 tracking-wide"
                    style={{ color: 'oklch(1 0 0 / 0.4)' }}
                >
                    กรอก PIN 6 หลัก
                </p>

                {/* PIN inputs */}
                <div className="flex justify-center gap-2.5 mb-5">
                    {pin.map((d, i) => (
                        <input
                            key={i}
                            ref={el => { inputRefs.current[i] = el }}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={e => handleChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            onPaste={i === 0 ? handlePaste : undefined}
                            className={`
                                w-11 h-12 text-center text-lg font-bold rounded-xl outline-none
                                ${status === 'error' ? 'animate-shake' : ''}
                            `}
                            style={{
                                background: d ? 'oklch(1 0 0 / 0.12)' : 'oklch(1 0 0 / 0.06)',
                                border: `2px solid ${
                                    status === 'error'
                                        ? 'var(--coral)'
                                        : status === 'success'
                                            ? 'var(--sage)'
                                            : d
                                                ? 'oklch(1 0 0 / 0.2)'
                                                : 'oklch(1 0 0 / 0.08)'
                                }`,
                                color: 'white',
                                transition: 'border-color 0.2s, background 0.2s',
                            }}
                        />
                    ))}
                </div>

                {/* Status feedback */}
                <div className="h-6">
                    {status === 'loading' && (
                        <p className="text-xs animate-fade-in" style={{ color: 'var(--mint)' }}>
                            กำลังตรวจสอบ...
                        </p>
                    )}
                    {status === 'error' && (
                        <p className="text-xs animate-fade-in" style={{ color: 'var(--coral)' }}>
                            PIN ไม่ถูกต้อง ลองอีกครั้ง
                        </p>
                    )}
                    {status === 'success' && (
                        <p className="text-xs animate-fade-in" style={{ color: 'var(--mint)' }}>
                            เข้าสู่ระบบสำเร็จ ✓
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}