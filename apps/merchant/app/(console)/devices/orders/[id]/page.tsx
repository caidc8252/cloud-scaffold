'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, Download, Gift, Check, Truck, CreditCard, Clock, Users } from 'lucide-react'
import {
  Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Field, Slider,
} from '@cloud/ui'
import { CompanyLogo } from '@/components/layout/company-logo'
import { SEED_ORDERS, ORDER_STATUS_TONE, moneyUsd, orderTotal, orderSubtotal, deviceProgress,
  type Order } from '@/lib/data/orders'
import { fmtDate } from '@/lib/format'
import { StatusPipeline } from './_components/status-pipeline'
import { OverviewTab } from './_components/overview-tab'
import { ActivationTab } from './_components/activation-tab'
import { HistoryTab } from './_components/history-tab'

const PAYMENT_METHODS = [
  { id: 'wire', label: 'Corporate wire transfer', desc: 'Customer paid via their corporate bank account.' },
  { id: 'cash', label: 'Cash', desc: 'Cash received in person or at warehouse pickup.' },
  { id: 'check', label: 'Check', desc: 'Paper check, deposited into Carbon operating account.' },
  { id: 'card', label: 'Credit / debit card', desc: 'Card-present or invoice payment portal.' },
  { id: 'ach', label: 'ACH / direct debit', desc: 'US ACH or SEPA direct debit pull.' },
  { id: 'offset', label: 'Internal offset / credit', desc: 'Applied against an existing account credit or rebate.' },
  { id: 'other', label: 'Other', desc: 'Specify in the reference note below.' },
]

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const seed = SEED_ORDERS.find(o => o.id === id)
  const [order, setOrder] = useState<Order | undefined>(seed)

  const defaultTab =
    order?.status === 'Awaiting shipment' || order?.status === 'Partially complete' ? 'activation' :
    order?.status === 'Shipped' || order?.status === 'Complete' ? 'history' : 'overview'
  const [tab, setTab] = useState(defaultTab)

  const [payOpen, setPayOpen] = useState(false)
  const [payMethod, setPayMethod] = useState('wire')
  const [payRef, setPayRef] = useState('')
  const [payOther, setPayOther] = useState('')

  const [discOpen, setDiscOpen] = useState(false)
  const [discDraft, setDiscDraft] = useState(order?.discountPct ?? 0)
  const [discReason, setDiscReason] = useState('')

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <p className="text-content-tertiary text-sm">Order not found.</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/devices/orders')}>
          ← Back to orders
        </Button>
      </div>
    )
  }

  const subtotal = orderSubtotal(order)
  const total = orderTotal(order)
  const prog = deviceProgress(order)
  const allActivated = prog.done === prog.total

  const updateOrder = (next: Order) => setOrder(next)

  const markShipped = () => {
    if (!allActivated) return
    const next: Order = {
      ...order,
      status: 'Shipped',
      events: [...order.events, { at: new Date().toISOString(), kind: 'ship', by: 'jordan.d@carbon', text: `Shipped · all ${prog.total} devices activated and recorded` }],
    }
    updateOrder(next)
    toast.success(`Status → Shipped`, { description: `All ${prog.total} devices activated and recorded.` })
  }

  const confirmPaid = () => {
    const m = PAYMENT_METHODS.find(p => p.id === payMethod)
    const label = m?.label || 'Payment'
    const refTxt = payRef ? ` · ref ${payRef}` : ''
    const otherTxt = payMethod === 'other' && payOther ? ` (${payOther})` : ''
    updateOrder({
      ...order,
      status: 'Awaiting shipment',
      payment: { method: payMethod, methodLabel: label, reference: payRef, otherNote: payOther, recordedAt: new Date().toISOString(), recordedBy: 'jordan.d@carbon' },
      events: [...order.events, { at: new Date().toISOString(), kind: 'status', by: 'jordan.d@carbon', text: `Payment received via ${label}${otherTxt}${refTxt} · advanced to Awaiting shipment` }],
    })
    setPayOpen(false)
    toast.success('Marked paid', { description: `Recorded ${label}. Order is now Awaiting shipment.` })
  }

  const applyDiscount = () => {
    const pct = Math.max(0, Math.min(100, Number(discDraft) || 0))
    const oldPct = order.discountPct || 0
    if (pct === oldPct) { setDiscOpen(false); return }
    const reasonTxt = discReason ? ` · ${discReason}` : ''
    const shouldSkipPayment = order.status === 'Awaiting payment' && pct === 100
    updateOrder({
      ...order,
      discountPct: pct,
      status: shouldSkipPayment ? 'Awaiting shipment' : order.status,
      events: [
        ...order.events,
        { at: new Date().toISOString(), kind: 'info', by: 'jordan.d@carbon', text: `Discount changed ${oldPct}% → ${pct}%${reasonTxt}` },
        ...(shouldSkipPayment
          ? [{ at: new Date().toISOString(), kind: 'free', by: 'jordan.d@carbon', text: 'Marked as complimentary · advanced to Awaiting shipment' }]
          : []),
      ],
    })
    setDiscOpen(false)
    setDiscReason('')
    toast.success('Discount updated', { description: `Now ${pct === 100 ? 'complimentary' : pct + '% off'}.` })
  }

  const isShippedOrComplete = order.status === 'Shipped' || order.status === 'Complete'

  return (
    <div>
      {/* Back + header */}
      <div className="mb-6">
        <button className="flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors mb-4 cursor-pointer"
          onClick={() => router.push('/devices/orders')}>
          <ChevronLeft size={14} /> Back to orders
        </button>

        <div className="flex items-start gap-4">
          <CompanyLogo name={order.customerName} size={56} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold text-content-primary font-mono">{order.number}</h1>
              <Badge tone={(ORDER_STATUS_TONE[order.status] ?? 'neutral') as 'warning' | 'info' | 'success' | 'neutral'}>{order.status}</Badge>
              {order.discountPct === 100 && <Badge tone="success">Complimentary</Badge>}
              {order.discountPct > 0 && order.discountPct < 100 && <Badge tone="info">{order.discountPct}% off</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-content-tertiary">
              <span className="inline-flex items-center gap-1"><Users size={13} /> {order.customerName}</span>
              <span className="inline-flex items-center gap-1"><CreditCard size={13} /> {total === 0 ? 'FREE' : moneyUsd(total)}</span>
              <span className="inline-flex items-center gap-1"><Clock size={13} /> Created {fmtDate(order.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => router.push('/devices/orders')}>
              <ChevronLeft size={14} /> Back
            </Button>
            <Button variant="secondary" size="sm"><Download size={14} /> Invoice</Button>
            {(order.status === 'Awaiting payment' || order.status === 'Awaiting shipment') && (
              <Button variant="secondary" size="sm" onClick={() => { setDiscDraft(order.discountPct || 0); setDiscOpen(true) }}>
                <Gift size={14} /> {order.discountPct > 0 ? 'Edit discount' : 'Apply discount'}
              </Button>
            )}
            {order.status === 'Awaiting payment' && (
              <Button variant="primary" size="sm" onClick={() => setPayOpen(true)}>
                <Check size={14} /> Mark paid
              </Button>
            )}
            {order.status === 'Awaiting shipment' && (
              <Button variant="primary" size="sm" onClick={markShipped} disabled={!allActivated}
                title={!allActivated ? `${prog.total - prog.done} device(s) still need SN + activation codes` : ''}>
                <Truck size={14} /> {allActivated ? 'Ship order' : `Activate ${prog.total - prog.done} more`}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status pipeline card */}
      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 mb-5 overflow-hidden">
        <div className="px-5 py-1.5"><StatusPipeline order={order} /></div>
      </div>

      {/* Activation guard banner */}
      {order.status === 'Awaiting shipment' && (
        <div className={[
          'flex items-start gap-3 p-3.5 rounded-xl border mb-5 text-sm',
          allActivated ? 'bg-success-50 border-success/25 text-success' : 'bg-warning-50 border-warning/30 text-warning',
        ].join(' ')}>
          <Check size={15} className="shrink-0 mt-px" />
          <div>
            {allActivated
              ? <><strong>All {prog.total} devices activated.</strong> This order is ready to ship.</>
              : <><strong>{prog.done} of {prog.total} devices activated.</strong> Warehouse staff must enter the 6-digit activation code shown on each device before this order can be shipped — serial numbers are matched automatically.</>
            }
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v || 'overview')}>
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activation">
            Devices & activation
            <span className="ml-1 text-xs text-content-tertiary tabular-nums">({prog.done}/{prog.total})</span>
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab order={order} /></TabsContent>
        <TabsContent value="activation">
          <ActivationTab order={order} onUpdate={updateOrder} readonly={isShippedOrComplete} />
          {order.status === 'Awaiting shipment' && (
            <div className="mt-4 p-4 bg-surface-2 border border-line-default rounded-xl flex items-center gap-3.5">
              {allActivated ? <Check size={18} className="text-success" /> : <Clock size={18} className="text-warning" />}
              <div className="flex-1 text-[13px] text-content-primary">
                {allActivated ? 'All devices activated. You can proceed to shipping.' : `${prog.total - prog.done} device(s) still need their activation code entered.`}
              </div>
              <Button variant="primary" size="md" onClick={markShipped} disabled={!allActivated}>
                <Truck size={14} /> Ship order
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="history"><HistoryTab order={order} /></TabsContent>
      </Tabs>

      {/* Mark-paid dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              How did <strong className="text-content-primary">{order.customerName}</strong> pay <span className="tabular-nums">{moneyUsd(total)}</span> for this order?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 mt-2">
            {PAYMENT_METHODS.map(m => {
              const active = payMethod === m.id
              return (
                <label key={m.id} className={[
                  'flex gap-3 items-start p-3 rounded-xl border-1.5 cursor-pointer transition-colors',
                  active ? 'border-content-primary bg-surface-subtle' : 'border-line-default bg-surface-2',
                ].join(' ')}>
                  <input type="radio" name="payMethod" checked={active} onChange={() => setPayMethod(m.id)} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium text-content-primary">{m.label}</div>
                    <div className="text-xs text-content-tertiary mt-0.5">{m.desc}</div>
                  </div>
                </label>
              )
            })}
          </div>
          {payMethod === 'other' && (
            <div className="mt-3">
              <Field label="Specify method"><Input value={payOther} onChange={e => setPayOther(e.target.value)} placeholder="e.g. crypto, barter, escrow release…" /></Field>
            </div>
          )}
          <div className="mt-3">
            <Field label={`Reference / receipt no. ${payMethod === 'cash' ? '(optional)' : ''}`}>
              <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder={
                payMethod === 'wire' ? 'e.g. WT-2026-04-22-118832' :
                payMethod === 'check' ? 'e.g. Check #4421' :
                payMethod === 'card' ? 'Last 4 / auth code' :
                payMethod === 'ach' ? 'ACH trace number' :
                payMethod === 'offset' ? 'Credit memo ID' : 'Internal reference (optional)'
              } />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmPaid}><Check size={14} /> Confirm payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit discount dialog */}
      <Dialog open={discOpen} onOpenChange={setDiscOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{order.discountPct > 0 ? 'Edit discount' : 'Apply discount'}</DialogTitle>
            <DialogDescription>
              Lower the price for this order — anywhere from 0% to fully complimentary.
              Subtotal is <span className="tabular-nums">{moneyUsd(subtotal)}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 mb-2.5">
            <Input type="number" min={0} max={100} step={1} value={discDraft}
              onChange={e => setDiscDraft(Number(e.target.value))}
              className="w-[110px] text-right font-mono" />
            <div className="text-[13px] text-content-secondary">% off</div>
            <div className="flex-1" />
            <div className={`tabular-nums text-[15px] font-semibold ${(Number(discDraft) || 0) === 100 ? 'text-success' : 'text-content-primary'}`}>
              {(Number(discDraft) || 0) === 100 ? 'FREE' : moneyUsd(subtotal * (1 - (Number(discDraft) || 0) / 100))}
            </div>
          </div>
          <Slider value={[Number(discDraft) || 0] as const} onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; if (n !== undefined) setDiscDraft(n) }} min={0} max={100} step={1} />
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {[0, 5, 10, 25, 50, 100].map(p => (
              <button key={p} type="button" onClick={() => setDiscDraft(p)}
                className={['px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer',
                  Number(discDraft) === p ? 'bg-primary-700 text-white border-primary-700' : 'bg-surface-2 text-content-secondary border-line-default hover:border-line-strong',
                ].join(' ')}>
                {p === 100 ? 'Free' : p + '%'}
              </button>
            ))}
          </div>
          <div className="mt-3.5">
            <Field label="Reason (recorded in history)">
              <Input value={discReason} onChange={e => setDiscReason(e.target.value)} placeholder="e.g. partner pilot, exec approval, demo unit…" />
            </Field>
          </div>
          {(Number(discDraft) || 0) !== (order.discountPct || 0) && order.status === 'Awaiting payment' && (Number(discDraft) || 0) === 100 && (
            <div className="mt-3 p-3 rounded-lg bg-success-50 border border-success/25 text-success text-sm flex items-start gap-2.5">
              <Check size={14} className="shrink-0 mt-px" />
              <div>This order will no longer require payment — status will jump to <strong>Awaiting shipment</strong> on save.</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDiscOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={applyDiscount}><Check size={14} /> Save discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
