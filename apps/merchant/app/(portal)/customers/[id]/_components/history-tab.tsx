'use client'

import { toast } from 'sonner'
import { Filter, Download } from 'lucide-react'
import { Badge, Button } from '@cloud/ui'
import { type Customer } from '@/lib/data/customers'
import { fmtDateTime } from '@/lib/format'

interface HistoryTabProps {
  customer: Customer
}

type Tone = 'success' | 'info' | 'warning' | 'neutral' | 'error'

const KIND_META: Record<string, { tone: Tone; label: string }> = {
  created:     { tone: 'success', label: 'Created' },
  'contract+': { tone: 'info',    label: 'Contract added' },
  'contract✓': { tone: 'success', label: 'Contract signed' },
  'contract-': { tone: 'warning', label: 'Contract removed' },
  'operator+': { tone: 'info',    label: 'Operator invited' },
  info:        { tone: 'neutral', label: 'Info updated' },
  reveal:      { tone: 'warning', label: 'Sensitive data revealed' },
  warn:        { tone: 'warning', label: 'Status changed' },
  role:        { tone: 'info',    label: 'Role change' },
}

const DOT_BG: Record<Tone, string> = {
  success: 'bg-success',
  info:    'bg-info',
  warning: 'bg-warning',
  error:   'bg-error',
  neutral: 'bg-content-tertiary',
}

export function HistoryTab({ customer }: HistoryTabProps) {
  const events = [...customer.events].reverse()

  return (
    <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-line-subtle">
        <div>
          <span className="text-sm font-semibold text-content-primary">History</span>
          <span className="ml-1.5 text-xs text-content-tertiary tabular-nums">
            ({customer.events.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => toast.info('Filter not implemented in demo')}>
            <Filter size={13} /> Filter
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toast.info('Export started')}>
            <Download size={13} /> Export
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-content-tertiary">No events found.</div>
        ) : (
          <ol className="relative">
            {events.map((ev, i) => {
              const meta = KIND_META[ev.kind] ?? { tone: 'neutral' as Tone, label: ev.kind }
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 px-5 py-3.5 border-b border-line-subtle last:border-0"
                >
                  <div className="flex flex-col items-center pt-1.5">
                    <span className={`size-2.5 rounded-full ${DOT_BG[meta.tone]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-content-primary">{ev.text}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-content-tertiary flex-wrap">
                      <span>{fmtDateTime(ev.at)}</span>
                      <span>·</span>
                      <span>by <span className="font-mono">{ev.by}</span></span>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
    </div>
  )
}
