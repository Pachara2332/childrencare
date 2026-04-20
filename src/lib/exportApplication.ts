export function exportApplicationPDF(app: any) {
  const title = "ใบสมัครศูนย์พัฒนาเด็กเล็ก"
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>${title} - ${app.childFirstName} ${app.childLastName}</title>
  <style>
    @page { size: A4 portrait; margin: 20mm; }
    body { font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; color: #333; line-height: 1.6; }
    h1 { text-align: center; margin-bottom: 24px; font-size: 24px; }
    .section { margin-bottom: 20px; border: 1px solid #ddd; padding: 16px; border-radius: 8px; }
    .section-title { font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 12px; font-size: 16px; color: #2E7D32; }
    .row { display: flex; margin-bottom: 8px; }
    .col { flex: 1; }
    .label { font-weight: bold; width: 140px; display: inline-block; color: #555; }
    .value { color: #000; }
    .footer { text-align: right; margin-top: 40px; }
    .signature { margin-top: 60px; display: flex; justify-content: flex-end; }
    .signature div { text-align: center; width: 250px; }
    .signature div p { border-top: 1px dashed #777; padding-top: 8px; margin-top: 40px; }
  </style>
</head>
<body onload="setTimeout(()=>window.print(),400)">
  <h1>${title}</h1>
  
  <div class="row" style="justify-content: flex-end; margin-bottom: 10px; font-size: 14px;">
    <span><b>วันที่สมัคร:</b> ${new Date(app.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}</span>
  </div>

  <div class="section">
    <div class="section-title">ข้อมูลส่วนตัวนักเรียน</div>
    <div class="row">
      <div class="col"><span class="label">ชื่อ-นามสกุล:</span> <span class="value">${app.childFirstName} ${app.childLastName}</span></div>
      <div class="col"><span class="label">ชื่อเล่น:</span> <span class="value">${app.childNickname}</span></div>
    </div>
    <div class="row">
      <div class="col"><span class="label">วัน/เดือน/ปีเกิด:</span> <span class="value">${new Date(app.childDateOfBirth).toLocaleDateString('th-TH')}</span></div>
      <div class="col"><span class="label">เพศ:</span> <span class="value">${app.childGender === 'M' ? 'ชาย' : 'หญิง'}</span></div>
    </div>
    <div class="row">
      <div class="col"><span class="label">หมู่เลือด:</span> <span class="value">${app.childBloodType || '-'}</span></div>
      <div class="col"><span class="label">ศาสนา:</span> <span class="value">${app.childReligion || '-'}</span></div>
    </div>
    <div class="row">
      <div class="col"><span class="label">โรคประจำตัว:</span> <span class="value">${app.disease || '-'}</span></div>
      <div class="col"><span class="label">ประวัติแพ้ยา/อาหาร:</span> <span class="value">${app.allergy || '-'}</span></div>
    </div>
    <div class="row">
      <div class="col"><span class="label">ระดับชั้นที่สมัคร:</span> <span class="value">${app.level?.name || 'อนุบาล'}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ข้อมูลผู้ดูแล / ผู้ติดต่อฉุกเฉิน</div>
    <div class="row">
      <div class="col"><span class="label">ชื่อ-นามสกุลผู้ดูแล:</span> <span class="value">${app.parentName}</span></div>
    </div>
    <div class="row">
      <div class="col"><span class="label">ความสัมพันธ์:</span> <span class="value">${app.parentRelation}</span></div>
    </div>
    <div class="row">
      <div class="col"><span class="label">เบอร์โทรศัพท์:</span> <span class="value">${app.parentPhone}</span></div>
    </div>
    <div class="row" style="align-items: flex-start;">
      <div class="col" style="display: flex;">
        <span class="label">ที่อยู่ปัจจุบัน:</span> 
        <span class="value" style="flex:1;">${app.addressHouseNo} ${app.addressSoi ? 'ซอย ' + app.addressSoi : ''} ${app.addressRoad ? 'ถนน ' + app.addressRoad : ''} 
        ต./แขวง ${app.addressSubDistrict} อ./เขต ${app.addressDistrict} 
        จ.${app.addressProvince} ${app.addressZipCode}</span>
      </div>
    </div>
  </div>

  <div class="signature">
    <div>
      <p>ผู้ปกครอง / ผู้สมัคร</p>
      <div style="margin-top: 5px;">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
    </div>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
