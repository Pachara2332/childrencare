import { useState } from 'react'
import useSWR from 'swr'
import { Trash2, AlertTriangle, GraduationCap } from 'lucide-react'
import ConfirmDialog from '@/app/components/ui/ConfirmDialog'
import { Child } from '../types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function GraduatedChildren({ onRefreshMain }: { onRefreshMain?: () => void }) {
    const { data: children = [], isLoading, mutate } = useSWR<Partial<Child>[]>('/api/children/graduated', fetcher)
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const toggleAll = () => {
        if (selectedIds.length === children.length) setSelectedIds([])
        else setSelectedIds(children.map(c => c.id!))
    }

    const toggleOne = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch('/api/children/graduated', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ childIds: selectedIds })
            })
            const data = await res.json()
            if (res.ok) {
                alert(data.message)
                setSelectedIds([])
                mutate()
                if (onRefreshMain) onRefreshMain()
            } else {
                alert(data.error || 'เกิดข้อผิดพลาด')
            }
        } catch {
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์')
        } finally {
            setDeleting(false)
            setConfirmDelete(false)
        }
    }

    return (
        <div className="card rounded-2xl p-5 border" style={{ borderColor: 'var(--coral)' }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-500">
                    <GraduationCap size={20} />
                </div>
                <div className="flex-1">
                    <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>ลบข้อมูลเด็กที่จบการศึกษาแล้ว</h2>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>เด็กล่าสุดที่พ้นสภาพหรือจบการศึกษา (อ.1) จะถูกแสดงที่นี่ เพื่อให้สามารถลบข้อมูลออกจากระบบได้</p>
                </div>
            </div>

            {isLoading ? (
                <div className="py-10 text-center text-sm text-gray-400">กำลังโหลดข้อมูล...</div>
            ) : children.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed bg-gray-50 flex flex-col items-center">
                    <GraduationCap size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">ไม่พบข้อมูลเด็กที่จบการศึกษาแล้ว</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                            <input
                                type="checkbox"
                                checked={selectedIds.length === children.length && children.length > 0}
                                onChange={toggleAll}
                                className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                            />
                            เลือกทั้งหมด ({children.length} คน)
                        </label>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            disabled={selectedIds.length === 0 || deleting}
                            className="btn-danger px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                        >
                            <Trash2 size={16} /> ลบ {selectedIds.length} รายการ
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {children.map(child => (
                            <label
                                key={child.id}
                                className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors"
                                style={{ borderColor: selectedIds.includes(child.id!) ? 'var(--coral)' : 'var(--warm)' }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(child.id!)}
                                    onChange={() => toggleOne(child.id!)}
                                    className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                                />
                                <div>
                                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{child.nickname} {child.firstName} {child.lastName}</p>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>รหัส: {child.code}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                title="ยืนยันการลบข้อมูลถาวร"
                description={`คุณกำลังจะลบข้อมูลเด็กจำนวน ${selectedIds.length} คน ข้อมูลการเช็กชื่อ พัฒนาการ และประวัติทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้ ยืนยันใช่หรือไม่?`}
                confirmLabel="ลบถาวร"
                variant="danger"
                loading={deleting}
            />
        </div>
    )
}
