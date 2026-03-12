import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const monthStr = searchParams.get('month')
  const yearStr = searchParams.get('year')
  const type = searchParams.get('type')

  if (!type) {
    return new NextResponse('Type missing', { status: 400 })
  }

  try {
    const academicYear = await prisma.academicYear.findFirst({
        where: { isActive: true }
    });

    const enrollments = academicYear ? await prisma.childEnrollment.findMany({
        where: { academicYearId: academicYear.id, status: 'active' },
        include: { child: true }
    }) : [];

    const children = enrollments.map(e => e.child);

    if (type === 'csv') {
      let csvContent = "\uFEFFรหัส,ชื่อ-นามสกุล,ชื่อเล่น,วันเกิด,ผู้ปกครอง,เบอร์ติดต่อ,โรคประจำตัว\n";
      
      children.forEach(c => {
         const row = [
             c.code,
             `${c.firstName} ${c.lastName}`,
             c.nickname,
             c.dateOfBirth.toISOString().split('T')[0],
             c.parentName,
             c.parentPhone,
             c.disease || '-'
         ].map(v => `"${v}"`).join(',');
         csvContent += row + "\n";
      });

      return new NextResponse(csvContent, {
          headers: {
             'Content-Type': 'text/csv; charset=utf-8',
             'Content-Disposition': `attachment; filename="report_${yearStr}_${monthStr}.csv"`
          }
      });
    } else if (type === 'pdf') {
       // Since no PDF library is setup, returning HTML that prints itself.
       // The UI already saves it as .html based on the code check.
       const htmlContent = `
       <html>
       <head>
          <meta charset="utf-8">
          <title>Report - ${monthStr}/${yearStr}</title>
          <style>
             body { font-family: sans-serif; padding: 20px; color: #333; }
             h2 { text-align: center; margin-bottom: 5px; }
             .center-info { text-align: center; margin-bottom: 20px; font-size: 14px; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
             th { background-color: #f8f9fa; }
             .header-info { display: flex; justify-content: space-between; margin-bottom: 15px; }
          </style>
       </head>
       <body onload="setTimeout(() => window.print(), 500)">
          <h2>รายงานประจำเดือน</h2>
          <div class="center-info">
             เดือน ${monthStr} ปี ${yearStr} | ปีการศึกษา ${academicYear?.name || '-'}
          </div>
          
          <div class="header-info">
             <div><strong>จำนวนเด็กทั้งหมด:</strong> ${children.length} คน</div>
             <div><strong>วันที่พิมพ์:</strong> ${new Date().toLocaleDateString('th-TH')}</div>
          </div>

          <table>
            <thead>
               <tr>
                  <th>รหัส</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>ชื่อเล่น</th>
                  <th>ผู้ปกครอง</th>
                  <th>เบอร์ติดต่อ</th>
               </tr>
            </thead>
            <tbody>
               ${children.map(c => `
                  <tr>
                     <td>${c.code}</td>
                     <td>${c.firstName} ${c.lastName}</td>
                     <td>${c.nickname}</td>
                     <td>${c.parentName}</td>
                     <td>${c.parentPhone}</td>
                  </tr>
               `).join('')}
               ${children.length === 0 ? '<tr><td colspan="5" style="text-align: center">ไม่พบข้อมูล</td></tr>' : ''}
            </tbody>
          </table>
       </body>
       </html>
       `;
       return new NextResponse(htmlContent, {
          headers: {
             'Content-Type': 'text/html; charset=utf-8',
             'Content-Disposition': `attachment; filename="report_${yearStr}_${monthStr}.html"`
          }
      });
    }

    return new NextResponse('Invalid type', { status: 400 });
  } catch (error) {
    console.error(error);
    return new NextResponse('Export failed', { status: 500 });
  }
}
