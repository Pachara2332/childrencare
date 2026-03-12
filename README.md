# ระบบบริหารจัดการศูนย์พัฒนาเด็กเล็ก (Childcare Management)

โปรเจกต์ Next.js สำหรับบริหารจัดการข้อมูลเด็ก พัฒนาการ การเช็กชื่อ และค่าใช้จ่ายภายในศูนย์พัฒนาเด็กเล็ก

## 🌟 ฟีเจอร์เด่น
- **Dashboard**: สรุปภาพรวมสถานะเด็ก รายรับ และกิจกรรมประจำวัน
- **Check-in**: ระบบเช็กชื่อผ่าน QR Code และบันทึกด้วยตนเองโดยครู
- **Development**: ติดตามการเจริญเติบโตและคะแนนพัฒนาการ 5 ด้าน
- **Announcements**: ระบบประกาศข่าวสารให้ผู้ปกครอง
- **Payments**: ระบบจัดการค่าเทอมและค่าอาหารรายเดือน

## 💻 Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/)
- **Database**: [Prisma](https://www.prisma.io/) + PostgreSQL
- **State**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Auth**: [Iron Session](https://github.com/vvo/iron-session) (PIN Authentication)

## 🚦 การเริ่มต้นใช้งาน

1. ติดตั้ง Dependencies:
```bash
npm install
```

2. ตั้งค่า Database:
```bash
npx prisma generate
npx prisma db push
```

3. รันโปรเจกต์:
```bash
npm run dev
```

4. เข้าใช้งาน:
- **PIN เริ่มต้น**: `123456`

---
*ดูรายละเอียดเพิ่มเติมได้ที่ [Project Documentation](file:///c:/Users/Asus/.gemini/antigravity/brain/26c35091-fcd8-4f63-baf1-b5e2d8851efe/project_documentation.md)*
