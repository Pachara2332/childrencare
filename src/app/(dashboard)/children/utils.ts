export function calcAge(dob: string) {
    const b = new Date(dob), n = new Date()
    let birthYear = b.getFullYear()
    if (birthYear > 2400) birthYear -= 543
    
    let y = n.getFullYear() - birthYear
    let m = n.getMonth() - b.getMonth()
    if (m < 0) { y--; m += 12 }
    return { text: `${y} ปี ${m} เดือน`, months: y * 12 + m }
}

export function getLevelColor(color: string) {
    const map: Record<string, { bg: string; text: string }> = {
        '#F4A261': { bg: 'oklch(0.95 0.04 70)', text: 'oklch(0.40 0.08 70)' },
        '#52B788': { bg: 'oklch(0.95 0.04 160)', text: 'oklch(0.32 0.07 160)' },
        '#457B9D': { bg: 'oklch(0.94 0.03 240)', text: 'oklch(0.35 0.07 240)' },
        '#E76F51': { bg: 'oklch(0.95 0.04 25)', text: 'oklch(0.38 0.10 25)' },
        '#E9C46A': { bg: 'oklch(0.96 0.04 90)', text: 'oklch(0.42 0.08 90)' },
        '#9B72CF': { bg: 'oklch(0.95 0.04 300)', text: 'oklch(0.38 0.10 300)' },
    }
    return map[color] ?? { bg: 'var(--cream)', text: 'var(--muted)' }
}
