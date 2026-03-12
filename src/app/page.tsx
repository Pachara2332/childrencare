// app/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PinLoginPage() {
  const [pin, setPin] = useState<string[]>(Array(6).fill(''))
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    setStatus('idle')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 filled
    if (value && index === 5) {
      const fullPin = [...newPin.slice(0, 5), value].join('')
      if (fullPin.length === 6) handleSubmit(fullPin)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (pinValue?: string) => {
    const finalPin = pinValue ?? pin.join('')
    if (finalPin.length !== 6) return

    setStatus('loading')

    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: finalPin }),
      })
      const data = await res.json()

      if (data.success) {
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 600)
      } else {
        setStatus('error')
        setErrorMsg(data.message || 'PIN ไม่ถูกต้อง')
        setPin(Array(6).fill(''))
        setTimeout(() => {
          inputRefs.current[0]?.focus()
          setStatus('idle')
        }, 800)
      }
    } catch {
      setStatus('error')
      setErrorMsg('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  const filled = pin.filter(Boolean).length

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--forest)' }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, #52B788 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, #95D5B2 0%, transparent 50%)`
      }} />

      {/* Decorative leaves */}
      <div className="absolute top-8 left-8 text-6xl opacity-10 select-none rotate-12">🌿</div>
      <div className="absolute bottom-8 right-8 text-6xl opacity-10 select-none -rotate-12">🍃</div>
      <div className="absolute top-1/4 right-16 text-4xl opacity-10 select-none rotate-45">🌱</div>
      <div className="absolute bottom-1/4 left-16 text-4xl opacity-10 select-none -rotate-45">🌱</div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 rounded-3xl p-8 animate-scale-in"
        style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 text-4xl"
            style={{ background: 'var(--sage)', boxShadow: '0 8px 32px rgba(82,183,136,0.4)' }}
          >
            🌱
          </div>
          <h1 className="text-white text-xl font-semibold leading-tight">
            ศูนย์พัฒนาเด็กเล็ก
          </h1>
          <p style={{ color: 'var(--mint)' }} className="text-sm mt-1 font-light">
            บ้านหนองนางเลิง
          </p>
          <p className="text-white/40 text-xs mt-1">
            ต.โพนสวรรค์ อ.โพนสวรรค์ จ.นครพนม
          </p>
        </div>

        {/* PIN Label */}
        <p className="text-white/70 text-center text-sm mb-5">
          กรอก PIN 6 หลักเพื่อเข้าใช้งาน
        </p>

        {/* PIN Inputs */}
        <div
          className={`flex gap-2 justify-center mb-6 ${status === 'error' ? 'animate-shake' : ''}`}
        >
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`
        w-12 h-12
        text-center
        text-xl
        font-bold
        rounded-full
        outline-none
        transition-all duration-200

        ${status === 'success'
                  ? 'border-2 border-green-400 bg-green-500/20 text-white'
                  : status === 'error'
                    ? 'border-2 border-red-400 bg-red-500/20 text-white'
                    : digit
                      ? 'border-2 border-green-400 bg-green-500/20 text-white scale-110'
                      : 'border-2 border-white/30 bg-black/20 text-white focus:border-green-400 focus:bg-black/30'}
      `}
              disabled={status === 'loading' || status === 'success'}
            />
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {Array(6).fill(0).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i < filled ? 20 : 6,
                height: 6,
                background: i < filled ? 'var(--sage)' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        {/* Error message */}
        {status === 'error' && (
          <p className="text-center text-sm mb-4 animate-fade-in"
            style={{ color: 'var(--coral)' }}>
            ⚠️ {errorMsg}
          </p>
        )}

        {/* Submit button */}
        <button
          onClick={() => handleSubmit()}
          disabled={filled < 6 || status === 'loading' || status === 'success'}
          className="w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: status === 'success' ? '#40916C' : 'var(--sage)',
            color: 'white',
            boxShadow: filled === 6 ? '0 4px 20px rgba(82,183,136,0.4)' : 'none',
            transform: filled === 6 ? 'translateY(-1px)' : 'none',
          }}
        >
          {status === 'loading' ? '⏳ กำลังตรวจสอบ...' :
            status === 'success' ? '✅ เข้าสู่ระบบแล้ว!' :
              'เข้าสู่ระบบ'}
        </button>

        {/* Hint */}
        <p className="text-white/25 text-xs text-center mt-4">
          PIN เริ่มต้น: 123456
        </p>
      </div>
    </div>
  )
}