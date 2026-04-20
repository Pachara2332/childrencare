// app/(dashboard)/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, AlertCircle, MapPin } from 'lucide-react'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'

interface AcademicYear {
    id: number; year: string; name: string
    startDate: string; endDate: string; isActive: boolean
}

export default function SettingsPage() {
    const [tab, setTab] = useState<'pin' | 'year' | 'location'>('year')

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
    const [confirmActiveYearId, setConfirmActiveYearId] = useState<number | null>(null)
    const [activatingYearId, setActivatingYearId] = useState<number | null>(null)
    const [locationConfig, setLocationConfig] = useState({ lat: 0, lng: 0, radius: 100, enabled: false })
    const [savingLocation, setSavingLocation] = useState(false)

    useEffect(() => {
        fetch('/api/academic-years')
            .then(r => r.ok ? r.json() : [])
            .then(setYears)
            .catch(() => setYears([]))
        fetch('/api/config/location')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) setLocationConfig({ lat: data.lat || 0, lng: data.lng || 0, radius: data.radius || 100, enabled: data.enabled || false })
            })
            .catch(() => { /* silently fail — use defaults */ })
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
        setActivatingYearId(id)
        const res = await fetch(`/api/academic-years/${id}/activate`, { method: 'POST' })
        const data = await res.json()
        if (data.message && data.message !== 'ตั้งปีการศึกษาปัจจุบันสำเร็จ') {
            alert(data.message)
        }
        setYears(prev => prev.map(y => ({ ...y, isActive: y.id === id })))
        setActivatingYearId(null)
        setConfirmActiveYearId(null)
    }

    const tabs = [
        { id: 'year' as const, label: 'ปีการศึกษา', icon: <CalendarDays size={18} /> },
        { id: 'location' as const, label: 'พิกัด (GPS)', icon: <MapPin size={18} /> },
        { id: 'pin' as const, label: 'รหัสลับ (PIN)', icon: <AlertCircle size={18} /> },
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="col-span-1 sm:col-span-2">
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
                                <div key={y.id} className="flex items-center gap-3 px-4 py-3 sm:px-5 flex-wrap" style={{ borderBottom: '1px solid var(--warm)' }}>
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
                                        <button onClick={() => setConfirmActiveYearId(y.id)} className="text-xs px-3 py-1.5 rounded-lg btn-secondary font-semibold" style={{ color: 'var(--leaf)' }}>
                                            ตั้งเป็นปัจจุบัน
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {tab === 'location' && (
                <div className="card rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DBE9F4', color: 'var(--sky)' }}>
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>พิกัดที่ตั้งศูนย์พัฒนาเด็กเล็ก (GPS)</h2>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>กำหนดพื้นที่เพื่อป้องกันผู้ปกครองเช็กชื่อนอกสถานที่</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-md">
                        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: locationConfig.enabled ? 'var(--leaf)' : 'var(--warm)' }}>
                            <input type="checkbox" className="w-5 h-5 rounded text-green-600 focus:ring-green-500" checked={locationConfig.enabled} onChange={e => setLocationConfig(prev => ({ ...prev, enabled: e.target.checked }))} />
                            <div>
                                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>เปิดใช้งานการป้องกันด้วยตำแหน่ง (GPS)</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>ถ้าเปิด ผู้ปกครองต้องอยู่ใกล้จุดนี้ถึงจะกดเช็กชื่อได้</p>
                            </div>
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>ละติจูด (Latitude)</label>
                                <input type="number" step="any" value={locationConfig.lat || ''} onChange={e => setLocationConfig(prev => ({ ...prev, lat: parseFloat(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl border text-sm input-field" placeholder="17.447697" disabled={!locationConfig.enabled} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>ลองจิจูด (Longitude)</label>
                                <input type="number" step="any" value={locationConfig.lng || ''} onChange={e => setLocationConfig(prev => ({ ...prev, lng: parseFloat(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl border text-sm input-field" placeholder="104.470998" disabled={!locationConfig.enabled} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>รัศมีที่อนุญาต (เมตร)</label>
                            <input type="number" value={locationConfig.radius} onChange={e => setLocationConfig(prev => ({ ...prev, radius: parseInt(e.target.value) || 100 }))} className="w-full px-3 py-2.5 rounded-xl border text-sm input-field" disabled={!locationConfig.enabled} />
                            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>แนะนำ: 50-100 เมตร เพื่อเผื่อพื้นที่ลานจอดรถและหน้าประตู</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-4">
                            <button
                                onClick={() => {
                                    if (!navigator.geolocation) { alert('เบราว์เซอร์ไม่รองรับ GPS'); return }
                                    navigator.geolocation.getCurrentPosition(
                                        pos => setLocationConfig(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })),
                                        err => alert('ดึงตำแหน่งไม่ได้ กรุณาอนุญาต Location Permission ในเบราว์เซอร์')
                                    )
                                }}
                                disabled={!locationConfig.enabled}
                                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                                ดึงด้วย GPS เครื่องนี้ 📍
                            </button>
                            <button
                                onClick={async () => {
                                    setSavingLocation(true)
                                    await fetch('/api/config/location', { method: 'POST', body: JSON.stringify(locationConfig) })
                                    setSavingLocation(false)
                                    alert('บันทึกการตั้งค่าพิกัดเรียบร้อยแล้ว')
                                }}
                                disabled={savingLocation || !locationConfig.enabled && false}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold btn-primary flex-1 disabled:opacity-50"
                            >
                                {savingLocation ? 'กำลังบันทึก...' : 'บันทึกพิกัด'}
                            </button>
                        </div>
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

            <ConfirmDialog
                open={confirmActiveYearId !== null}
                onClose={() => setConfirmActiveYearId(null)}
                onConfirm={() => confirmActiveYearId && handleSetActive(confirmActiveYearId)}
                title="ตั้งเป็นปีการศึกษาปัจจุบัน?"
                description="ระบบทั้งหมดจะถูกสลับไปใช้ปีการศึกษานี้ ระบบอาจจะทำการเลื่อนชั้นเตรียมอนุบาลและจบการศึกษาอนุบาล 1 ให้อัตโนมัติหากเปลี่ยนจากปีอื่น ยืนยันข้อมูลถูกต้องใช่หรือไม่?"
                confirmLabel="ยืนยันตั้งค่า"
                variant="info"
                loading={activatingYearId !== null}
            />
        </div>
    )
}