/**
 * Client-side export utilities for CSV and printable HTML (PDF)
 * Supports Thai language with BOM for Excel compatibility
 */

type Row = (string | number | null | undefined)[]

/** Download a CSV file with Thai-compatible BOM */
export function exportCSV(
  headers: string[],
  rows: Row[],
  filename: string
) {
  const bom = '\uFEFF'
  const escape = (v: unknown) => `"${String(v ?? '-').replace(/"/g, '""')}"`
  const csv = [
    headers.map(escape).join(','),
    ...rows.map(r => r.map(escape).join(',')),
  ].join('\n')

  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** Open a printable HTML page (auto-invokes print dialog) */
export function exportPDF(
  title: string,
  headers: string[],
  rows: Row[],
  filename: string,
  meta?: { label: string; value: string }[]
) {
  const metaHTML = meta
    ? `<div class="meta">${meta.map(m => `<span><b>${m.label}:</b> ${m.value}</span>`).join(' &nbsp;·&nbsp; ')}</div>`
    : ''

  const tableHTML = `
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c ?? '-'}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    body { font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; color: #333; padding: 20px; }
    h2 { text-align: center; margin: 0 0 4px; font-size: 18px; }
    .meta { text-align: center; font-size: 12px; color: #666; margin-bottom: 16px; }
    .info { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px; color: #555; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f5f5f5; text-align: left; }
    th, td { border: 1px solid #ddd; padding: 6px 10px; }
    tr:nth-child(even) { background: #fafafa; }
  </style>
</head>
<body onload="setTimeout(()=>window.print(),400)">
  <h2>${title}</h2>
  ${metaHTML}
  <div class="info">
    <span>จำนวน ${rows.length} รายการ</span>
    <span>วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
  </div>
  ${tableHTML}
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
