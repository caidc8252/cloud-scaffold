'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Plus, ChevronRight, Search, Gift } from 'lucide-react'
import {
  Button, Input, Badge, Card, CardContent, Pagination,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  ContentHeader, Table, type TableColumn,
} from '@cloud/ui'
import { CompanyLogo } from '@/components/layout/company-logo'
import { SEED_ORDERS, ORDER_STATUSES, ORDER_STATUS_TONE, DEVICE_MODELS,
  orderTotal, orderQty, deviceProgress, moneyUsd,
  type Order } from '@/lib/data/orders'
import { fmtDate } from '@/lib/format'

const PAGE_SIZE = 10

const FILTER_STATUSES = ['All', ...ORDER_STATUSES, 'In transit']

export default function OrdersPage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' })
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let rows: Order[] = SEED_ORDERS
    if (q.trim()) {
      const s = q.toLowerCase()
      rows = rows.filter(o =>
        o.number.toLowerCase().includes(s) ||
        o.customerName.toLowerCase().includes(s) ||
        o.items.some(i => i.modelName.toLowerCase().includes(s))
      )
    }
    if (status === 'In transit') rows = rows.filter(o => o.status === 'Shipped' || o.status === 'Partially complete')
    else if (status !== 'All') rows = rows.filter(o => o.status === status)
    return [...rows].sort((a, b) => {
      const av = a[sort.key as keyof Order] as string | number | undefined
      const bv = b[sort.key as keyof Order] as string | number | undefined
      const r = (av ?? '') > (bv ?? '') ? 1 : (av ?? '') < (bv ?? '') ? -1 : 0
      return sort.dir === 'asc' ? r : -r
    })
  }, [q, status, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = useMemo(() => ({
    total: SEED_ORDERS.length,
    awaitingPayment: SEED_ORDERS.filter(o => o.status === 'Awaiting payment').length,
    awaitingShipment: SEED_ORDERS.filter(o => o.status === 'Awaiting shipment').length,
    inTransit: SEED_ORDERS.filter(o => o.status === 'Shipped' || o.status === 'Partially complete').length,
  }), [])

  const columns: TableColumn<Order>[] = [
    {
      key: 'number', title: 'Order', sortable: true, width: '1%',
      render: (o) => (
        <span className="font-mono text-[13px] font-medium text-content-primary whitespace-nowrap">{o.number}</span>
      ),
    },
    {
      key: 'customerName', title: 'Customer',
      render: (o) => (
        <div className="flex items-center gap-3">
          <CompanyLogo name={o.customerName} size={28} />
          <span className="font-medium text-content-primary">{o.customerName}</span>
        </div>
      ),
    },
    {
      key: 'items', title: 'Models & units',
      render: (o) => (
        <div>
          {o.items.slice(0, 2).map((i) => {
            const mm = DEVICE_MODELS.find(x => x.id === i.modelId)
            return (
              <div key={i.id} className="flex items-center gap-2 text-xs text-content-secondary">
                <span className="font-medium text-content-primary">{mm?.name ?? i.modelName}</span>
                <span>× {i.qty}</span>
              </div>
            )
          })}
          {o.items.length > 2
            ? <div className="text-[11px] text-content-tertiary mt-0.5">+{o.items.length - 2} more · {orderQty(o)} units total</div>
            : o.items.length > 1
              ? <div className="text-[11px] text-content-tertiary mt-0.5">{orderQty(o)} units total</div>
              : null}
        </div>
      ),
    },
    {
      key: 'total' as never, title: 'Total', width: '1%', align: 'right',
      render: (o) => {
        const total = orderTotal(o)
        return (
          <div className="text-right whitespace-nowrap tabular-nums">
            <div className={total === 0 ? 'text-success font-semibold' : 'text-content-primary font-medium'}>
              {total === 0 ? 'Free' : moneyUsd(total)}
            </div>
            {o.discountPct > 0 && (
              <div className="text-[11px] text-content-tertiary mt-0.5 flex items-center gap-1 justify-end">
                <Gift size={10} />
                {o.discountPct === 100 ? 'Complimentary' : `${o.discountPct}% off`}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'status', title: 'Status', sortable: true, width: '1%',
      render: (o) => {
        const tone = (ORDER_STATUS_TONE[o.status] ?? 'neutral') as 'warning' | 'info' | 'success' | 'neutral'
        const showProgress = o.status === 'Awaiting shipment'
        const prog = deviceProgress(o)
        return (
          <div className="flex flex-col gap-1 items-start whitespace-nowrap">
            <Badge tone={tone}>{o.status}</Badge>
            {showProgress && prog.total > 0 && (
              <span className="text-[11px] text-content-tertiary tabular-nums">{prog.done}/{prog.total} activated</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'createdAt', title: 'Created', sortable: true, width: '1%',
      render: (o) => (
        <div className="whitespace-nowrap">
          <div className="text-content-primary text-[13px]">{fmtDate(o.createdAt)}</div>
        </div>
      ),
    },
    {
      key: '_action' as never, title: '', width: 48, align: 'right',
      render: (o) => (
        <button
          type="button" aria-label={`Open ${o.number}`}
          className="inline-flex items-center justify-center size-7 rounded-md text-content-tertiary hover:text-content-primary hover:bg-surface-hover transition-colors cursor-pointer"
          onClick={(e) => { e.stopPropagation(); router.push(`/devices/orders/${o.id}`) }}
        >
          <ChevronRight size={14} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <ContentHeader
        title="Sample orders"
        description="Create and track sample device orders for customer companies. Maintain device activation records before shipment."
      >
        <Button variant="secondary" size="md">
          <Download size={14} /> Export
        </Button>
        <Button variant="primary" size="md" onClick={() => router.push('/devices/orders/new')}>
          <Plus size={14} /> New order
        </Button>
      </ContentHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <OrderStatCard label="Total orders" value={stats.total} sub="↑ 3 this week" action="Show all"
          active={status === 'All' && !q}
          onClick={() => { setStatus('All'); setQ(''); setPage(1) }} />
        <OrderStatCard label="Awaiting payment" value={stats.awaitingPayment} sub="invoice outstanding" action="Filter"
          valueColor="text-warning"
          active={status === 'Awaiting payment'}
          onClick={() => { setStatus(status === 'Awaiting payment' ? 'All' : 'Awaiting payment'); setPage(1) }} />
        <OrderStatCard label="Awaiting shipment" value={stats.awaitingShipment} sub="ready to activate & ship" action="Filter"
          valueColor="text-info"
          active={status === 'Awaiting shipment'}
          onClick={() => { setStatus(status === 'Awaiting shipment' ? 'All' : 'Awaiting shipment'); setPage(1) }} />
        <OrderStatCard label="In transit" value={stats.inTransit} sub="shipped or partially delivered" action="Filter"
          valueColor="text-success"
          active={status === 'In transit'}
          onClick={() => { setStatus(status === 'In transit' ? 'All' : 'In transit'); setPage(1) }} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 max-w-sm">
          <Input prefix={<Search size={14} />} placeholder="Search by order #, customer or model…" value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        </div>
        <Select value={status} onValueChange={(v) => { if (v) setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FILTER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        <Table
          columns={columns}
          rows={pageRows}
          rowKey={(o) => o.id}
          sort={sort}
          onSortChange={(s) => { setSort(s ?? { key: 'createdAt', dir: 'desc' }); setPage(1) }}
          onRowClick={(o) => router.push(`/devices/orders/${o.id}`)}
          empty="No orders match your filters."
        />
        <div className="flex items-center justify-between px-4 py-3 border-t border-line-subtle">
          <span className="text-xs text-content-tertiary">
            {pageRows.length === 0
              ? 'No results'
              : <>Showing <strong className="font-semibold text-content-primary">{(page - 1) * PAGE_SIZE + 1}</strong>–<strong className="font-semibold text-content-primary">{(page - 1) * PAGE_SIZE + pageRows.length}</strong> of <strong className="font-semibold text-content-primary">{filtered.length}</strong></>
            }
          </span>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}

function OrderStatCard({ label, value, sub, action, active, valueColor, onClick }: {
  label: string; value: number; sub: string; action: string; active: boolean; valueColor?: string; onClick: () => void
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
        type="button" aria-pressed={active} onClick={onClick}
        className="block w-full text-left cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1"
      >
        <CardContent className="p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-content-tertiary">{label}</div>
          <div className={['mt-1 text-2xl font-semibold tabular-nums', valueColor ?? 'text-content-primary'].join(' ')} style={{ letterSpacing: '-0.02em' }}>{value}</div>
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
