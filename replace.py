import sys
import re

file_path = r'c:\Users\Asus\childcare\src\app\(dashboard)\children\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
import_str = "import { School, Search, Baby, Cake, User, Activity, Loader2, Plus, AlertCircle, Check, Zap, Users, Download, Copy, Sparkles, Eye, MapPin } from 'lucide-react'\n"
if "lucide-react" not in content:
    content = content.replace("import { Skeleton } from '@/app/components/ui/Skeleton'", "import { Skeleton } from '@/app/components/ui/Skeleton'\n" + import_str)

replacements = [
    (r'<div className="text-2xl mb-1">🏫</div>', r'<div className="mb-1"><School size={24} color="currentColor"/></div>'),
    (r'<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: \'var\(--muted\)\' }}>🔍</span>', r'<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: \'var(--muted)\' }} />'),
    (r'<p className="text-5xl mb-3">👶</p>', r'<div className="mb-3 flex justify-center"><Baby size={48} color="var(--muted)" /></div>'),
    (r'🎂 \{ageText\}', r'<span className="flex items-center gap-1"><Cake size={12}/>{ageText}</span>'),
    (r'👤 \{e\.child\.parentName\}', r'<span className="flex items-center gap-1"><User size={12}/>{e.child.parentName}</span>'),
    (r'🏥 \{e\.child\.disease\}', r'<span className="flex items-center gap-1"><Activity size={12}/>{e.child.disease}</span>'),
    (r' movingId === e\.child\.id \? \'⏳\' : \'ย้าย\'', r' movingId === e.child.id ? <Loader2 size={14} className="animate-spin" /> : \'ย้าย\''),
    (r'<p className="text-3xl mb-2">🏫</p>', r'<div className="mb-2 flex justify-center"><School size={36} color="var(--muted)" /></div>'),
    (r'✅ บันทึก', r'<span className="flex items-center gap-1"><Check size={16}/>บันทึก</span>'),
    (r' deleting === lv\.id \? \'⏳\' : \'ลบ\'', r' deleting === lv.id ? <Loader2 size={14} className="animate-spin" /> : \'ลบ\''),
    (r'➕ เพิ่มระดับชั้นใหม่', r'<span className="flex items-center gap-1"><Plus size={16}/>เพิ่มระดับชั้นใหม่</span>'),
    (r'⚠️ \{error\}', r'<span className="flex items-center gap-1"><AlertCircle size={14}/>{error}</span>'),
    (r' saving \? \'⏳ กำลังบันทึก...\' : \'✅ เพิ่มระดับชั้น\'', r' saving ? <span className="flex items-center gap-1 justify-center"><Loader2 size={16} className="animate-spin" />กำลังบันทึก...</span> : <span className="flex items-center gap-1 justify-center"><Check size={16}/>เพิ่มระดับชั้น</span>'),
    (r'⚡ เพิ่มระดับชั้นมาตรฐานด่วน', r'<span className="flex items-center gap-1"><Zap size={16}/>เพิ่มระดับชั้นมาตรฐานด่วน</span>'),
    (r'👶 เพิ่มข้อมูลเด็กใหม่', r'<span className="flex items-center gap-1"><Baby size={16}/>เพิ่มข้อมูลเด็กใหม่</span>'),
    (r'👨‍👩‍👧 ข้อมูลผู้ปกครอง', r'<span className="flex items-center gap-1"><Users size={16}/>ข้อมูลผู้ปกครอง</span>'),
    (r' saving \? \'⏳ กำลังบันทึก...\' : \'✅ บันทึกข้อมูล\'', r' saving ? <span className="flex items-center gap-1 justify-center"><Loader2 size={16} className="animate-spin" />กำลังบันทึก...</span> : <span className="flex items-center gap-1 justify-center"><Check size={16}/>บันทึกข้อมูล</span>'),
    (r'📥 นำเข้าข้อมูลเด็กจาก JSON', r'<span className="flex items-center gap-1"><Download size={16}/>นำเข้าข้อมูลเด็กจาก JSON</span>'),
    (r'📋 คัดลอกตัวอย่างไปใช้', r'<span className="flex items-center gap-1 justify-center"><Copy size={16}/>คัดลอกตัวอย่างไปใช้</span>'),
    (r'✨ พร้อมนำเข้า ', r'<span className="flex items-center gap-1"><Sparkles size={16}/>พร้อมนำเข้า </span>'),
    (r'✅ นำเข้าสำเร็จ ', r'<span className="flex items-center gap-1"><Check size={16}/>นำเข้าสำเร็จ </span>'),
    (r'👁️ ตรวจสอบ JSON', r'<span className="flex items-center gap-1 justify-center"><Eye size={16}/>ตรวจสอบ JSON</span>'),
    (r' saving \? \'⏳ กำลังนำเข้า...\' : \'📥 เริ่มนำเข้าข้อมูล\'', r' saving ? <span className="flex items-center gap-1 justify-center"><Loader2 size={16} className="animate-spin" />กำลังนำเข้า...</span> : <span className="flex items-center gap-1 justify-center"><Download size={16}/>เริ่มนำเข้าข้อมูล</span>'),
    (r'!preview \? "⚠️ กรุณาตรวจสอบรูปแบบ JSON ให้ถูกต้อง" : !selectedLevelId \? "📍 กรุณาคลิกเลือกระดับชั้นที่ต้องการนำเข้าข้อมูล" : ""', r'!preview ? <span className="flex items-center gap-1 justify-center"><AlertCircle size={14}/>กรุณาตรวจสอบรูปแบบ JSON ให้ถูกต้อง</span> : !selectedLevelId ? <span className="flex items-center gap-1 justify-center"><MapPin size={14}/>กรุณาคลิกเลือกระดับชั้นที่ต้องการนำเข้าข้อมูล</span> : ""'),
    (r'🎂 อายุ ', r'<span className="flex items-center gap-1"><Cake size={12}/>อายุ </span>'),
    (r'✓ มีแล้ว', r'<span className="flex items-center gap-1"><Check size={12}/>มีแล้ว</span>'),
]

for opt, new_val in replacements:
    content = re.sub(opt, new_val, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
