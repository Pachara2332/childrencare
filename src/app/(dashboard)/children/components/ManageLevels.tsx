import { useState } from 'react'
import { School, CheckCircle2, Loader2, PlusCircle, AlertCircle, Zap } from 'lucide-react'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'
import { ClassLevel } from '../types'
import { getLevelColor } from '../utils'

export default function ManageLevels({
    yearId, levels, onRefresh,
}: {
    yearId: number
    levels: ClassLevel[]
    onRefresh: () => void
}) {
    const [form, setForm] = useState({
        code: '', name: '', minAgeMonths: '', maxAgeMonths: '', color: '#52B788', order: '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [editId, setEditId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<Partial<ClassLevel>>({})
    const [deleting, setDeleting] = useState<number | null>(null)
    const [confirmDeleteLevelId, setConfirmDeleteLevelId] = useState<number | null>(null)
    const [confirmEditLevelId, setConfirmEditLevelId] = useState<number | null>(null)

    const COLORS = [
        { hex: '#F4A261', label: 'ส้ม' },
        { hex: '#52B788', label: 'เขียว' },
        { hex: '#457B9D', label: 'น้ำเงิน' },
        { hex: '#E76F51', label: 'แดง' },
        { hex: '#E9C46A', label: 'เหลือง' },
        { hex: '#9B72CF', label: 'ม่วง' },
    ]

    const handleAdd = async () => {
        if (!form.code || !form.name) return setError('กรุณากรอก Code และชื่อระดับชั้น')
        setSaving(true); setError('')
        const res = await fetch(`/api/academic-years/${yearId}/levels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                minAgeMonths: Number(form.minAgeMonths),
                maxAgeMonths: Number(form.maxAgeMonths),
                order: Number(form.order || levels.length),
            }),
        })
        if (res.ok) {
            setForm({ code: '', name: '', minAgeMonths: '', maxAgeMonths: '', color: '#52B788', order: '' })
            onRefresh()
        } else {
            const d = await res.json()
            setError(d.message ?? 'เกิดข้อผิดพลาด')
        }
        setSaving(false)
    }

    const handleEdit = async (id: number) => {
        setConfirmEditLevelId(null)
        await fetch(`/api/academic-years/${yearId}/levels/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        })
        setEditId(null)
        onRefresh()
    }

    const handleDelete = async (id: number) => {
        setConfirmDeleteLevelId(null)
        setDeleting(id)
        const res = await fetch(`/api/academic-years/${yearId}/levels/${id}`, { method: 'DELETE' })
        if (!res.ok) {
            const d = await res.json()
            alert(d.message)
        } else {
            onRefresh()
        }
        setDeleting(null)
    }

    const inputStyle = {
        border: '1px solid var(--warm)',
        background: 'white',
        color: 'var(--text)',
    }

    return (
        <div className="space-y-5 max-w-2xl">
            {/* Current levels */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
                <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--warm)' }}>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>ระดับชั้นในปีการศึกษานี้</h3>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{levels.length} ระดับ</span>
                </div>

                {levels.length === 0 ? (
                    <div className="py-10 text-center">
                        <School size={48} className="mx-auto mb-3" style={{ color: 'var(--muted)', opacity: 0.3 }} />
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>ยังไม่มีระดับชั้น</p>
                    </div>
                ) : (
                    levels.map(lv => {
                        const c = getLevelColor(lv.color)
                        const isEdit = editId === lv.id

                        return (
                            <div
                                key={lv.id}
                                className="px-5 py-3.5"
                                style={{ borderBottom: '1px solid var(--warm)' }}
                            >
                                {isEdit ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>ชื่อระดับชั้น</label>
                                                <input
                                                    value={editForm.name ?? lv.name}
                                                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                                    style={inputStyle}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>สี</label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {COLORS.map(col => (
                                                        <button
                                                            key={col.hex}
                                                            onClick={() => setEditForm(f => ({ ...f, color: col.hex }))}
                                                            className="w-7 h-7 rounded-full border-2 transition-transform"
                                                            style={{
                                                                background: col.hex,
                                                                borderColor: (editForm.color ?? lv.color) === col.hex ? 'var(--text)' : 'transparent',
                                                                transform: (editForm.color ?? lv.color) === col.hex ? 'scale(1.2)' : 'scale(1)',
                                                            }}
                                                            title={col.label}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>อายุขั้นต่ำ (เดือน)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.minAgeMonths ?? lv.minAgeMonths}
                                                    onChange={e => setEditForm(f => ({ ...f, minAgeMonths: Number(e.target.value) }))}
                                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                                    style={inputStyle}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>อายุสูงสุด (เดือน)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.maxAgeMonths ?? lv.maxAgeMonths}
                                                    onChange={e => setEditForm(f => ({ ...f, maxAgeMonths: Number(e.target.value) }))}
                                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                                    style={inputStyle}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setConfirmEditLevelId(lv.id)}
                                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                                                style={{ background: 'var(--leaf)' }}
                                            >
                                                <CheckCircle2 size={16} /> บันทึก
                                            </button>
                                            <button
                                                onClick={() => { setEditId(null); setEditForm({}) }}
                                                className="px-4 py-2 rounded-xl text-xs font-semibold"
                                                style={{ background: 'var(--cream)', color: 'var(--text)' }}
                                            >
                                                ยกเลิก
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-10 rounded-full shrink-0" style={{ background: lv.color }} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: c.bg, color: c.text }}
                                                >
                                                    {lv.code}
                                                </span>
                                                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                                                    {lv.name}
                                                </span>
                                            </div>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                                อายุ {lv.minAgeMonths}–{lv.maxAgeMonths} เดือน
                                                ({Math.floor(lv.minAgeMonths / 12)} ปี – {Math.floor(lv.maxAgeMonths / 12)} ปี)
                                                · {lv._count?.enrollments ?? 0} คน
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => { setEditId(lv.id); setEditForm({}) }}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                style={{ background: '#EFF4FF', color: 'var(--sky)' }}
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteLevelId(lv.id)}
                                                disabled={deleting === lv.id}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                                                style={{ background: '#FFF0ED', color: 'var(--coral)' }}
                                            >
                                                {deleting === lv.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'ลบ'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Add new level */}
            <div
                className="rounded-2xl p-5"
                style={{ background: 'white', border: '1px solid var(--warm)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    <PlusCircle size={18} /> เพิ่มระดับชั้นใหม่
                </h3>

                {error && (
                    <div className="mb-3 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2" style={{ background: '#FFF0ED', color: 'var(--coral)' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                            Code <span style={{ color: 'var(--coral)' }}>*</span>
                        </label>
                        <input
                            value={form.code}
                            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                            placeholder="KG0"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                            ชื่อระดับชั้น <span style={{ color: 'var(--coral)' }}>*</span>
                        </label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="เตรียมอนุบาล"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                            อายุขั้นต่ำ (เดือน)
                        </label>
                        <input
                            type="number"
                            value={form.minAgeMonths}
                            onChange={e => setForm(f => ({ ...f, minAgeMonths: e.target.value }))}
                            placeholder="24"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                            อายุสูงสุด (เดือน)
                        </label>
                        <input
                            type="number"
                            value={form.maxAgeMonths}
                            onChange={e => setForm(f => ({ ...f, maxAgeMonths: e.target.value }))}
                            placeholder="35"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={inputStyle}
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>สีประจำชั้น</label>
                        <div className="flex gap-3 flex-wrap">
                            {COLORS.map(col => (
                                <button
                                    key={col.hex}
                                    onClick={() => setForm(f => ({ ...f, color: col.hex }))}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all"
                                    style={{
                                        background: form.color === col.hex ? col.hex : 'white',
                                        borderColor: form.color === col.hex ? col.hex : 'var(--warm)',
                                        color: form.color === col.hex ? 'white' : 'var(--muted)',
                                    }}
                                >
                                    <span
                                        className="w-3 h-3 rounded-full inline-block"
                                        style={{ background: col.hex }}
                                    />
                                    {col.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleAdd}
                    disabled={saving}
                    className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: 'var(--leaf)' }}
                >
                    {saving ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</> : <><PlusCircle size={16} /> เพิ่มระดับชั้น</>}
                </button>
            </div>

            {/* Quick presets */}
            <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--cream)', border: '1px solid var(--warm)' }}
            >
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    <Zap size={18} style={{ color: 'var(--sun)' }} /> เพิ่มระดับชั้นมาตรฐานด่วน
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { code: 'KG0', name: 'เตรียมอนุบาล', min: 24, max: 35, color: '#F4A261' },
                        { code: 'KG1', name: 'อนุบาล 1', min: 36, max: 47, color: '#52B788' },
                        { code: 'KG2', name: 'อนุบาล 2', min: 48, max: 59, color: '#457B9D' },
                        { code: 'KG3', name: 'อนุบาล 3', min: 60, max: 83, color: '#E76F51' },
                    ].map((preset, i) => {
                        const exists = levels.some(l => l.code === preset.code)
                        return (
                            <button
                                key={preset.code}
                                disabled={exists}
                                onClick={async () => {
                                    await fetch(`/api/academic-years/${yearId}/levels`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            code: preset.code, name: preset.name,
                                            minAgeMonths: preset.min, maxAgeMonths: preset.max,
                                            color: preset.color, order: i,
                                        }),
                                    })
                                    onRefresh()
                                }}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                                style={{
                                    background: exists ? 'var(--warm)' : 'white',
                                    border: `1px solid var(--warm)`,
                                    color: exists ? 'var(--sand)' : 'var(--text)',
                                }}
                            >
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: preset.color }} />
                                <span>{preset.name}</span>
                                {exists && <span className="ml-auto text-xs flex items-center gap-1" style={{ color: 'var(--sage)' }}><CheckCircle2 size={14} /> มีแล้ว</span>}
                            </button>
                        )
                    })}
                </div>
            </div>

            <ConfirmDialog
                open={confirmDeleteLevelId !== null}
                onClose={() => setConfirmDeleteLevelId(null)}
                onConfirm={() => confirmDeleteLevelId && handleDelete(confirmDeleteLevelId)}
                title="ลบระดับชั้นนี้?"
                description="เมื่อลบแล้วจะไม่สามารถกู้คืนได้ กรุณาตรวจสอบก่อนดำเนินการ"
                confirmLabel="ลบระดับชั้น"
                variant="danger"
                loading={deleting !== null}
            />

            <ConfirmDialog
                open={confirmEditLevelId !== null}
                onClose={() => setConfirmEditLevelId(null)}
                onConfirm={() => confirmEditLevelId && handleEdit(confirmEditLevelId)}
                title="บันทึกการแก้ไข?"
                description="ยืนยันการแก้ไขข้อมูลระดับชั้นนี้"
                confirmLabel="บันทึก"
                variant="warning"
            />
        </div>
    )
}
