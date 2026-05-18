import { Badge } from '@cloud/ui'
import type { ContractStatus } from '@/lib/data/customers'

const STATUS_TONE: Record<ContractStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  Active:     'success',
  Signed:     'success',
  Pending:    'warning',
  Terminated: 'error',
}

interface ContractBadgeProps {
  kind: string
  status?: ContractStatus
}

export function ContractBadge({ kind, status = 'Active' }: ContractBadgeProps) {
  const tone = STATUS_TONE[status] ?? 'neutral'
  return (
    <Badge tone={tone} title={`${kind} · ${status}`}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'currentColor',
          flexShrink: 0,
        }}
      />
      {kind}
      {status !== 'Active' && status !== 'Signed' && status !== kind && (
        <span style={{ opacity: 0.7 }}>· {status}</span>
      )}
    </Badge>
  )
}
