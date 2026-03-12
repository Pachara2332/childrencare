import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const monthStr = searchParams.get('month')
  const yearStr = searchParams.get('year')

  const month = monthStr ? Number(monthStr) : new Date().getMonth() + 1
  const year = yearStr ? Number(yearStr) : new Date().getFullYear()

  try {
    const academicYear = await prisma.academicYear.findFirst({
        where: { isActive: true }
    });

    if (!academicYear) {
         return NextResponse.json({ error: 'No active academic year' }, { status: 400 });
    }

    const enrollments = await prisma.childEnrollment.findMany({
        where: { academicYearId: academicYear.id, status: 'active' },
        include: { child: true }
    });

    const children = enrollments.map(e => e.child);
    const totalChildren = children.length;
    const maleCount = children.filter(c => c.gender === 'male').length;
    const femaleCount = children.filter(c => c.gender === 'female').length;

    // Today's attendance
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23,59,59,999);
    
    // Checkins count today
    const checkinsTodayCount = await prisma.checkIn.count({
        where: {
            date: {
                gte: today,
                lte: todayEnd
            }
        }
    });

    // Payments summary
    const payments = await prisma.payment.findMany({
        where: { academicYearId: academicYear.id, month, year }
    });

    const paySumMap = {
        paid: { count: 0, amount: 0 },
        pending: { count: 0, amount: 0 },
        overdue: { count: 0, amount: 0 },
    };

    payments.forEach(p => {
        const totalAmount = p.tuitionFee + p.foodFee + p.otherFee;
        let status = p.status;
        if (status === 'pending' && p.dueDate < new Date()) {
            status = 'overdue';
        }
        if (paySumMap[status as keyof typeof paySumMap]) { 
            paySumMap[status as keyof typeof paySumMap].count++;
            paySumMap[status as keyof typeof paySumMap].amount += totalAmount;
        }
    });

    const paymentSummary = Object.entries(paySumMap).map(([status, data]) => ({
        status, ...data
    }));

    const totalRevenue = paySumMap.paid.amount;
    const pendingRevenue = paySumMap.pending.amount + paySumMap.overdue.amount;

    const childrenList = children.map(c => {
        const ageDifMs = Date.now() - c.dateOfBirth.getTime();
        const ageDate = new Date(ageDifMs);
        const ageYear = Math.abs(ageDate.getUTCFullYear() - 1970);
        
        return {
            code: c.code,
            name: `${c.firstName} ${c.lastName}`,
            nickname: c.nickname,
            age: `${ageYear} ปี`,
            parent: c.parentName,
            phone: c.parentPhone,
            attendanceRate: 100, // TODO: calculate actual rate from checkIn history
            disease: c.disease
        }
    });
    
    // Check config for center name
    let centerName = "ศูนย์พัฒนาเด็กเล็ก";
    let location = "-";
    
    const config = await prisma.appConfig.findMany();
    config.forEach(c => {
        if (c.key === 'center_name') centerName = (c.value as any)?.name || centerName;
        if (c.key === 'center_location') location = (c.value as any)?.location || location;
    });

    return NextResponse.json({
        centerName,
        location,
        academicYear: academicYear.name,
        totalChildren,
        maleCount,
        femaleCount,
        teacherCount: 2, // Default mock count
        avgAttendance: 95, // Default mock count
        presentToday: checkinsTodayCount,
        totalRevenue,
        pendingRevenue,
        monthlyAttendance: [
             { month: thaiMonths[month > 2 ? month-3 : 0] || 'ม.ค.', rate: 90, count: totalChildren },
             { month: thaiMonths[month > 1 ? month-2 : 0] || 'ก.พ.', rate: 92, count: totalChildren },
             { month: thaiMonths[month-1] || 'มี.ค.', rate: 95, count: totalChildren },
        ],
        paymentSummary,
        childrenList
    });

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
