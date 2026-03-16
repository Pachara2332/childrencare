// app/(dashboard)/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react'

interface AcademicYear {
    id: number; year: string; name: string
    startDate: string; endDate: string; isActive: boolean
}

export default function SettingsPage() {
    const [tab, setTab] = useState<'pin' | 'year'>('year')

    // PIN
    const [currentPin, setCurrentPin] = useState('')
    const [newPin, setNewPin] = useState('')
    const [confirmPin, setConfirmPin] = useState('')
    const [pinMsg, setPinMsg] = useState<{ text: string; ok: boolean } | null>(null)
    const [savingPin, setSavingPin] = useState(false)

    // Academic Year
    const [years, setYears] = useState<AcademicYear[]>([])
    const [form, setForm] = useState({ year: '', name: '', startDate: '', endDate: '', isActive: false })
    const [savingYear, setSavingYear] = useState(false)

    useEffect(() => {
        fetch('/api/academic-years').then(r => r.json()).then(setYears)
    }, [])

    const handleChangePin = async () => {
        if (newPin.length !== 6) return setPinMsg({ text: 'PIN ต้องมี 6 หลัก', ok: false })
        if (newPin !== confirmPin) return setPinMsg({ text: 'PIN ไม่ตรงกัน', ok: false })
        setSavingPin(true); setPinMsg(null)
        const res = await fetch('/api/settings/pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPin, newPin }),
        })
        const data = await res.json()
        setPinMsg({ text: data.message, ok: res.ok })
        if (res.ok) { setCurrentPin(''); setNewPin(''); setConfirmPin('') }
        setSavingPin(false)
    }

    const handleCreateYear = async () => {
        setSavingYear(true)
        const res = await fetch('/api/academic-years', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        if (res.ok) {
            const data = await res.json()
            setYears(prev => [data, ...prev.map(y => form.isActive ? { ...y, isActive: false } : y)])
            setForm({ year: '', name: '', startDate: '', endDate: '', isActive: false })
        }
        setSavingYear(false)
    }

    const handleSetActive = async (id: number) => {
        await fetch(`/api/academic-years/${id}/activate`, { method: 'POST' })
        setYears(prev => prev.map(y => ({ ...y, isActive: y.id === id })))
    }

    const tabs = [
        { id: 'year' as const, label: 'ปีการศึกษา' },
        { id: 'pin' as const, label: 'เปลี่ยน PIN' },
    ]

    return (
        <div className="max-w-2xl space-y-5 animate-fade-up">
            {/* Tabs */}
            <div className="flex gap-1.5">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                        style={{
                            background: tab === t.id ? 'var(--leaf)' : 'white',
                            color: tab === t.id ? 'white' : 'var(--muted)',
                            border: `1px solid ${tab === t.id ? 'var(--leaf)' : 'var(--warm)'}`,
                            transition: 'all 0.15s var(--ease-out-quart)',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'year' && (
                <div className="space-y-5">
                    {/* Create year */}
                    <div className="card rounded-2xl p-5">
                        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>สร้างปีการศึกษาใหม่</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>ปี (พ.ศ.)</label>
                                <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2568" className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>ชื่อปีการศึกษา</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ปีการศึกษา 2568" className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>วันเริ่ม</label>
                                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>วันสิ้นสุด</label>
                                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field" />
                            </div>
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded w-4 h-4" />
                                    <span className="text-sm" style={{ color: 'var(--text)' }}>ตั้งเป็นปีการศึกษาปัจจุบัน</span>
                                </label>
                            </div>
                        </div>
                        <button onClick={handleCreateYear} disabled={savingYear || !form.year || !form.name} className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold btn-primary disabled:opacity-40">
                            {savingYear ? 'กำลังบันทึก...' : 'สร้างปีการศึกษา'}
                        </button>
                    </div>

                    {/* Year list */}
                    <div className="card rounded-2xl overflow-hidden">
                        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--warm)' }}>
                            <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>ปีการศึกษาทั้งหมด</h3>
                        </div>
                        {years.length === 0 ? (
                            <div className="py-10 text-center flex flex-col items-center">
                                <div className="mb-2"><CalendarDays size={36} color="var(--muted)" /></div>
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>ยังไม่มีปีการศึกษา</p>
                            </div>
                        ) : (
                            years.map(y => (
                                <div key={y.id} className="flex items-center gap-3 px-5 py-3 table-row" style={{ borderBottom: '1px solid var(--warm)' }}>
                                    <div className="w-2 h-8 rounded-full shrink-0" style={{ background: y.isActive ? 'var(--sage)' : 'var(--sand)' }} />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                            {y.name}
                                            {y.isActive && (
                                                <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'oklch(0.93 0.04 160)', color: 'var(--leaf)' }}>ปัจจุบัน</span>
                                            )}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                            {new Date(y.startDate).toLocaleDateString('th-TH')} — {new Date(y.endDate).toLocaleDateString('th-TH')}
                                        </p>
                                    </div>
                                    {!y.isActive && (
                                        <button onClick={() => handleSetActive(y.id)} className="text-xs px-3 py-1.5 rounded-lg btn-secondary font-semibold" style={{ color: 'var(--leaf)' }}>
                                            ตั้งเป็นปัจจุบัน
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {tab === 'pin' && (
                <div className="card rounded-2xl p-5">
                    <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>เปลี่ยน PIN เข้าระบบ</h3>

                    {pinMsg && (
                        <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{
                            background: pinMsg.ok ? 'oklch(0.93 0.04 160)' : 'oklch(0.95 0.04 25)',
                            color: pinMsg.ok ? 'var(--leaf)' : 'var(--coral)',
                        }}>
                            {pinMsg.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} 
                            {pinMsg.text}
                        </div>
                    )}

                    <div className="space-y-4">
                        {[
                            ['PIN ปัจจุบัน', currentPin, setCurrentPin, 'PIN ปัจจุบัน 6 หลัก'],
                            ['PIN ใหม่', newPin, setNewPin, 'PIN ใหม่ 6 หลัก'],
                            ['ยืนยัน PIN ใหม่', confirmPin, setConfirmPin, 'กรอก PIN ใหม่อีกครั้ง'],
                        ].map(([label, val, setter, ph]) => (
                            <div key={label as string}>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>{label as string}</label>
                                <input
                                    type="password" inputMode="numeric" maxLength={6}
                                    value={val as string}
                                    onChange={e => (setter as (v: string) => void)(e.target.value.replace(/\D/g, ''))}
                                    placeholder={ph as string}
                                    className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field"
                                />
                            </div>
                        ))}
                        <button onClick={handleChangePin} disabled={savingPin || newPin.length !== 6} className="w-full py-2.5 rounded-xl text-sm font-semibold btn-primary disabled:opacity-40">
                            {savingPin ? 'กำลังบันทึก...' : 'เปลี่ยน PIN'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}