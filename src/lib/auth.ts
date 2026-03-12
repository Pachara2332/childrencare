// lib/auth.ts
import { prisma } from './prisma'
import { getSession } from './session'
import { redirect } from 'next/navigation'

export async function verifyPin(pin: string): Promise<boolean> {
  const config = await prisma.appConfig.findUnique({
    where: { key: 'pin' }
  })
  
  if (!config) {
    // Default PIN: 123456 (first run)
    return pin === '123456'
  }
  
  return (config.value as { pin: string }).pin === pin
}

export async function requireAuth() {
  const session = await getSession()
  if (!session.isAuthenticated) {
    redirect('/')
  }
  return session
}