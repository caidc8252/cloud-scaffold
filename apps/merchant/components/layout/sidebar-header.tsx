'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@cloud/ui'
import { Logo } from './logo'

interface Tenant {
  id: string
  name: string
  contracts: Array<'ISV' | 'ISO'>
  last: string
}

const TENANTS: Tenant[] = [
  { id: 'acme-sw', name: 'Acme Software', contracts: ['ISV'], last: 'Active now' },
  { id: 'northbay', name: 'Northbay Devices', contracts: ['ISO'], last: 'Yesterday' },
  { id: 'summit', name: 'Summit Retail Co.', contracts: ['ISV', 'ISO'], last: 'Last week' },
]

export function SidebarHeader() {
  const [activeId, setActiveId] = useState(TENANTS[0].id)
  const active = TENANTS.find((t) => t.id === activeId) ?? TENANTS[0]

  return (
    <div className="px-3 pt-3 pb-2 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-left transition-colors hover:bg-surface-hover cursor-pointer">
          <Logo size={28} />
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-[12.5px] font-semibold text-content-primary truncate">TOMS</div>
            <div className="mt-0.5 flex items-center gap-1.5 min-w-0">
              <span className="text-[10.5px] text-content-tertiary truncate">{active.name}</span>
              <span className="inline-flex gap-1 shrink-0">
                {active.contracts.map((c) => (
                  <ContractChip key={c} contract={c} />
                ))}
              </span>
            </div>
          </div>
          <ChevronDown size={12} className="text-content-tertiary shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" side="bottom" className="w-56">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-content-tertiary font-medium">
            Switch organization
          </DropdownMenuLabel>
          {TENANTS.map((t) => (
            <TenantRow
              key={t.id}
              tenant={t}
              active={t.id === activeId}
              onSelect={() => setActiveId(t.id)}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function TenantRow({
  tenant,
  active,
  onSelect,
}: {
  tenant: Tenant
  active: boolean
  onSelect: () => void
}) {
  const initials = tenant.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <button
      type="button"
      onClick={onSelect}
      role="menuitemradio"
      aria-checked={active}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-sm text-left cursor-pointer transition-colors ${
        active ? 'bg-surface-active' : 'hover:bg-surface-hover'
      }`}
    >
      <span className="grid place-items-center w-[26px] h-[26px] rounded-sm bg-surface-3 border border-line-default text-[10px] font-semibold text-content-secondary shrink-0">
        {initials}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 min-w-0">
          <span
            className={`truncate text-xs ${active ? 'text-content-primary font-medium' : 'text-content-secondary'}`}
          >
            {tenant.name}
          </span>
          <span className="inline-flex gap-1 shrink-0">
            {tenant.contracts.map((c) => (
              <ContractChip key={c} contract={c} />
            ))}
          </span>
        </span>
        <span className="block mt-px text-[10.5px] text-content-tertiary">{tenant.last}</span>
      </span>
      {active && <Check size={12} strokeWidth={2.4} className="text-primary-700 shrink-0" />}
    </button>
  )
}

const CONTRACT_STYLES: Record<'ISV' | 'ISO', string> = {
  ISV: 'bg-primary-50 text-primary-700',
  ISO: 'bg-success-bg text-success-strong',
}

function ContractChip({ contract }: { contract: 'ISV' | 'ISO' }) {
  return (
    <span
      className={`px-1.5 rounded-sm font-mono text-[9.5px] font-medium tracking-wider whitespace-nowrap ${CONTRACT_STYLES[contract]}`}
    >
      {contract}
    </span>
  )
}
