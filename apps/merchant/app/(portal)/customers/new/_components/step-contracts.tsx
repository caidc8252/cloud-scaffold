'use client'

import { FileText, Link, Shield, Check, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@cloud/ui'
import { ContractBadge } from '@/components/layout/contract-badge'

export type ContractKind = 'ISV' | 'ISO' | 'Acquirer' | 'PayFac'

interface ContractOption {
  kind: ContractKind
  title: string
  desc: string
  Icon: typeof FileText
  iconClassName: string
}

const OPTIONS: ContractOption[] = [
  {
    kind: 'ISV',
    title: 'ISV — Independent Software Vendor',
    desc: 'Grants the customer the ability to integrate Carbon APIs into their own software and resell payment services.',
    Icon: FileText,
    iconClassName: 'bg-accent-100 text-accent-700',
  },
  {
    kind: 'ISO',
    title: 'ISO — Independent Sales Organization',
    desc: 'Authorizes the customer to onboard sub-merchants and earn residuals on processing volume.',
    Icon: Shield,
    iconClassName: 'bg-info-50 text-info-700',
  },
  {
    kind: 'Acquirer',
    title: 'Acquirer',
    desc: 'Direct merchant acquiring relationship. Bank sponsorship required.',
    Icon: Check,
    iconClassName: 'bg-success-50 text-success-700',
  },
  {
    kind: 'PayFac',
    title: 'PayFac — Payment Facilitator',
    desc: 'Customer operates as a master merchant, processing on behalf of sub-merchants.',
    Icon: Link,
    iconClassName: 'bg-warning-50 text-warning-700',
  },
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
    <Card>
      <CardHeader>
        <CardTitle>Assign contracts</CardTitle>
        <CardDescription>
          Select one or more. Contracts take effect immediately once you create the customer — no customer-side signing required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map(({ kind, title, desc, Icon, iconClassName }) => {
            const selected = value.includes(kind)
            return (
              <button
                key={kind}
                type="button"
                onClick={() => toggle(kind)}
                className={[
                  'relative text-left rounded-xl border p-[18px] transition-all duration-fast cursor-pointer',
                  selected
                    ? 'bg-primary-50 border-primary-700 shadow-[0_0_0_3px_oklch(40%_0.14_262/0.08)]'
                    : 'bg-surface-2 border-line-default hover:border-line-strong hover:bg-surface-hover',
                ].join(' ')}
              >
                <div className="flex items-start gap-3.5 pr-6">
                  <div className={['flex size-10 shrink-0 items-center justify-center rounded-[10px]', iconClassName].join(' ')}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14.5px] font-semibold tracking-[-0.005em] text-content-primary leading-snug">
                      {title}
                    </div>
                    <p className="text-[12.5px] text-content-secondary mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>

                {/* Checkbox indicator — top-right */}
                <span
                  className={[
                    'absolute top-3.5 right-3.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] transition-all duration-fast',
                    selected
                      ? 'bg-primary-700 border border-primary-700 text-white'
                      : 'bg-surface-2 border-[1.5px] border-line-strong',
                  ].join(' ')}
                >
                  {selected && <Check size={11} />}
                </span>
              </button>
            )
          })}
        </div>

        {/* Summary panel */}
        {value.length > 0 && (
          <div className="mt-5 rounded-[10px] border border-line-subtle bg-surface-3 p-[14px_16px]">
            <div className="text-xs font-medium uppercase tracking-[0.06em] text-content-tertiary mb-2">
              Will be created as
            </div>
            <div className="flex flex-wrap gap-1.5">
              {value.map((k) => (
                <ContractBadge key={k} kind={k} status="Active" />
              ))}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-content-secondary">
              <Info size={13} className="shrink-0" />
              Configured by you on behalf of the customer. Effective{' '}
              <strong className="mx-0.5">immediately</strong> on creation.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
