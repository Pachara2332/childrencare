'use client'

import { useState } from 'react'
import { CalendarX2, Loader2 } from 'lucide-react'
import Modal from '@/app/components/ui/Modal'

const REASONS = ['ลาป่วย', 'ลากิจ', 'หยุดพักผ่อน', 'เหตุผลอื่นๆ']

interface AbsenceDialogProps {
    open: boolean
    childNickname: string
    onClose: () => void
    onConfirm: (reason: string, note: string) => Promise<void>
}

export default function AbsenceDialog({ open, childNickname, onClose, onConfirm }: AbsenceDialogProps) {
    const [reason, setReason] = useState('ลาป่วย')
    const [note, setNote] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        setSubmitting(true)
        await onConfirm(reason, note)
        setSubmitting(false)
        setNote('')
        setReason('ลาป่วย')
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`แจ้งลา: ${childNickname}`}
            icon={<CalendarX2 size={18} color="var(--blue)" />}
            maxWidth="max-w-sm"
        >
            <p className="text-sm mb-4" style={{ color: 'var(--text)' }}>
                ระบุสาเหตุการลาในวันนี้
            </p>

            {/* Reason buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
                {REASONS.map(r => (
                    <button
                        key={r}
                        onClick={() => setReason(r)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                            background: reason === r ? 'var(--blue)' : 'var(--cream)',
                            color: reason === r ? 'white' : 'var(--text)',
                            border: `1px solid ${reason === r ? 'var(--blue)' : 'var(--warm)'}`,
                        }}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Optional note field */}
            <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-4"
                style={{ border: '2px solid var(--warm)', background: 'var(--cream)', color: 'var(--text)' }}
            />

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    style={{ background: 'var(--cream)', color: 'var(--muted)', border: '1px solid var(--warm)' }}
                >
                    ยกเลิก
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--blue)' }}
                >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <><CalendarX2 size={14} /> ยืนยันการลา</>}
                </button>
            </div>
        </Modal>
    )
}
