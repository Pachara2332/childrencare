import { useState, useEffect } from 'react'
import { Download, Copy, Sparkles, AlertCircle, CheckCircle2, Eye, MapPin, Loader2 } from 'lucide-react'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'
import { ClassLevel } from '../types'
import { getLevelColor } from '../utils'

export default function ImportJSON({
    selectedYearId, levels, onSuccess,
}: {
    selectedYearId: number | null
    levels: ClassLevel[]
    onSuccess: () => void
}) {
    const [json, setJson] = useState('')
    const [selectedLevelId, setSelectedLevelId] = useState<number | ''>('')
    const [preview, setPreview] = useState<unknown[] | null>(null)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [confirmImport, setConfirmImport] = useState(false)
    const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)

    const example = JSON.stringify([
        {
            firstName: 'สมหมาย', lastName: 'รักดี', nickname: 'หมาย', gender: 'male',
            dateOfBirth: '2022-06-15', parentName: 'นางสุมาลี รักดี', parentPhone: '085-555-1234',
            parentRelation: 'mother', disease: ''
        },
        {
            firstName: 'มาลีวัลย์', lastName: 'ดีงาม', nickname: 'มาลี', gender: 'female',
            dateOfBirth: '2021-03-20', parentName: 'นายสมชาย ดีงาม', parentPhone: '089-876-5432',
            parentRelation: 'father'
        },
    ], null, 2)

    // Auto-validate when JSON or selectedLevelId changes
    useEffect(() => {
        if (json.trim()) {
            try {
                const d = JSON.parse(json)
                setPreview(Array.isArray(d) ? d : [d])
                setError('')
            } catch {
                setPreview(null)
                // Don't set error while typing, only if explicit validate is clicked or on blur
            }
        } else {
            setPreview(null)
            setError('')
        }
    }, [json])

    // Default to first level if none selected but levels exist
    useEffect(() => {
        if (!selectedLevelId && levels.length > 0) {
            setSelectedLevelId(levels[0].id)
        }
    }, [levels, selectedLevelId])

    const validate = (val = json) => {
        setError(''); setPreview(null); setResult(null)
        if (!val.trim()) return
        try {
            const d = JSON.parse(val)
            setPreview(Array.isArray(d) ? d : [d])
        } catch {
            setError('JSON ไม่ถูกต้อง (กรุณาเช็ควงเล็บหรือเครื่องหมายคำพูด)')
        }
    }

    const handleImport = async () => {
        if (!preview || !selectedLevelId) return
        setSaving(true)
        try {
            const res = await fetch('/api/children/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ children: preview, academicYearId: selectedYearId, levelId: Number(selectedLevelId) }),
            })
            const data = await res.json()
            setResult(data)
            if (data.errors?.length === 0) {
                setTimeout(onSuccess, 1500)
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
        }
        setSaving(false)
        setConfirmImport(false)
    }

    const isButtonDisabled = !preview || saving || !selectedLevelId

    return (
        <div
            className="rounded-2xl p-6 max-w-3xl"
            style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
            <h2 className="font-bold text-base mb-1 flex items-center gap-1.5" style={{ color: 'var(--text)' }}><Download size={20} /> นำเข้าข้อมูลเด็กจาก JSON</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>วางข้อมูล JSON แล้วเลือกระดับชั้นที่ต้องการเพิ่ม</p>

            {/* Level selector */}
            <div className="mb-4">
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                    เพิ่มเข้าระดับชั้น <span style={{ color: 'var(--coral)' }}>*</span>
                    {levels.length === 0 && <span className="ml-2 font-normal">(กรุณาสร้างระดับชั้นก่อน ที่เมนู "จัดการระดับชั้น")</span>}
                </label>
                {levels.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                        {levels.map(lv => {
                            const c = getLevelColor(lv.color)
                            const active = selectedLevelId === lv.id
                            return (
                                <button
                                    key={lv.id}
                                    onClick={() => setSelectedLevelId(lv.id)}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                                    style={{
                                        background: active ? lv.color : 'white',
                                        borderColor: active ? lv.color : 'var(--warm)',
                                        color: active ? 'white' : c.text,
                                    }}
                                >
                                    {lv.name}
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <div className="p-3 rounded-xl border-2 border-dashed border-rose-200 bg-rose-50 text-rose-600 text-xs text-center">
                        ยังไม่ได้สร้างระดับชั้นในปีการศึกษานี้
                    </div>
                )}
            </div>

            <details className="mb-3 group">
                <summary className="text-xs cursor-pointer font-semibold list-none flex items-center gap-1" style={{ color: 'var(--sage)' }}>
                    <span className="group-open:rotate-90 transition-transform">▶</span> ดูตัวอย่าง JSON
                </summary>
                <div className="mt-2 text-xs">
                    <pre className="p-3 rounded-xl overflow-auto max-h-48" style={{ background: 'var(--cream)', color: 'var(--text)' }}>
                        {example}
                    </pre>
                    <button
                        onClick={() => {
                            setJson(example)
                            validate(example)
                        }}
                        className="mt-2 px-3 py-1.5 rounded-lg text-white font-semibold flex items-center justify-center gap-1.5"
                        style={{ background: 'var(--leaf)' }}
                    >
                        <Copy size={16} /> คัดลอกตัวอย่างไปใช้
                    </button>
                </div>
            </details>

            <textarea
                value={json}
                onChange={e => {
                    setJson(e.target.value)
                    if (error) setError('') // Clear error when typing
                }}
                onBlur={() => validate()}
                rows={8}
                placeholder='[ { "firstName": "...", ... } ]'
                className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none"
                style={{ border: '1px solid var(--warm)', background: 'var(--cream)', color: 'var(--text)', resize: 'vertical' }}
            />

            {error && <p className="mt-1 text-xs flex items-center gap-1" style={{ color: 'var(--coral)' }}><AlertCircle size={14} /> {error}</p>}

            {preview && (
                <div className="mt-3 p-3 rounded-xl" style={{ background: '#E8F5EE' }}>
                    <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--leaf)' }}>
                        <Sparkles size={16} /> พร้อมนำเข้า {preview.length} รายการ
                        {!selectedLevelId && <span className="text-rose-500 font-normal ml-1">(กรุณาเลือกระดับชั้นด้านบน)</span>}
                    </p>
                    <div className="mt-1 space-y-0.5">
                        {preview.slice(0, 3).map((item, i) => {
                            const c = item as { nickname?: string; firstName?: string; lastName?: string }
                            return <p key={i} className="text-[11px]" style={{ color: 'var(--text)' }}>{i + 1}. {c.nickname || '-'} — {c.firstName || '-'} {c.lastName || '-'}</p>
                        })}
                        {preview.length > 3 && <p className="text-[10px]" style={{ color: 'var(--muted)' }}>... และอีก {preview.length - 3} รายการ</p>}
                    </div>
                </div>
            )}

            {result && (
                <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: result.errors.length === 0 ? '#D8F3DC' : '#FFF8E8' }}>
                    <p className="font-bold flex items-center gap-1"><CheckCircle2 size={16} /> นำเข้าสำเร็จ {result.imported} คน</p>
                    {result.errors.length > 0 && (
                        <div className="mt-1 text-rose-500 max-h-24 overflow-y-auto">
                            {result.errors.map((e, i) => <p key={i}>• {e}</p>)}
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-3 mt-4">
                <button
                    onClick={() => validate()}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                    style={{ background: 'white', color: 'var(--text)', border: '1px solid var(--warm)' }}
                >
                    <Eye size={16} /> ตรวจสอบ JSON
                </button>
                <button
                    onClick={() => setConfirmImport(true)}
                    disabled={isButtonDisabled}
                    className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${isButtonDisabled ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'}`}
                    style={{ background: 'var(--leaf)' }}
                >
                    <Download size={16} /> เริ่มนำเข้าข้อมูล
                </button>
            </div>
            {isButtonDisabled && json.trim() && (
                <div className="mt-3 p-2.5 rounded-xl text-center text-[11px] bg-amber-50 border border-amber-200" style={{ color: 'var(--sun)' }}>
                    {!preview ? <span className="flex items-center justify-center gap-1"><AlertCircle size={14} /> กรุณาตรวจสอบรูปแบบ JSON ให้ถูกต้อง</span> : !selectedLevelId ? <span className="flex items-center justify-center gap-1"><MapPin size={14} /> กรุณาคลิกเลือกระดับชั้นที่ต้องการนำเข้าข้อมูล</span> : ""}
                </div>
            )}

            <ConfirmDialog
                open={confirmImport}
                onClose={() => setConfirmImport(false)}
                onConfirm={handleImport}
                title="ยืนยันการนำเข้าข้อมูล JSON"
                description={`คุณกำลังจะนำเข้าข้อมูลเด็กจำนวน ${preview?.length ?? 0} คน เข้าระดับชั้นที่เลือก เมื่อนำเข้าแล้วระบบจะสร้างทะเบียนรายบุคคลทันที ยืนยันใช่หรือไม่?`}
                confirmLabel="เริ่มนำเข้า"
                variant="success"
                loading={saving}
            />
        </div>
    )
}
