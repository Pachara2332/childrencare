'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, Check, X, PlusCircle, Search } from 'lucide-react'

export default function LeavesPage() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'pending' | 'history'>('pending')
    const [showCreate, setShowCreate] = useState(false)

    // Form
    const [children, setChildren] = useState<any[]>([])
    const [childId, setChildId] = useState('')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [reasonType, setReasonType] = useState('ลาป่วย')
    const [reasonDetail, setReasonDetail] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchRequests()
        fetchChildren()
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/leave-requests')
            if (res.ok) setRequests(await res.json())
        } finally {
            setLoading(false)
        }
    }

    const fetchChildren = async () => {
        const res = await fetch('/api/children')
        if (res.ok) {
            const data = await res.json()
            setChildren(data)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!childId || !startDate || !endDate || !reasonType) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/leave-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    childId, startDate, endDate, reasonType, reasonDetail, requestedBy: 'teacher (ครูผู้ดูแล)'
                })
            })
            if (res.ok) {
                setShowCreate(false)
                setChildId('')
                fetchRequests()
            } else {
                alert('เกิดข้อผิดพลาดในการสร้างใบลา')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleApprove = async (id: number) => {
        if (!confirm('ยืนยันอนุมัติการลานี้? (ระบบจะลง Check-in เป็นลากิจ/ลาป่วย อัตโนมัติ)')) return
        try {
            const res = await fetch(`/api/leave-requests/${id}/approve`, { method: 'PATCH' })
            if (res.ok) fetchRequests()
            else alert('เกิดข้อผิดพลาดในการรับรอง')
        } catch(e) {
            alert('Cannot approve this request.')
        }
    }

    const pendingReqs = requests.filter(r => r.status === 'pending')
    const historyReqs = requests.filter(r => r.status !== 'pending')

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8 pb-24">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>จัดการลางาน</h1>
                    <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>พิจารณาใบลาของนักเรียนและบันทึกใบลา</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-primary rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
                    <PlusCircle size={18} /> <span className="hidden sm:inline">บันทึกใบลา</span>
                </button>
            </header>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setTab('pending')}
                    className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${tab === 'pending' ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                    style={{ background: tab === 'pending' ? 'white' : 'transparent', color: 'var(--text)' }}
                >
                    รอพิจารณา ({pendingReqs.length})
                </button>
                <button
                    onClick={() => setTab('history')}
                    className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${tab === 'history' ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                    style={{ background: tab === 'history' ? 'white' : 'transparent', color: 'var(--text)' }}
                >
                    ประวัติการลา
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-sm text-gray-500">กำลังโหลด...</div>
            ) : (
                <div className="space-y-4">
                    {(tab === 'pending' ? pendingReqs : historyReqs).map(req => (
                        <div key={req.id} className="card p-5 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <div>
                                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                                    {req.child.nickname} {req.child.firstName} {req.child.lastName}
                                </h3>
                                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                    วันที่: {new Date(req.startDate).toLocaleDateString('th-TH')} - {new Date(req.endDate).toLocaleDateString('th-TH')}
                                    <span className="mx-2">•</span>
                                    ประเภท: {req.reasonType} {req.reasonDetail ? `(${req.reasonDetail})` : ''}
                                </div>
                                <div className="text-xs mt-1 text-gray-400">ขอโดย: {req.requestedBy}</div>
                            </div>

                            {req.status === 'pending' ? (
                                <button onClick={() => handleApprove(req.id)} className="shrink-0 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110" style={{ background: 'var(--leaf)' }}>
                                    <Check size={16} /> อนุมัติการลา
                                </button>
                            ) : (
                                <span className={`shrink-0 px-3 py-1 text-xs font-semibold rounded-lg ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {req.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                                </span>
                            )}
                        </div>
                    ))}
                    {(tab === 'pending' ? pendingReqs : historyReqs).length === 0 && (
                        <div className="text-center py-10" style={{ color: 'var(--muted)' }}>
                            <CalendarClock size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">ไม่มีใบลา{tab === 'pending' ? 'ที่รอพิจารณา' : 'ในเวลานี้'}</p>
                        </div>
                    )}
                </div>
            )}

            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-xl relative" style={{ background: 'var(--cream)' }}>
                        <button onClick={() => setShowCreate(false)} className="absolute right-6 top-6 opacity-50 hover:opacity-100">
                            <X size={20} />
                        </button>
                        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>บันทึกใบลา</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>นักเรียน</label>
                                <select value={childId} onChange={e => setChildId(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field bg-white">
                                    <option value="">- เลือกนักเรียน -</option>
                                    {children.map(c => <option key={c.id} value={c.id}>{c.nickname} {c.firstName}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>วันเริ่มต้น</label>
                                    <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field bg-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>สิ้นสุด</label>
                                    <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field bg-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>ประเภทการลา</label>
                                <select value={reasonType} onChange={e => setReasonType(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field bg-white">
                                    <option value="ลาป่วย">ลาป่วย</option>
                                    <option value="ลากิจ">ลากิจ</option>
                                    <option value="อื่นๆ">อื่นๆ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>รายละเอียด / เหตุผล (ไม่บังคับ)</label>
                                <input type="text" value={reasonDetail} onChange={e => setReasonDetail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm input-field bg-white" placeholder="..." />
                            </div>
                            <button type="submit" disabled={submitting} className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold btn-primary disabled:opacity-50">
                                {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลและอนุมัติทันที'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
