import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const events: any[] = body.events || []
        
        await Promise.all(events.map(handleEvent))
        
        return new NextResponse('OK', { status: 200 })
    } catch (error) {
        console.error('LINE Webhook Error:', error)
        return new NextResponse('Error', { status: 500 })
    }
}

const handleEvent = async (event: any) => {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }

    const text: string = event.message.text;
    const userId = event.source.userId;
    const replyToken = event.replyToken;
    
    if (!userId || !replyToken) return null;

    if (text.startsWith('#ผูกบัญชี') || text.startsWith('#bind')) {
        const parts = text.split(' ')
        if (parts.length < 2) {
             return replyText(replyToken, '❌ โปรดระบุรหัสนักเรียน\nตัวอย่าง: #ผูกบัญชี C101')
        }
        const code = parts[1].trim().toUpperCase()
        
        const child = await prisma.child.findFirst({
            where: { code: code }
        })
        
        if (!child) {
             return replyText(replyToken, `❌ ไม่พบรหัสนักเรียน ${code} ในระบบศูนย์เด็กเล็ก`)
        }
        
        await prisma.child.update({
            where: { id: child.id },
            data: { lineUserId: userId }
        })
        
        return replyText(replyToken, `✅ ผูกบัญชีสำเร็จ!\n\nน้อง: ${child.firstName} ${child.lastName} (${child.nickname})\n\nต่อยอดจากนี้ไประบบจะแจ้งเตือนการเช็คชื่อเข้า/ออก และอัพเดทต่างๆ ของน้องมาที่ช่องแชทนี้นะครับ`)
    }
    
    if (text.startsWith('#ยกเลิกผูกบัญชี') || text.startsWith('#unbind')) {
        const child = await prisma.child.findFirst({
            where: { lineUserId: userId }
        })
        if (child) {
            await prisma.child.update({
                where: { id: child.id },
                data: { lineUserId: null }
            })
            return replyText(replyToken, `ยกเลิกการผูกบัญชีสำเร็จแล้วครับ`)
        } else {
            return replyText(replyToken, `คุณยังไม่ได้ผูกบัญชีกับนักเรียนคนใดครับ`)
        }
    }
    
    // Default reply
    return replyText(replyToken, 'สวัสดีครับ!\nศูนย์พัฒนาเด็กเล็กยินดีต้อนรับ\n\n📌 พิมพ์ `#ผูกบัญชี รหัสนักเรียน` เช่น `#ผูกบัญชี C101` เพื่อรับข่าวสารอัตโนมัติประจำวันของนักเรียนครับ')
}

const replyText = async (replyToken: string, text: string) => {
    const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!LINE_ACCESS_TOKEN) return null;
    
    await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
            replyToken: replyToken,
            messages: [{ type: 'text', text }]
        })
    })
}
