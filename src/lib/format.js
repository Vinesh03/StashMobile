export function fmtDuration(s) {
  if (s === null || s === undefined) return ''
  s = Math.round(s)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function fmtSize(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`
}

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

export function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  const mi = parseInt(m, 10)
  if (!day || !MESI[mi - 1]) return d
  return `${parseInt(day, 10)} ${MESI[mi - 1]} ${y}`
}

export function fmtHeight(cm) {
  if (!cm) return ''
  return `${cm} cm`
}

export function perfName(p) {
  if (!p) return ''
  return p.disambiguation ? `${p.name} (${p.disambiguation})` : p.name
}

export function genderLabel(g) {
  if (g === 'MALE') return 'M'
  if (g === 'FEMALE') return 'F'
  if (g === 'INTERSEX') return 'I'
  return ''
}
