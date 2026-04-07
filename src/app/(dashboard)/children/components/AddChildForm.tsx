import { useState, useEffect } from 'react'
import { Baby, Cake, Users, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { AcademicYear } from '../types'
import { calcAge } from '../utils'

export default function AddChildForm({
    years, selectedYearId, onSuccess,
}: {
    years: AcademicYear[]
    selectedYearId: number | null
    onSuccess: () => void
}) {
    const activeYear = years.find(y => y.id === selectedYearId)
    const levels = activeYear?.classLevels ?? []

    const [form, setForm] = useState({
        firstName: '', lastName: '', nickname: '',
        gender: 'male', dateOfBirth: '',
        bloodType: '', disease: '', allergy: '',
        parentName: '', parentPhone: '', parentPhone2: '',
        parentRelation: 'mother', address: '',
        academicYearId: selectedYearId ?? '',
        levelId: levels[0]?.id ?? '',
    })

    // Sync levelId if levels change or on mount
    useEffect(() => {
        if (!form.levelId && levels.length > 0) {
            setForm(f => ({ ...f, levelId: levels[0].id }))
        }
    }, [levels, form.levelId])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Auto-suggest level from age
    const suggestLevel = (dob: string) => {
        if (!dob || levels.length === 0) return
        const { months } = calcAge(dob)
        const match = levels.find(l => months >= l.minAgeMonths && months <= l.maxAgeMonths)
        if (match) setForm(f => ({ ...f, levelId: match.id }))
    }

    const set = (k: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const val = e.target.value
            setForm(f => ({ ...f, [k]: val }))
            if (k === 'dateOfBirth') suggestLevel(val)
        }

    const handleSubmit = async () => {
        setSaving(true); setError('')
        const res = await fetch('/api/children', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.message); setSaving(false); return }
        onSuccess()
    }

    const inputClass = "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
    const inputStyle = { border: '1px solid var(--warm)', background: 'white', color: 'var(--text)' }
    const label = (text: string, req = false) => (
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
            {text} {req && <span style={{ color: 'var(--coral)' }}>*</span>}
        </label>
    )

    return (
        <div
            className="rounded-2xl p-6 max-w-2xl"
            style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
            <h2 className="font-bold text-base mb-5 flex items-center gap-1.5" style={{ color: 'var(--text)' }}><Baby size={20} /> เพิ่มข้อมูลเด็กใหม่</h2>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{ background: '#FFF0ED', color: 'var(--coral)' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {/* ปีการศึกษา */}
                <div>
                    {label('ปีการศึกษา', true)}
                    <select
                        value={form.academicYearId}
                        onChange={e => setForm(f => ({ ...f, academicYearId: Number(e.target.value) }))}
                        className={inputClass}
                        style={inputStyle}
                    >
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                </div>

                {/* ระดับชั้น */}
                <div>
                    {label('ระดับชั้น', true)}
                    <select
                        value={form.levelId}
                        onChange={e => setForm(f => ({ ...f, levelId: Number(e.target.value) }))}
                        className={inputClass}
                        style={inputStyle}
                    >
                        {levels.length === 0 ? (
                            <option value="">— ไม่มีระดับชั้น —</option>
                        ) : (
                            levels.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.name} ({Math.floor(l.minAgeMonths / 12)}–{Math.floor(l.maxAgeMonths / 12)} ปี)
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div>{label('ชื่อจริง', true)}<input value={form.firstName} onChange={set('firstName')} placeholder="ชื่อจริง" className={inputClass} style={inputStyle} /></div>
                <div>{label('นามสกุล', true)}<input value={form.lastName} onChange={set('lastName')} placeholder="นามสกุล" className={inputClass} style={inputStyle} /></div>
                <div>{label('ชื่อเล่น', true)}<input value={form.nickname} onChange={set('nickname')} placeholder="ชื่อเล่น" className={inputClass} style={inputStyle} /></div>
                <div>
                    {label('เพศ', true)}
                    <select value={form.gender} onChange={set('gender')} className={inputClass} style={inputStyle}>
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                    </select>
                </div>
                <div>
                    {label('วันเกิด', true)}
                    <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inputClass} style={inputStyle} />
                    {form.dateOfBirth && (
                        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--sage)' }}>
                            <Cake size={12} /> อายุ {calcAge(form.dateOfBirth).text}
                        </p>
                    )}
                </div>
                <div>
                    {label('กรุ๊ปเลือด')}
                    <select value={form.bloodType} onChange={set('bloodType')} className={inputClass} style={inputStyle}>
                        <option value="">ไม่ทราบ</option>
                        {['A', 'B', 'AB', 'O'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div>{label('โรคประจำตัว')}<input value={form.disease} onChange={set('disease')} placeholder="ถ้าไม่มีเว้นว่าง" className={inputClass} style={inputStyle} /></div>
                <div>{label('ภูมิแพ้/แพ้ยา')}<input value={form.allergy} onChange={set('allergy')} placeholder="ถ้าไม่มีเว้นว่าง" className={inputClass} style={inputStyle} /></div>

                <div className="col-span-2 pt-2" style={{ borderTop: '1px solid var(--warm)' }}>
                    <p className="text-sm font-bold mb-3 mt-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}><Users size={16} /> ข้อมูลผู้ปกครอง</p>
                </div>

                <div>{label('ชื่อผู้ปกครอง', true)}<input value={form.parentName} onChange={set('parentName')} placeholder="ชื่อ-นามสกุล" className={inputClass} style={inputStyle} /></div>
                <div>
                    {label('ความสัมพันธ์', true)}
                    <select value={form.parentRelation} onChange={set('parentRelation')} className={inputClass} style={inputStyle}>
                        <option value="mother">แม่</option>
                        <option value="father">พ่อ</option>
                        <option value="guardian">ผู้ปกครอง</option>
                    </select>
                </div>
                <div>{label('เบอร์โทร', true)}<input value={form.parentPhone} onChange={set('parentPhone')} placeholder="08x-xxx-xxxx" className={inputClass} style={inputStyle} /></div>
                <div>{label('เบอร์สำรอง')}<input value={form.parentPhone2} onChange={set('parentPhone2')} placeholder="ไม่บังคับ" className={inputClass} style={inputStyle} /></div>
                <div className="col-span-2">
                    {label('ที่อยู่')}
                    <textarea value={form.address} onChange={set('address')} rows={2} placeholder="ที่อยู่" className={inputClass} style={{ ...inputStyle, resize: 'none' }} />
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={saving || !form.levelId}
                className="mt-5 w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--leaf)' }}
            >
                {saving ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</> : <><CheckCircle2 size={16} /> บันทึกข้อมูล</>}
            </button>
        </div>
    )
}
