// app/page.tsx - Login
'use client'

import Link from 'next/link'
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

  const submitPin = useCallback(
    async (code: string) => {
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
    },
    [router]
  )

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...pin]
    next[i] = val.slice(-1)
    setPin(next)
    setStatus('idle')
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
    const code = next.join('')
    if (next.every((digit) => digit !== '') && code.length === 6) {
      void submitPin(code)
    }
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
      const next = pasted.split('')
      setPin(next)
      inputRefs.current[5]?.focus()
      void submitPin(pasted)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'var(--forest)',
      }}
    >
      <div className="w-full max-w-xs text-center animate-fade-up" style={{ padding: '0 24px' }}>
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
          style={{ background: 'oklch(1 0 0 / 0.08)' }}
        >
          <Leaf size={32} color="var(--sage)" />
        </div>
        <h1 className="mb-1 text-xl font-bold" style={{ color: 'white' }}>
          ศูนย์พัฒนาเด็กเล็ก
        </h1>
        <p className="mb-8 text-sm" style={{ color: 'var(--mint)' }}>
          บ้านหนองนางเลิง
        </p>

        <p className="mb-4 text-xs font-semibold tracking-wide" style={{ color: 'oklch(1 0 0 / 0.4)' }}>
          กรอก PIN 6 หลัก
        </p>

        <div className="mb-5 flex justify-center gap-2.5">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element
              }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`h-12 w-11 rounded-xl text-center text-lg font-bold outline-none ${
                status === 'error' ? 'animate-shake' : ''
              }`}
              style={{
                background: digit ? 'oklch(1 0 0 / 0.12)' : 'oklch(1 0 0 / 0.06)',
                border: `2px solid ${
                  status === 'error'
                    ? 'var(--coral)'
                    : status === 'success'
                      ? 'var(--sage)'
                      : digit
                        ? 'oklch(1 0 0 / 0.2)'
                        : 'oklch(1 0 0 / 0.08)'
                }`,
                color: 'white',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            />
          ))}
        </div>

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
              เข้าสู่ระบบสำเร็จ
            </p>
          )}
        </div>

        <div className="mt-6 pt-5" style={{ borderTop: '1px solid oklch(1 0 0 / 0.08)' }}>
          <p className="mb-2 text-[11px]" style={{ color: 'oklch(1 0 0 / 0.45)' }}>
            ผู้ปกครองสมัครเรียนออนไลน์
          </p>
          <Link
            href="/apply"
            className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{
              background: 'oklch(1 0 0 / 0.08)',
              color: 'white',
              border: '1px solid oklch(1 0 0 / 0.08)',
            }}
          >
            เปิดฟอร์มสมัครเรียน
          </Link>
        </div>
      </div>
    </div>
  )
}
