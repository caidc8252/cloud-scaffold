'use client'

import { useState } from 'react'
import { FileText, Plus, CheckCircle, AlertTriangle, Info, User } from 'lucide-react'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@cloud/ui'
import { type Customer } from '@/lib/data/customers'
import { fmtDateTime } from '@/lib/format'

interface AuditTabProps {
  customer: Customer
}

type EventCategory = 'All' | 'Customer' | 'Contract' | 'Operator'

const EVENT_CATEGORY: Record<string, EventCategory> = {
  created:     'Customer',
  info:        'Customer',
  warn:        'Customer',
  'contract+': 'Contract',
  'contract✓': 'Contract',
  'operator+': 'Operator',
  reveal:      'Customer',
}

const EVENT_ICON: Record<string, React.ReactNode> = {
  created:     <Plus size={13} />,
  info:        <Info size={13} />,
  warn:        <AlertTriangle size={13} />,
  'contract+': <FileText size={13} />,
  'contract✓': <CheckCircle size={13} />,
  'operator+': <User size={13} />,
  reveal:      <Info size={13} />,
}

const EVENT_COLOR: Record<string, string> = {
  created:     'var(--color-info-500)',
  info:        'var(--color-content-tertiary)',
  warn:        'var(--color-warning-500)',
  'contract+': 'var(--color-content-secondary)',
  'contract✓': 'var(--color-success-500)',
  'operator+': 'var(--color-content-secondary)',
  reveal:      'var(--color-content-tertiary)',
}

export function AuditTab({ customer }: AuditTabProps) {
  const [category, setCategory] = useState<EventCategory>('All')

  const events = [...customer.events]
    .filter((e) => category === 'All' || EVENT_CATEGORY[e.kind] === category)
    .reverse()

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-semibold text-content-primary flex-1">Audit log</h3>
        <Select value={category} onValueChange={(v) => { if (v) setCategory(v as EventCategory) }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All categories</SelectItem>
            <SelectItem value="Customer">Customer</SelectItem>
            <SelectItem value="Contract">Contract</SelectItem>
            <SelectItem value="Operator">Operator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        {events.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-content-tertiary">No events found.</div>
        ) : (
          <div>
            {events.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5 border-b border-line-subtle last:border-0">
                {/* Icon */}
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-surface-3)',
                  color: EVENT_COLOR[ev.kind] ?? 'var(--color-content-tertiary)',
                }}>
                  {EVENT_ICON[ev.kind] ?? <Info size={13} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm text-content-primary">{ev.text}</span>
                  </div>
                  <div className="text-xs text-content-tertiary mt-0.5">
                    by <span className="font-mono">{ev.by}</span>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-content-tertiary shrink-0 pt-0.5">
                  {fmtDateTime(ev.at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
