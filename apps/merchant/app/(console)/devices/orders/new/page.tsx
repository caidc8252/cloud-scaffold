'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Card, ContentHeader } from '@cloud/ui'
import { SEED_CUSTOMERS } from '@/lib/data/customers'
import { moneyUsd, type OrderItem, type ShippingInfo } from '@/lib/data/orders'
import { StepCustomer } from './_components/step-customer'
import { StepModels } from './_components/step-models'
import { StepPricing } from './_components/step-pricing'
import { StepReview } from './_components/step-review'

const STEPS = [
  { sub: 'Step 1', label: 'Customer' },
  { sub: 'Step 2', label: 'Models & quantities' },
  { sub: 'Step 3', label: 'Pricing & discount' },
  { sub: 'Done', label: 'Review & create' },
]

export default function NewOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [customerId, setCustomerId] = useState(SEED_CUSTOMERS[0]?.id || '')
  const [shipping, setShipping] = useState<ShippingInfo>({ name: '', address: '', method: 'Standard ground' })
  const [items, setItems] = useState<OrderItem[]>([])
  const [discountPct, setDiscountPct] = useState(0)
  const [notes, setNotes] = useState('')

  const customer = SEED_CUSTOMERS.find(c => c.id === customerId)
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.qty, 0)
  const total = subtotal * (1 - discountPct / 100)

  const canNext = useMemo(() => {
    if (step === 1) return !!customerId && !!shipping.address.trim()
    if (step === 2) return items.length > 0 && items.every(i => i.qty > 0)
    return true
  }, [step, customerId, shipping, items])

  const handleCreate = () => {
    if (!customer) return
    const num = `SO-2026-${String(200 + Math.floor(Math.random() * 99)).padStart(4, '0')}`
    const status = total === 0 ? 'Awaiting shipment' : 'Awaiting payment'
    toast.success(`Order ${num} created`, {
      description: status === 'Awaiting payment' ? 'Invoice issued · awaiting payment' : 'No payment required · ready to ship',
    })
    router.push('/devices/orders')
  }

  return (
    <div>
      <ContentHeader
        title="New sample order"
        description="Create a sample device order for a customer company."
      >
        <Button variant="ghost" size="md" onClick={() => router.push('/devices/orders')}>
          <X size={14} /> Cancel
        </Button>
      </ContentHeader>

      {/* Stepper */}
      <Card className="mb-5 px-6 py-4">
        <div className="flex items-center gap-0">
          {STEPS.map((it, i) => (
            <StepItem key={i} index={i} item={it} current={step} total={STEPS.length} />
          ))}
        </div>
      </Card>

      {/* Wizard grid */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {step === 1 && <StepCustomer customers={SEED_CUSTOMERS} customerId={customerId} setCustomerId={setCustomerId} shipping={shipping} setShipping={setShipping} />}
          {step === 2 && <StepModels items={items} setItems={setItems} />}
          {step === 3 && <StepPricing subtotal={subtotal} discountPct={discountPct} setDiscountPct={setDiscountPct} />}
          {step === 4 && customer && <StepReview customer={customer} items={items} discountPct={discountPct} shipping={shipping} notes={notes} setNotes={setNotes} />}

          <div className="flex items-center justify-between mt-5">
            <Button variant="ghost" size="md" disabled={step === 1} onClick={() => setStep(s => Math.max(1, s - 1))}>
              <ChevronLeft size={14} /> Back
            </Button>
            {step < 4 ? (
              <Button variant="primary" size="md" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
                Continue <ChevronRight size={14} />
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={handleCreate}>
                <Check size={14} /> Create order
              </Button>
            )}
          </div>
        </div>

        {/* Summary aside */}
        <aside className="flex flex-col gap-3">
          <Card size="sm">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-content-primary mb-3">Order summary</h4>
              <dl className="flex flex-col gap-2 text-sm">
                <div>
                  <dt className="text-xs text-content-tertiary">Customer</dt>
                  <dd className="text-content-primary">{customer ? customer.name : <span className="text-content-disabled">—</span>}</dd>
                </div>
                <div>
                  <dt className="text-xs text-content-tertiary">Models</dt>
                  <dd className="text-content-primary">{items.length === 0 ? <span className="text-content-disabled">—</span> : `${items.length} model${items.length === 1 ? '' : 's'}`}</dd>
                </div>
                <div>
                  <dt className="text-xs text-content-tertiary">Units</dt>
                  <dd className="tabular-nums text-content-primary">{items.reduce((n, i) => n + i.qty, 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-content-tertiary">Subtotal</dt>
                  <dd className="tabular-nums text-content-primary">{moneyUsd(subtotal)}</dd>
                </div>
                {discountPct > 0 && (
                  <div>
                    <dt className="text-xs text-content-tertiary">Discount</dt>
                    <dd className="tabular-nums text-success">− {moneyUsd(subtotal * discountPct / 100)}</dd>
                  </div>
                )}
                <div className="pt-1.5 border-t border-line-subtle">
                  <dt className="text-xs text-content-tertiary">Total</dt>
                  <dd className={`tabular-nums font-semibold ${total === 0 ? 'text-success' : 'text-content-primary'}`}>
                    {total === 0 ? 'FREE' : moneyUsd(total)}
                  </dd>
                </div>
              </dl>
              <div className="mt-3.5 p-2.5 bg-surface-3 border border-line-subtle rounded-lg text-[11.5px] text-content-secondary leading-relaxed">
                <strong className="text-content-primary">Next:</strong> once created, the warehouse team will activate each device and enter its serial number plus six activation codes before shipping.
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function StepItem({ index, item, current, total }: {
  index: number; item: { sub: string; label: string }; current: number; total: number
}) {
  const done = index + 1 < current
  const active = index + 1 === current
  const isLast = index === total - 1

  return (
    <>
      <div className="flex items-center gap-2">
        <div className={[
          'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-fast',
          done || active
            ? 'bg-primary-700 text-content-on-primary border-primary-700'
            : 'bg-surface-3 text-content-tertiary border-line-default',
        ].join(' ')}>
          {done ? <Check size={14} /> : index + 1}
        </div>
        <div className="flex flex-col">
          <span className={active ? 'text-[11px] leading-tight text-content-secondary' : 'text-[11px] leading-tight text-content-tertiary'}>
            {item.sub}
          </span>
          <span className={[
            'text-xs leading-tight font-medium',
            active ? 'text-content-primary' : done ? 'text-content-secondary' : 'text-content-tertiary',
          ].join(' ')}>
            {item.label}
          </span>
        </div>
      </div>
      {!isLast && (
        <div className={[
          'h-0.5 flex-1 mx-2 rounded-full transition-colors',
          done ? 'bg-primary-700' : 'bg-line-default',
        ].join(' ')} />
      )}
    </>
  )
}
