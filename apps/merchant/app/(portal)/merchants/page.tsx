'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Plus, Search } from 'lucide-react'
import {
  Button,
  ContentHeader,
  Input,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  type TableColumn,
} from '@cloud/ui'
import { MERCHANTS, filterMerchants, merchantTotals, uniqueCountries } from '@/components/merchants/data/helpers'
import type { Merchant } from '@/components/merchants/data/types'
import { MerchantAvatar } from '@/components/merchants/merchant-avatar'
import { TagChip } from '@/components/merchants/tag-chip'
import { MerchantKpiStrip } from '@/components/merchants/list/merchant-kpi-strip'

const ANY_COUNTRY = 'any'
const PAGE_SIZE = 8

export default function MerchantsPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState<string>(ANY_COUNTRY)
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' })
  const [page, setPage] = useState(1)

  const all = MERCHANTS
  const totals = useMemo(() => merchantTotals(all), [all])
  const countries = useMemo(() => uniqueCountries(all), [all])

  const filtered = useMemo(() => {
    const rows = filterMerchants(all, query, country)
    return [...rows].sort((a, b) => {
      const av = a.name.toLowerCase()
      const bv = b.name.toLowerCase()
      const r = av > bv ? 1 : av < bv ? -1 : 0
      return sort.dir === 'asc' ? r : -r
    })
  }, [all, query, country, sort.dir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: TableColumn<Merchant>[] = [
    {
      key: 'name',
      title: 'Merchant',
      sortable: true,
      width: '34%',
      render: (m) => (
        <div className="flex items-center gap-3 min-w-0">
          <MerchantAvatar name={m.name} size={32} />
          <div className="min-w-0">
            <div className="font-medium text-content-primary truncate">{m.name}</div>
            <div className="font-mono text-xs text-content-tertiary truncate">{m.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'country',
      title: 'Country',
      width: '14%',
      render: (m) => <span className="text-content-secondary">{m.country}</span>,
    },
    {
      key: 'stores',
      title: 'Stores',
      width: '14%',
      render: (m) =>
        m.stores.length <= 1 ? (
          <span className="text-xs text-content-tertiary">Headquarter only</span>
        ) : (
          <span className="font-mono font-medium">{m.stores.length}</span>
        ),
    },
    {
      key: 'terminals',
      title: 'Terminals',
      width: '14%',
      render: (m) => {
        const total = m.terminals.length
        const installed = m.terminals.filter((t) => t.state === 'active').length
        return (
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-medium">{total}</span>
            {installed !== total && (
              <span className="text-xs text-content-tertiary">({installed} installed)</span>
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
          {m.tags.length === 0 ? (
            <span className="text-xs text-content-disabled">—</span>
          ) : (
            <>
              {m.tags.slice(0, 3).map((t) => (
                <TagChip key={t} label={t} />
              ))}
              {m.tags.length > 3 && (
                <span className="text-xs text-content-tertiary py-0.5">+{m.tags.length - 3}</span>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      key: '_action',
      title: '',
      width: 48,
      align: 'right',
      render: (m) => (
        <button
          type="button"
          aria-label={`Open ${m.name}`}
          className="inline-flex items-center justify-center size-7 rounded-md text-content-tertiary hover:text-content-primary hover:bg-surface-hover transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/merchants/${m.id}`)
          }}
        >
          <ChevronRight size={14} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <ContentHeader
        title="Merchants"
        description="Maintain merchant accounts, their stores, and the terminals attached to each store."
      >
        <Button variant="primary" size="md" onClick={() => router.push('/merchants/new')}>
          <Plus size={14} /> New merchant
        </Button>
      </ContentHeader>

      <MerchantKpiStrip totals={totals} />

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 max-w-sm">
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search merchants, stores, tags…"
            prefix={<Search size={14} className="text-content-tertiary" />}
          />
        </div>
        <Select value={country} onValueChange={(v) => { setCountry(v ?? ANY_COUNTRY); setPage(1) }}>
          <SelectTrigger className="w-36">
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
      </div>

      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        <Table<Merchant>
          columns={columns}
          rows={pageRows}
          rowKey={(m) => m.id}
          sort={sort}
          onSortChange={(s) => { setSort(s ?? { key: 'name', dir: 'asc' }); setPage(1) }}
          onRowClick={(m) => router.push(`/merchants/${m.id}`)}
          empty={
            all.length === 0
              ? 'No merchants yet. Click "New merchant" above to create one.'
              : 'No merchants match those filters.'
          }
        />
        <div className="flex items-center justify-between px-4 py-3 border-t border-line-subtle">
          <span className="text-xs text-content-tertiary">
            {pageRows.length === 0 ? (
              'No results'
            ) : (
              <>
                Showing <strong className="font-semibold text-content-primary">{(page - 1) * PAGE_SIZE + 1}</strong>
                –
                <strong className="font-semibold text-content-primary">{(page - 1) * PAGE_SIZE + pageRows.length}</strong>
                {' '}of <strong className="font-semibold text-content-primary">{filtered.length}</strong>
              </>
            )}
          </span>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}
