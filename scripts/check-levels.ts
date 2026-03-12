import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true }, include: { classLevels: true } })
  console.log('--- Active Year ---')
  console.log(JSON.stringify(activeYear, null, 2))
  
  const allLevels = await prisma.classLevel.findMany()
  console.log('--- All Levels ---')
  console.log(JSON.stringify(allLevels, null, 2))
}

main().finally(() => prisma.$disconnect())
