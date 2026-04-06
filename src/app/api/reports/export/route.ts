import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import {
  EnrollmentStatus,
  enrollmentStatusLabels,
  normalizeEnrollmentStatus,
} from '@/lib/enrollmentStatus'
import { getStudentReport } from '@/lib/studentReports'

function formatStatusDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('th-TH')
}

function reportTitle(status: EnrollmentStatus | 'all') {
  return status === 'all'
    ? 'รายงานนักเรียนทั้งหมด'
    : `รายงานนักเรียนสถานะ ${enrollmentStatusLabels[status]}`
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = Number(searchParams.get('month') ?? new Date().getMonth() + 1)
  const year = Number(searchParams.get('year') ?? new Date().getFullYear())
  const type = searchParams.get('type')
  const status = normalizeEnrollmentStatus(searchParams.get('status'))

  if (!type) {
    return new NextResponse('Type missing', { status: 400 })
  }

  try {
    const report = await getStudentReport({ month, year, status })

    if (!report) {
      return new NextResponse('No active academic year', { status: 400 })
    }

    const safeStatus = status === 'all' ? 'all' : status

    if (type === 'csv') {
      let csvContent =
        '\uFEFFรหัส,ชื่อ-นามสกุล,ชื่อเล่น,ระดับชั้น,สถานะ,วันที่สถานะ,เหตุผล,ผู้ปกครอง,เบอร์โทร,อัตราเข้าเรียน,โรคประจำตัว\n'

      report.childrenList.forEach((child) => {
        const row = [
          child.code,
          child.name,
          child.nickname,
          `${child.levelName} (${child.levelCode})`,
          child.statusLabel,
          formatStatusDate(child.statusDate),
          child.statusReason || '-',
          child.parent,
          child.phone,
          `${child.attendanceRate}%`,
          child.disease || '-',
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(',')
        csvContent += `${row}\n`
      })

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="student-report-${safeStatus}-${year}-${String(month).padStart(2, '0')}.csv"`,
        },
      })
    }

    if (type === 'pdf') {
      const htmlContent = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle(status)}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #24322b; }
          h1 { text-align: center; margin-bottom: 4px; }
          .sub { text-align: center; margin-bottom: 20px; color: #5f6f66; }
          .summary { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
          .card { border: 1px solid #dfe7de; border-radius: 12px; padding: 12px 14px; min-width: 140px; }
          .card strong { display: block; font-size: 18px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #dfe7de; padding: 10px; text-align: left; vertical-align: top; }
          th { background: #f5f7f4; }
        </style>
      </head>
      <body onload="setTimeout(() => window.print(), 500)">
        <h1>${reportTitle(status)}</h1>
        <div class="sub">${report.centerName} | ${report.location} | ปีการศึกษา ${report.academicYear}</div>
        <div class="summary">
          <div class="card"><strong>${report.totalChildren}</strong>นักเรียนตามตัวกรอง</div>
          <div class="card"><strong>${report.statusSummary.active}</strong>กำลังเรียน</div>
          <div class="card"><strong>${report.statusSummary.leave}</strong>ย้ายออก</div>
          <div class="card"><strong>${report.statusSummary.graduated}</strong>จบการศึกษา</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อ</th>
              <th>ชั้น</th>
              <th>สถานะ</th>
              <th>วันที่สถานะ</th>
              <th>เหตุผล</th>
              <th>ผู้ปกครอง</th>
              <th>เบอร์โทร</th>
            </tr>
          </thead>
          <tbody>
            ${report.childrenList
              .map(
                (child) => `
              <tr>
                <td>${child.code}</td>
                <td>${child.nickname}<br />${child.name}</td>
                <td>${child.levelName} (${child.levelCode})</td>
                <td>${child.statusLabel}</td>
                <td>${formatStatusDate(child.statusDate)}</td>
                <td>${child.statusReason || '-'}</td>
                <td>${child.parent}</td>
                <td>${child.phone}</td>
              </tr>`
              )
              .join('')}
            ${
              report.childrenList.length === 0
                ? '<tr><td colspan="8" style="text-align:center">ไม่พบข้อมูล</td></tr>'
                : ''
            }
          </tbody>
        </table>
      </body>
      </html>`

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="student-report-${safeStatus}-${year}-${String(month).padStart(2, '0')}.html"`,
        },
      })
    }

    return new NextResponse('Invalid type', { status: 400 })
  } catch (error) {
    console.error(error)
    return new NextResponse('Export failed', { status: 500 })
  }
}
