'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Plus, ChevronRight, Search, ArrowUp, ArrowDown } from 'lucide-react'
import {
  Button, Input, Badge, Card, CardContent, Pagination,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@cloud/ui'
import { CompanyLogo } from '@/components/layout/company-logo'
import { ContractBadge } from '@/components/layout/contract-badge'
import { SEED_CUSTOMERS, type Customer, type CustomerStatus } from '@/lib/data/customers'
import { fmtDate } from '@/lib/format'

const STATUS_TONE: Record<CustomerStatus, 'success' | 'info' | 'error'> = {
  Active:     'success',
  Onboarding: 'info',
  Suspended:  'error',
}

const PAGE_SIZE = 8
type SortKey = 'name' | 'registeredAt'

function SortIcon({ sortKey, sortDir, target }: { sortKey: SortKey; sortDir: 'asc' | 'desc'; target: SortKey }) {
  if (sortKey !== target) return <ArrowDown size={10} className="opacity-25" />
  return sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
}

export default function CustomersPage() {
  const router = useRouter()
  const [q, setQ]               = useState('')
  const [status, setStatus]     = useState('All')
  const [contract, setContract] = useState('All')
  const [sortKey, setSortKey]   = useState<SortKey>('registeredAt')
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc')
  const [page, setPage]         = useState(1)

  const filtered = useMemo(() => {
    let rows = SEED_CUSTOMERS
    if (q.trim()) {
      const s = q.toLowerCase()
      rows = rows.filter(
        (c) => c.name.toLowerCase().includes(s) || c.address.toLowerCase().includes(s) || c.license.toLowerCase().includes(s),
      )
    }
    if (status !== 'All') rows = rows.filter((c) => c.status === status)
    if (contract !== 'All') rows = rows.filter((c) => c.contracts.some((k) => k.kind === contract))
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      const r = av > bv ? 1 : av < bv ? -1 : 0
      return sortDir === 'asc' ? r : -r
    })
  }, [q, status, contract, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const counts = {
    total:      SEED_CUSTOMERS.length,
    active:     SEED_CUSTOMERS.filter((c) => c.status === 'Active').length,
    suspended:  SEED_CUSTOMERS.filter((c) => c.status === 'Suspended').length,
    onboarding: SEED_CUSTOMERS.filter((c) => c.status === 'Onboarding').length,
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="p-6 pb-12">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-content-primary">Customers</h1>
          <p className="text-sm text-content-tertiary mt-0.5">
            Maintain customer companies, their contracts and operators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md">
            <Download size={14} /> Export
          </Button>
          <Button variant="primary" size="md" onClick={() => router.push('/customers/new')}>
            <Plus size={14} /> New customer
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Total customers" value={counts.total} sub="↑ 2 this week" action="Show all"
          active={status === 'All' && contract === 'All' && !q}
          onClick={() => { setStatus('All'); setContract('All'); setQ(''); setPage(1) }} />
        <StatCard label="Active" value={counts.active} sub={`${Math.round(counts.active / counts.total * 100)}% of total`} action="Filter"
          active={status === 'Active'}
          onClick={() => { setStatus(status === 'Active' ? 'All' : 'Active'); setPage(1) }} />
        <StatCard label="Suspended" value={counts.suspended} sub="access paused" action="Filter"
          active={status === 'Suspended'}
          onClick={() => { setStatus(status === 'Suspended' ? 'All' : 'Suspended'); setPage(1) }} />
        <StatCard label="Onboarding" value={counts.onboarding} sub="setup in progress" action="Filter"
          active={status === 'Onboarding'}
          onClick={() => { setStatus(status === 'Onboarding' ? 'All' : 'Onboarding'); setPage(1) }} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 max-w-sm">
          <Input prefix={<Search size={14} />} placeholder="Search by name, address, license…" value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        </div>
        <Select value={status} onValueChange={(v) => { if (v) setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Onboarding">Onboarding</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={contract} onValueChange={(v) => { if (v) setContract(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All contracts</SelectItem>
            <SelectItem value="ISV">ISV</SelectItem>
            <SelectItem value="ISO">ISO</SelectItem>
            <SelectItem value="Acquirer">Acquirer</SelectItem>
            <SelectItem value="PayFac">PayFac</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-surface-3 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default w-[34%]">
                  <button className="inline-flex items-center gap-1 cursor-pointer hover:text-content-primary" onClick={() => toggleSort('name')}>
                    Customer <SortIcon sortKey={sortKey} sortDir={sortDir} target="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default w-[16%]">
                  <button className="inline-flex items-center gap-1 cursor-pointer hover:text-content-primary" onClick={() => toggleSort('registeredAt')}>
                    Registered <SortIcon sortKey={sortKey} sortDir={sortDir} target="registeredAt" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default">
                  Contracts
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default w-[12%]">
                  Status
                </th>
                <th className="px-4 py-3 border-b border-line-default w-12" />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-content-tertiary">
                    No customers match your filters.
                  </td>
                </tr>
              ) : pageRows.map((c) => <CustomerRow key={c.id} customer={c} onClick={() => router.push(`/customers/${c.id}`)} />)}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-line-subtle">
          <span className="text-xs text-content-tertiary">
            {pageRows.length === 0
              ? 'No results'
              : (
                <>
                  Showing <strong className="font-semibold text-content-primary">{(page - 1) * PAGE_SIZE + 1}</strong>
                  –
                  <strong className="font-semibold text-content-primary">{(page - 1) * PAGE_SIZE + pageRows.length}</strong>
                  {' '}of <strong className="font-semibold text-content-primary">{filtered.length}</strong>
                </>
              )
            }
          </span>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}

function CustomerRow({ customer: c, onClick }: { customer: Customer; onClick: () => void }) {
  return (
    <tr className="border-b border-line-subtle hover:bg-surface-hover transition-colors duration-fast cursor-pointer" onClick={onClick}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <CompanyLogo name={c.name} size={32} />
          <div>
            <div className="font-medium text-content-primary">{c.name}</div>
            <div className="text-xs text-content-tertiary">{c.address.split(',').slice(-2).join(',').trim()}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-content-primary">{fmtDate(c.registeredAt)}</div>
        <div className="text-xs text-content-tertiary">{c.operators.length} operator{c.operators.length !== 1 ? 's' : ''}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {c.contracts.length === 0
            ? <span className="text-xs text-content-disabled">—</span>
            : c.contracts.map((k, i) => <ContractBadge key={i} kind={k.kind} status={k.status} />)}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge tone={STATUS_TONE[c.status] ?? 'neutral'}>{c.status}</Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          aria-label={`Open ${c.name}`}
          className="inline-flex items-center justify-center size-7 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-hover transition-colors cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onClick() }}
        >
          <ChevronRight size={14} />
        </button>
      </td>
    </tr>
  )
}

function StatCard({ label, value, sub, action, active, onClick }: {
  label: string; value: number; sub: string; action: string; active: boolean; onClick: () => void
}) {
  return (
    <Card
      size="sm"
      className={[
        'relative transition-all duration-fast',
        active
          ? 'border-primary bg-primary-50 shadow-[0_0_0_2px_var(--color-primary)]'
          : 'border-line-default bg-surface-2 shadow-1 hover:border-line-strong hover:shadow-2',
      ].join(' ')}
    >
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className="block w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className={active ? 'text-xs font-medium text-primary-700' : 'text-xs text-content-tertiary'}>{label}</div>
            {active && (
              <span className="inline-flex h-5 items-center rounded-full bg-primary px-2 text-[11px] font-medium text-primary-foreground">
                Selected
              </span>
            )}
          </div>
          <div className="mt-1 text-2xl font-semibold text-content-primary tabular-nums">{value}</div>
          <div className="mt-1 text-xs text-content-secondary">{sub}</div>
          <div className={active
            ? 'mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-700'
            : 'mt-2 inline-flex items-center gap-1 text-xs font-medium text-content-primary'}
          >
            {action} <ChevronRight size={10} />
          </div>
        </CardContent>
      </button>
    </Card>
  )
}
