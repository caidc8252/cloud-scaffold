import { fmtDateTime } from '@/lib/format'
import { type Order, type OrderEvent } from '@/lib/data/orders'

const EVENT_TONE: Record<string, string> = {
  created: 'neutral',
  paid: 'success',
  free: 'success',
  deliver: 'success',
  ship: 'info',
  activate: 'info',
  status: 'success',
  info: 'warning',
}

export function HistoryTab({ order }: { order: Order }) {
  const events = [...order.events].reverse()

  return (
    <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-line-subtle">
        <h3 className="text-sm font-semibold text-content-primary">Timeline</h3>
      </div>
      <div className="p-4">
        <div className="flex flex-col gap-0">
          {events.map((e, i) => (
            <EventRow key={i} event={e} />
          ))}
        </div>
      </div>
    </div>
  )
}

function EventRow({ event }: { event: OrderEvent }) {
  const tone = EVENT_TONE[event.kind] || 'neutral'
  const dotColor = tone === 'success' ? 'bg-success' : tone === 'info' ? 'bg-info' : tone === 'warning' ? 'bg-warning' : 'bg-content-tertiary'

  return (
    <div className="flex gap-3 py-2.5 border-b border-line-subtle last:border-0">
      <div className={`mt-1.5 size-2 rounded-full ${dotColor} shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-content-primary">{event.text}</div>
        <div className="text-xs text-content-tertiary mt-0.5 flex items-center gap-1">
          <span>{fmtDateTime(event.at)}</span>
          <span>·</span>
          <span>{event.by}</span>
        </div>
      </div>
    </div>
  )
}
