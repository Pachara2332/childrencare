import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, docId: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
  const { id, docId } = await params
  
  await prisma.childDocument.delete({
    where: { id: Number(docId), childId: Number(id) }
  })
  
  return NextResponse.json({ success: true })
}
