'use client'

import { CalendarDays, GraduationCap, LogOut, RotateCcw } from 'lucide-react'
import Modal from '@/app/components/ui/Modal'
import { EnrollmentStatus, enrollmentStatusLabels } from '@/lib/enrollmentStatus'

interface EnrollmentStatusDialogProps {
  open: boolean
  action: EnrollmentStatus
  loading?: boolean
  date: string
  reason: string
  onClose: () => void
  onDateChange: (value: string) => void
  onReasonChange: (value: string) => void
  onConfirm: () => void
}

const actionConfig: Record<
  EnrollmentStatus,
  {
    title: string
    icon: React.ReactNode
    buttonBg: string
  }
> = {
  active: {
    title: 'กลับมาเป็นกำลังเรียน',
    icon: <RotateCcw size={18} />,
    buttonBg: 'var(--leaf)',
  },
  leave: {
    title: 'บันทึกย้ายออก',
    icon: <LogOut size={18} />,
    buttonBg: 'var(--coral)',
  },
  graduated: {
    title: 'บันทึกจบการศึกษา',
    icon: <GraduationCap size={18} />,
    buttonBg: 'var(--sun)',
  },
}

export default function EnrollmentStatusDialog({
  open,
  action,
  loading = false,
  date,
  reason,
  onClose,
  onDateChange,
  onReasonChange,
  onConfirm,
}: EnrollmentStatusDialogProps) {
  const config = actionConfig[action]
  const isActive = action === 'active'

  return (
    <Modal open={open} onClose={onClose} title={config.title} icon={config.icon}>
      <div className="space-y-4">
        <p className="text-sm leading-7" style={{ color: 'var(--muted)' }}>
          {isActive
            ? 'ใช้กรณีต้องการเปิดสถานะนักเรียนกลับมาเป็นกำลังเรียนอีกครั้ง'
            : `ระบบจะบันทึกสถานะเป็น "${enrollmentStatusLabels[action]}" พร้อมวันที่และเหตุผล`}
        </p>

        {!isActive && (
          <>
            <label className="block">
              <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                <CalendarDays size={14} />
                วันที่มีผล
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className="input-field w-full rounded-xl px-3 py-2.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                เหตุผล
              </span>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                className="input-field w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ resize: 'vertical' }}
                placeholder="ระบุเหตุผล เช่น ย้ายโรงเรียนตามผู้ปกครอง หรือจบหลักสูตรประจำปี"
              />
            </label>
          </>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--cream)', color: 'var(--text)', borderColor: 'var(--warm)' }}
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: config.buttonBg }}
          >
            {loading ? 'กำลังบันทึก...' : config.title}
          </button>
        </div>
      </div>
    </Modal>
  )
}
