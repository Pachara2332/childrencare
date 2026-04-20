import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  
  const documents = await prisma.childDocument.findMany({
    where: { childId: Number(id) },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(documents)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  
  const body = await req.json()
  const { type, url } = body
  
  if (!type || !url)
     return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
     
  const document = await prisma.childDocument.create({
    data: {
      childId: Number(id),
      type,
      url 
    }
  })
  
  return NextResponse.json(document)
}
