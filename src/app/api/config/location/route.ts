import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const CONFIG_KEY = 'school_location'

export async function GET(req: NextRequest) {
    const config = await prisma.appConfig.findUnique({
        where: { key: CONFIG_KEY }
    })

    if (!config) {
        return NextResponse.json({
            lat: null,
            lng: null,
            radius: 100, // default radius
            enabled: false
        })
    }

    return NextResponse.json(config.value)
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session.isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { lat, lng, radius, enabled } = body

        const updated = await prisma.appConfig.upsert({
            where: { key: CONFIG_KEY },
            update: {
                value: { lat, lng, radius, enabled }
            },
            create: {
                key: CONFIG_KEY,
                value: { lat, lng, radius, enabled }
            }
        })

        return NextResponse.json({ message: 'บันทึกพิกัดศูนย์ฯ สำเร็จ', config: updated.value })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
    }
}
