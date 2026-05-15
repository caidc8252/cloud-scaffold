'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Plus, Search } from 'lucide-react'
import {
  Button,
  ContentHeader,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  type TableColumn,
} from '@cloud/ui'
import { MERCHANTS, filterMerchants, merchantTotals, uniqueCountries } from '../data/helpers'
import type { Merchant } from '../data/types'
import { MerchantAvatar } from '../merchant-avatar'
import { TagChip } from '../tag-chip'
import { MerchantKpiStrip } from './merchant-kpi-strip'

const ANY_COUNTRY = 'any'

export function MerchantsList() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState<string>(ANY_COUNTRY)

  const all = MERCHANTS
  const totals = useMemo(() => merchantTotals(all), [all])
  const countries = useMemo(() => uniqueCountries(all), [all])
  const filtered = useMemo(() => filterMerchants(all, query, country), [all, query, country])

  const columns: TableColumn<Merchant>[] = [
    {
      key: 'merchant',
      title: 'Merchant',
      render: (m) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <MerchantAvatar name={m.name} size={28} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-content-primary truncate">{m.name}</div>
            <div className="font-mono text-[11px] text-content-tertiary truncate">{m.id}</div>
          </div>
        </div>
      ),
    },
    { key: 'country', title: 'Country', render: (m) => <span className="text-content-secondary">{m.country}</span> },
    {
      key: 'stores',
      title: 'Stores',
      render: (m) =>
        m.stores.length <= 1 ? (
          <span className="text-[11.5px] text-content-tertiary">Headquarter only</span>
        ) : (
          <span className="font-mono font-medium">{m.stores.length}</span>
        ),
    },
    {
      key: 'terminals',
      title: 'Terminals',
      render: (m) => {
        const total = m.terminals.length
        const installed = m.terminals.filter((t) => t.state === 'active').length
        return (
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-medium">{total}</span>
            {installed !== total && (
              <span className="text-[11px] text-content-tertiary">({installed} installed)</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'tags',
      title: 'Tags',
      render: (m) => (
        <div className="flex flex-wrap gap-1">
          {m.tags.slice(0, 3).map((t) => (
            <TagChip key={t} label={t} />
          ))}
          {m.tags.length > 3 && (
            <span className="text-[11px] text-content-tertiary py-0.5">+{m.tags.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      key: 'chev',
      title: '',
      width: 32,
      align: 'right',
      render: () => <ChevronRight size={14} className="text-content-tertiary" />,
    },
  ]

  return (
    <>
      <ContentHeader
        title="Merchants"
        description="Maintain merchant accounts, their stores, and the terminals attached to each store."
      >
        <Button variant="primary" iconLeft={<Plus size={14} />} onClick={() => router.push('/merchants/new')}>
          New merchant
        </Button>
      </ContentHeader>

      <MerchantKpiStrip totals={totals} />

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search merchants, stores, tags…"
          prefix={<Search size={14} className="text-content-tertiary" />}
          className="flex-1 min-w-[220px] max-w-[360px]"
        />
        <Select value={country} onValueChange={(v) => setCountry(v ?? ANY_COUNTRY)}>
          <SelectTrigger size="sm" className="min-w-[160px]">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_COUNTRY}>All countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto text-[11.5px] text-content-tertiary">
          {filtered.length} of {all.length} merchants
        </div>
      </div>

      <div className="rounded-lg overflow-hidden bg-surface-2 border border-line-default shadow-1">
        <Table<Merchant>
          columns={columns}
          rows={filtered}
          rowKey={(m) => m.id}
          onRowClick={(m) => router.push(`/merchants/${m.id}`)}
          empty={
            all.length === 0
              ? 'No merchants yet. Click "New merchant" above to create one.'
              : 'No merchants match those filters.'
          }
        />
      </div>
    </>
  )
}
