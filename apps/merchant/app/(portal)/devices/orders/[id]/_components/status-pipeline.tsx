import { Check, CreditCard, Package, Truck } from 'lucide-react'
import { type Order } from '@/lib/data/orders'

const PIPELINE = [
  { key: 'Awaiting payment',  label: 'Awaiting payment',  icon: CreditCard },
  { key: 'Awaiting shipment', label: 'Awaiting shipment', icon: Package },
  { key: 'Shipped',           label: 'Shipped',           icon: Truck },
  { key: 'Complete',          label: 'Complete',          icon: Check },
]

export function StatusPipeline({ order }: { order: Order }) {
  const idx = PIPELINE.findIndex(p =>
    p.key === order.status ||
    (p.key === 'Complete' && order.status === 'Partially complete') ||
    (p.key === 'Awaiting shipment' && order.status === 'Awaiting shipment')
  )
  const isPartial = order.status === 'Partially complete'
  const paidSkipped = order.discountPct === 100

  return (
    <div className="flex items-center gap-0 py-3.5">
      {PIPELINE.map((p, i) => {
        const done = i < idx || (i === 0 && paidSkipped && idx >= 0)
        const active = i === idx && !isPartial
        const partial = i === idx && isPartial

        return (
          <div key={p.key} className="flex items-center gap-0 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={[
                'size-9 rounded-full grid place-items-center shrink-0 border',
                done ? 'bg-success-50 text-success border-success/40' : active ? 'bg-primary-700 text-white border-primary-700 shadow-cta' : partial ? 'bg-info-50 text-info border-info/40' : 'bg-surface-3 text-content-tertiary border-line-default',
              ].join(' ')}>
                {done ? <Check size={16} /> : <p.icon size={16} />}
              </div>
              <div className="flex flex-col leading-tight">
                <small className="text-[10.5px] text-content-tertiary uppercase tracking-[0.06em] font-medium">Step {i + 1}</small>
                <strong className={['text-[13.5px]', active || partial ? 'font-semibold' : 'font-medium', active || done || partial ? 'text-content-primary' : 'text-content-secondary'].join(' ')}>
                  {paidSkipped && i === 0 ? 'No payment required' : p.label}
                  {partial && ' (partial)'}
                </strong>
              </div>
            </div>
            {i < PIPELINE.length - 1 && (
              <div className={['h-0.5 flex-1 mx-3.5 rounded-full', i < idx ? 'bg-success/40' : 'bg-line-default'].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
