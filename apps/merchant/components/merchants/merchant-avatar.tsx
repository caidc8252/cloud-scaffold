interface MerchantAvatarProps {
  name: string
  size?: number
}

const GRADIENTS = [
  'linear-gradient(135deg, oklch(62% 0.18 262), oklch(45% 0.14 262))',
  'linear-gradient(135deg, oklch(60% 0.16 152), oklch(42% 0.14 152))',
  'linear-gradient(135deg, oklch(70% 0.18 70), oklch(50% 0.16 70))',
  'linear-gradient(135deg, oklch(60% 0.18 25), oklch(44% 0.16 25))',
  'linear-gradient(135deg, oklch(58% 0.18 320), oklch(42% 0.16 320))',
]

function pickGradient(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff
  return GRADIENTS[h % GRADIENTS.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

export function MerchantAvatar({ name, size = 32 }: MerchantAvatarProps) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: pickGradient(name),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'oklch(99% 0 0)',
        fontWeight: 600,
        fontSize: Math.max(10, Math.round(size * 0.38)),
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </span>
  )
}
