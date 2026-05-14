'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Plus, ChevronRight, Search } from 'lucide-react'
import {
  Button, Input, Badge, Card, CardContent, Pagination,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  ContentHeader, Table, type TableColumn,
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

export default function CustomersPage() {
  const router = useRouter()
  const [q, setQ]               = useState('')
  const [status, setStatus]     = useState('All')
  const [contract, setContract] = useState('All')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'registeredAt', dir: 'desc' })
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
      const av = a[sort.key as keyof Customer], bv = b[sort.key as keyof Customer]
      const r = av > bv ? 1 : av < bv ? -1 : 0
      return sort.dir === 'asc' ? r : -r
    })
  }, [q, status, contract, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const counts = {
    total:      SEED_CUSTOMERS.length,
    active:     SEED_CUSTOMERS.filter((c) => c.status === 'Active').length,
    suspended:  SEED_CUSTOMERS.filter((c) => c.status === 'Suspended').length,
    onboarding: SEED_CUSTOMERS.filter((c) => c.status === 'Onboarding').length,
  }

  const columns: TableColumn<Customer>[] = [
    {
      key: 'name', title: 'Customer', sortable: true, width: '34%',
      render: (c) => (
        <div className="flex items-center gap-3">
          <CompanyLogo name={c.name} size={32} />
          <div>
            <div className="font-medium text-content-primary">{c.name}</div>
            <div className="text-xs text-content-tertiary">{c.address.split(',').slice(-2).join(',').trim()}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'registeredAt', title: 'Registered', sortable: true, width: '16%',
      render: (c) => (
        <>
          <div className="text-content-primary">{fmtDate(c.registeredAt)}</div>
          <div className="text-xs text-content-tertiary">{c.operators.length} operator{c.operators.length !== 1 ? 's' : ''}</div>
        </>
      ),
    },
    {
      key: 'contracts', title: 'Contracts',
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.contracts.length === 0
            ? <span className="text-xs text-content-disabled">—</span>
            : c.contracts.map((k, i) => <ContractBadge key={i} kind={k.kind} status={k.status} />)}
        </div>
      ),
    },
    {
      key: 'status', title: 'Status', width: '12%',
      render: (c) => <Badge tone={STATUS_TONE[c.status] ?? 'neutral'}>{c.status}</Badge>,
    },
    {
      key: '_action', title: '', width: 48, align: 'right',
      render: (c) => (
        <button
          type="button"
          aria-label={`Open ${c.name}`}
          className="inline-flex items-center justify-center size-7 rounded-md text-content-tertiary hover:text-content-primary hover:bg-surface-hover transition-colors cursor-pointer"
          onClick={(e) => { e.stopPropagation(); router.push(`/customers/${c.id}`) }}
        >
          <ChevronRight size={14} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <ContentHeader
        title="Customers"
        description="Maintain customer companies, their contracts and operators."
      >
          <Button variant="secondary" size="md">
            <Download size={14} /> Export
          </Button>
          <Button variant="primary" size="md" onClick={() => router.push('/customers/new')}>
            <Plus size={14} /> New customer
          </Button>
      </ContentHeader>

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
        <Table
          columns={columns}
          rows={pageRows}
          rowKey={(c) => c.id}
          sort={sort}
          onSortChange={(s) => { setSort(s ?? { key: 'registeredAt', dir: 'desc' }); setPage(1) }}
          onRowClick={(c) => router.push(`/customers/${c.id}`)}
          empty="No customers match your filters."
        />
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


function StatCard({ label, value, sub, action, active, onClick }: {
  label: string; value: number; sub: string; action: string; active: boolean; onClick: () => void
}) {
  return (
    <Card
      size="sm"
      className={[
        'group relative transition-all duration-fast',
        active
          ? 'border-primary-500 bg-primary-50 shadow-[0_0_0_1px_var(--color-primary-500),var(--shadow-1)]'
          : 'border-line-default bg-surface-2 shadow-1 hover:bg-surface-hover hover:border-line-strong',
      ].join(' ')}
    >
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className="block w-full text-left cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1"
      >
        <CardContent className="p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-content-tertiary">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-content-primary tabular-nums" style={{ letterSpacing: '-0.02em' }}>{value}</div>
          <div className="mt-0.5 text-[11.5px] text-content-tertiary">{sub}</div>
          <div className={[
            'mt-2 flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.02em] text-primary-700 transition-opacity duration-fast',
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          ].join(' ')}>
            {active && '✓ '}{action} <ChevronRight size={9} />
          </div>
        </CardContent>
      </button>
    </Card>
  )
}
