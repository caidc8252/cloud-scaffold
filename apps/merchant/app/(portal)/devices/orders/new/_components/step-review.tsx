'use client'

import { Card, CardHeader, CardTitle, CardContent, Field, Textarea } from '@cloud/ui'
import { CompanyLogo } from '@/components/layout/company-logo'
import { type Customer } from '@/lib/data/customers'
import { moneyUsd, type OrderItem, type ShippingInfo } from '@/lib/data/orders'

export function StepReview({ customer, items, discountPct, shipping, notes, setNotes }: {
  customer: Customer
  items: OrderItem[]
  discountPct: number
  shipping: ShippingInfo
  notes: string
  setNotes: (notes: string) => void
}) {
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.qty, 0)
  const total = subtotal * (1 - discountPct / 100)

  return (
    <div className="flex flex-col gap-3.5">
      <Card>
        <CardHeader><CardTitle>Review order</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-2.5 text-sm" style={{ gridTemplateColumns: '120px 1fr' }}>
            <dt className="text-content-tertiary">Customer</dt>
            <dd className="flex items-center gap-2 text-content-primary">
              <CompanyLogo name={customer.name} size={24} /> <strong>{customer.name}</strong>
            </dd>
            <dt className="text-content-tertiary">Ship to</dt>
            <dd className="text-content-primary">
              {shipping.name} · {shipping.method}<br />
              <span className="text-xs text-content-tertiary">{shipping.address}</span>
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
        <div className="overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-surface-3">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Model</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Type</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-content-tertiary uppercase">Unit</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-content-tertiary uppercase">Qty</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-content-tertiary uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-t border-line-subtle">
                  <td className="px-4 py-2.5"><strong className="text-content-primary">{i.modelName}</strong></td>
                  <td className="px-4 py-2.5 text-content-secondary">{i.type}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-content-secondary">{moneyUsd(i.unitPrice)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-content-secondary">{i.qty}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-content-primary font-medium">{moneyUsd(i.unitPrice * i.qty)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line-subtle">
                <td colSpan={4} className="px-4 py-2 text-right text-content-secondary">Subtotal</td>
                <td className="px-4 py-2 text-right tabular-nums text-content-primary">{moneyUsd(subtotal)}</td>
              </tr>
              {discountPct > 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right text-success">Discount ({discountPct}%)</td>
                  <td className="px-4 py-2 text-right tabular-nums text-success">− {moneyUsd(subtotal * discountPct / 100)}</td>
                </tr>
              )}
              <tr className="border-t border-line-default bg-surface-3">
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-content-primary">Total</td>
                <td className={`px-4 py-3 text-right font-semibold tabular-nums ${total === 0 ? 'text-success' : 'text-content-primary'}`}>
                  {total === 0 ? 'FREE' : moneyUsd(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card>
        <CardContent>
          <Field label="Internal notes" hint="Visible only to Carbon staff.">
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional — e.g. quarterly refresh batch, evaluation units…" />
          </Field>
        </CardContent>
      </Card>
    </div>
  )
}
