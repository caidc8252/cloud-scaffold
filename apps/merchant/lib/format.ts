const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

function parseDate(iso: string): Date | null {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const date = parseDate(iso)
  if (!date) return '—'
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

export function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  const date = parseDate(iso)
  if (!date) return '—'
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  return `${fmtDate(iso)} ${hour}:${minute} UTC`
}

export function relTime(iso: string | null): string {
  return fmtDate(iso)
}

export function maskEmail(email: string): string {
  if (!email) return ''
  const [user, domain] = email.split('@')
  return `${user.slice(0, 1)}${'•'.repeat(Math.max(3, user.length - 1))}@${domain}`
}

export function maskPhone(phone: string): string {
  if (!phone) return ''
  return phone.replace(
    /(\+?\d{1,3})[\s-]?(\d{2,4})[\s-]?(\d{2,4})[\s-]?(\d{2,4})/,
    (_, a, _b, _c, d) => `${a} ••• ••• ${d}`,
  )
}

export function maskName(name: string): string {
  if (!name) return ''
  return name.split(' ').map((p, i) => (i === 0 ? p : `${p[0]}.`)).join(' ')
}
