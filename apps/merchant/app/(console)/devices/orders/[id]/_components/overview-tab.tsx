import { moneyUsd, orderSubtotal, orderTotal,
  type Order } from '@/lib/data/orders'
import { fmtDateTime } from '@/lib/format'

export function OverviewTab({ order }: { order: Order }) {
  const subtotal = orderSubtotal(order)
  const total = orderTotal(order)

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      {/* Line items */}
      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line-subtle flex items-center justify-between">
          <h3 className="text-sm font-semibold text-content-primary">Line items</h3>
          <span className="text-xs text-content-tertiary">{order.items.length} model{order.items.length === 1 ? '' : 's'}</span>
        </div>
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
            {order.items.map(i => {
              const done = i.devices.filter(d => d.sn && d.code && d.code.length === 6).length
              return (
                <tr key={i.id} className="border-t border-line-subtle">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-content-primary">{i.modelName}</div>
                    <div className="text-[11px] text-content-tertiary">{done}/{i.qty} activated{i.shipped ? ' · shipped' : ''}</div>
                  </td>
                  <td className="px-4 py-2.5 text-content-secondary">{i.type}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-content-secondary">{moneyUsd(i.unitPrice)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-content-secondary">{i.qty}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-content-primary font-medium">{moneyUsd(i.unitPrice * i.qty)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="px-4 py-2.5 text-right text-content-secondary border-t border-line-subtle">Subtotal</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-content-primary border-t border-line-subtle">{moneyUsd(subtotal)}</td>
            </tr>
            {order.discountPct > 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-2 text-right text-success">Discount ({order.discountPct}%)</td>
                <td className="px-4 py-2 text-right tabular-nums text-success">− {moneyUsd(subtotal * order.discountPct / 100)}</td>
              </tr>
            )}
            <tr className="bg-surface-3">
              <td colSpan={4} className="px-4 py-3 text-right font-semibold border-t border-line-default">Total</td>
              <td className={`px-4 py-3 text-right font-bold text-[17px] tabular-nums border-t border-line-default ${total === 0 ? 'text-success' : 'text-content-primary'}`}>
                {total === 0 ? 'FREE' : moneyUsd(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-3.5">
        <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-line-subtle">
            <h3 className="text-sm font-semibold text-content-primary">Shipping</h3>
          </div>
          <div className="p-4">
            <dl className="grid gap-2.5 text-sm" style={{ gridTemplateColumns: '90px 1fr' }}>
              <dt className="text-content-tertiary">Recipient</dt>
              <dd className="text-content-primary">{order.shipping?.name || <span className="text-content-disabled">—</span>}</dd>
              <dt className="text-content-tertiary">Address</dt>
              <dd className="text-content-primary text-xs leading-relaxed">{order.shipping?.address}</dd>
              <dt className="text-content-tertiary">Method</dt>
              <dd className="text-content-primary">{order.shipping?.method}</dd>
              {order.shipping?.tracking && (
                <>
                  <dt className="text-content-tertiary">Tracking</dt>
                  <dd className="font-mono text-[12.5px] text-content-primary">{order.shipping.tracking}</dd>
                </>
              )}
            </dl>
          </div>
        </div>

        <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-line-subtle">
            <h3 className="text-sm font-semibold text-content-primary">Order metadata</h3>
          </div>
          <div className="p-4">
            <dl className="grid gap-2.5 text-sm" style={{ gridTemplateColumns: '90px 1fr' }}>
              <dt className="text-content-tertiary">Created</dt>
              <dd className="text-content-primary">{fmtDateTime(order.createdAt)}</dd>
              <dt className="text-content-tertiary">By</dt>
              <dd className="font-mono text-[12.5px] text-content-primary">{order.createdBy}</dd>
              {order.notes && (
                <>
                  <dt className="text-content-tertiary">Notes</dt>
                  <dd className="text-content-secondary">{order.notes}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
