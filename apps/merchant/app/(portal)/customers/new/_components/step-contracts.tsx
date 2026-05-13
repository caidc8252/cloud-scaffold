'use client'

import { Check, FileText, Link, Shield } from 'lucide-react'

export type ContractKind = 'ISV' | 'ISO' | 'Acquirer' | 'PayFac'

interface ContractOption {
  kind: ContractKind
  label: string
  desc: string
  Icon: typeof FileText
  iconClassName: string
}

const OPTIONS: ContractOption[] = [
  { kind: 'ISV',      label: 'ISV',      desc: 'Independent Software Vendor integration',       Icon: FileText, iconClassName: 'bg-primary text-primary-foreground' },
  { kind: 'ISO',      label: 'ISO',      desc: 'Independent Sales Organization partnership',    Icon: Shield,   iconClassName: 'bg-info text-content-inverse' },
  { kind: 'Acquirer', label: 'Acquirer', desc: 'Merchant acquirer direct integration',          Icon: Check,    iconClassName: 'bg-success text-content-inverse' },
  { kind: 'PayFac',   label: 'PayFac',   desc: 'Payment facilitator agreement',                 Icon: Link,     iconClassName: 'bg-warning text-content-inverse' },
]

interface StepContractsProps {
  value: ContractKind[]
  onChange: (v: ContractKind[]) => void
}

export function StepContracts({ value, onChange }: StepContractsProps) {
  const toggle = (kind: ContractKind) => {
    onChange(value.includes(kind) ? value.filter((k) => k !== kind) : [...value, kind])
  }

  return (
    <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 p-6">
      <h2 className="text-base font-semibold text-content-primary mb-1">Select contract types</h2>
      <p className="text-sm text-content-tertiary mb-5">Choose the agreements that apply to this customer. You can add more later.</p>

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(({ kind, label, desc, Icon, iconClassName }) => {
          const selected = value.includes(kind)
          return (
            <button
              key={kind}
              type="button"
              onClick={() => toggle(kind)}
              className={[
                'text-left rounded-xl border p-4 transition-all duration-fast cursor-pointer',
                selected
                  ? 'bg-surface-1 border-primary shadow-[0_0_0_2px_var(--color-primary)]'
                  : 'bg-surface-2 border-line-default hover:border-line-strong hover:bg-surface-hover',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                    selected ? iconClassName : 'bg-surface-3 text-content-tertiary',
                  ].join(' ')}
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-content-primary">{label}</span>
                    {selected && (
                      <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        <Check size={11} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-content-tertiary mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
