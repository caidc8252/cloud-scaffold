'use client'

const GRADIENTS: [string, string][] = [
  ['oklch(55% 0.18 262)', 'oklch(40% 0.14 262)'],
  ['oklch(55% 0.20 290)', 'oklch(40% 0.16 290)'],
  ['oklch(52% 0.18 160)', 'oklch(38% 0.14 160)'],
  ['oklch(60% 0.18 55)',  'oklch(45% 0.14 55)'],
  ['oklch(55% 0.16 220)', 'oklch(40% 0.12 220)'],
  ['oklch(52% 0.18 340)', 'oklch(38% 0.14 340)'],
]

function gradientFor(name: string): [string, string] {
  let h = 0
  for (const c of name) h = ((h * 31 + c.charCodeAt(0)) >>> 0)
  return GRADIENTS[h % GRADIENTS.length]
}

interface CompanyLogoProps {
  name: string
  size?: number
}

export function CompanyLogo({ name, size = 32 }: CompanyLogoProps) {
  const [a, b] = gradientFor(name)
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${a}, ${b})`,
        color: 'oklch(99% 0 0)',
        fontSize: size * 0.36,
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </span>
  )
}
