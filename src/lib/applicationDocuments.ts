export type ApplicationDocumentType =
  | 'parent_id_copy'
  | 'birth_certificate'
  | 'house_registration'
  | 'child_photo'

export interface ApplicationDocumentDefinition {
  type: ApplicationDocumentType
  label: string
  description: string
  maxFiles: number
  required: boolean
  childDocumentType: string
}

export interface StoredApplicationDocument {
  type: ApplicationDocumentType
  label: string
  fileName: string
  mimeType: string
  fileSize: number
  url: string
}

export const APPLICATION_DOCUMENT_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf'

export const APPLICATION_DOCUMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
])

export const APPLICATION_DOCUMENTS: ApplicationDocumentDefinition[] = [
  {
    type: 'parent_id_copy',
    label: 'สำเนาบัตรประชาชนผู้ปกครอง/พ่อแม่',
    description: 'รองรับไฟล์ JPG, PNG, WEBP หรือ PDF แนบได้หลายไฟล์',
    maxFiles: 4,
    required: true,
    childDocumentType: 'parent_id',
  },
  {
    type: 'birth_certificate',
    label: 'สำเนาใบเกิด',
    description: 'แนบไฟล์สูติบัตรหรือใบเกิดอย่างน้อย 1 ไฟล์',
    maxFiles: 2,
    required: true,
    childDocumentType: 'birth_certificate',
  },
  {
    type: 'house_registration',
    label: 'สำเนาทะเบียนบ้านพ่อแม่',
    description: 'แนบได้หลายหน้า ทั้งแบบรูปภาพและ PDF',
    maxFiles: 4,
    required: true,
    childDocumentType: 'house_registration',
  },
  {
    type: 'child_photo',
    label: 'รูปถ่ายนักเรียน 1.5 นิ้ว',
    description: 'อัปโหลดได้สูงสุด 3 ไฟล์',
    maxFiles: 3,
    required: true,
    childDocumentType: 'other',
  },
]

export function isApplicationDocumentType(value: string): value is ApplicationDocumentType {
  return APPLICATION_DOCUMENTS.some((item) => item.type === value)
}

export function getApplicationDocumentLabel(type: string) {
  return APPLICATION_DOCUMENTS.find((item) => item.type === type)?.label ?? type
}
