'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import Modal from '@/app/components/ui/Modal'

const RELATIONS = ['แม่', 'พ่อ', 'ปู่', 'ย่า', 'ตา', 'ยาย', 'พี่เลี้ยง', 'อื่นๆ']

interface PickupDialogProps {
    open: boolean
    childNickname: string
    onClose: () => void
    onConfirm: (pickupName: string, pickupRelation: string) => Promise<void>
}

export default function PickupDialog({ open, childNickname, onClose, onConfirm }: PickupDialogProps) {
    const [relation, setRelation] = useState('')
    const [name, setName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        setSubmitting(true)
        await onConfirm(name, relation)
        setSubmitting(false)
        setRelation('')
        setName('')
    }

    const handleSkip = async () => {
        setSubmitting(true)
        await onConfirm('', '')
        setSubmitting(false)
        setRelation('')
        setName('')
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`รับ ${childNickname} กลับ`}
            icon={<LogOut size={18} color="var(--coral)" />}
            maxWidth="max-w-sm"
        >
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                ใครมารับ? (ไม่บังคับ — กด &quot;ข้ามไป&quot; ได้เลย)
            </p>

            {/* Relation buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
                {RELATIONS.map(r => (
                    <button
                        key={r}
                        onClick={() => setRelation(r)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                            background: relation === r ? 'var(--forest)' : 'var(--cream)',
                            color: relation === r ? 'white' : 'var(--text)',
                            border: `1px solid ${relation === r ? 'var(--forest)' : 'var(--warm)'}`,
                        }}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Name field */}
            <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ชื่อผู้มารับ (ไม่บังคับ)"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-4"
                style={{ border: '2px solid var(--warm)', background: 'var(--cream)', color: 'var(--text)' }}
            />

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleSkip}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    style={{ background: 'var(--cream)', color: 'var(--muted)', border: '1px solid var(--warm)' }}
                >
                    ข้ามไป
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--coral)' }}
                >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <><LogOut size={14} /> เช็กออก</>}
                </button>
            </div>
        </Modal>
    )
}
