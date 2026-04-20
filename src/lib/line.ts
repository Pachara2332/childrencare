export const pushMessage = async (to: string, text: string) => {
    const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!LINE_ACCESS_TOKEN || !to) return false;
    
    try {
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                to: to,
                messages: [{ type: 'text', text }]
            })
        })
        if (!res.ok) {
            console.error('LINE Push Error:', await res.text())
            return false;
        }
        return true;
    } catch(e) {
        console.error('Push failed', e)
        return false;
    }
}
