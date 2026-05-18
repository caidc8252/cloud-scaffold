'use client'

import { Sparkles } from 'lucide-react'
import { Slider, Card, CardHeader, CardTitle, CardContent, CardDescription } from '@cloud/ui'
import { moneyUsd } from '@/lib/data/orders'

export function StepPricing({ subtotal, discountPct, setDiscountPct }: {
  subtotal: number; discountPct: number; setDiscountPct: (pct: number) => void
}) {
  const discountAmount = subtotal * (discountPct / 100)
  const total = subtotal - discountAmount
  const free = total <= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing & discount</CardTitle>
        <CardDescription>You may apply any discount from 0% up to 100% (complimentary).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[1.2fr_1fr] gap-5">
          <div>
            <div className="text-xs text-content-tertiary uppercase tracking-[0.06em] font-medium mb-2">Discount</div>
            <div className="flex items-baseline gap-2">
              <input type="number" min={0} max={100}
                value={discountPct}
                onChange={e => setDiscountPct(Math.max(0, Math.min(100, parseInt(e.target.value || '0', 10))))}
                className="w-20 text-[28px] font-semibold px-2 py-1 border border-line-default rounded-lg text-content-primary bg-surface-2 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary-500" />
              <span className="text-2xl text-content-secondary font-medium">%</span>
              <span className="ml-auto text-xs text-content-tertiary">off subtotal</span>
            </div>
            <div className="mt-4">
              <Slider value={[discountPct] as const} onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; if (n !== undefined) setDiscountPct(n) }} min={0} max={100} step={1} />
            </div>
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {[0, 5, 10, 25, 50, 100].map(p => (
                <button key={p} type="button" onClick={() => setDiscountPct(p)}
                  className={[
                    'px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer',
                    discountPct === p
                      ? 'bg-primary-700 text-white border-primary-700'
                      : 'bg-surface-2 text-content-secondary border-line-default hover:border-line-strong',
                  ].join(' ')}>
                  {p === 100 ? 'Free' : `${p}%`}
                </button>
              ))}
            </div>
            {free && (
              <div className="mt-4 p-3 rounded-lg bg-success-50 border border-success/20 text-success text-sm flex items-start gap-2.5">
                <Sparkles size={14} className="shrink-0 mt-px" />
                <div><strong>Complimentary order.</strong> No payment required — the order will skip <em>Awaiting payment</em> and go straight to <em>Awaiting shipment</em>.</div>
              </div>
            )}
          </div>

          <div className="p-4 bg-surface-3 border border-line-subtle rounded-xl">
            <div className="text-xs text-content-tertiary uppercase tracking-[0.06em] font-medium mb-2.5">Order total</div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-content-secondary">Subtotal</span>
                <span className="tabular-nums">{moneyUsd(subtotal)}</span>
              </div>
              {discountPct > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount ({discountPct}%)</span>
                  <span className="tabular-nums">− {moneyUsd(discountAmount)}</span>
                </div>
              )}
              <div className="border-t border-line-default my-1.5" />
              <div className="flex justify-between text-lg font-semibold items-baseline">
                <span>Total</span>
                <span className={`tabular-nums ${free ? 'text-success' : 'text-content-primary'}`}>{free ? 'FREE' : moneyUsd(total)}</span>
              </div>
              <div className="text-[11.5px] text-content-tertiary mt-1">
                Next status: <strong className={free ? 'text-info' : 'text-warning'}>{free ? 'Awaiting shipment' : 'Awaiting payment'}</strong>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
