'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Edit2, FileText, Shield, Check, Link } from 'lucide-react'
import { Button, Input, Field, Textarea } from '@cloud/ui'
import { ContractBadge } from '@/components/layout/contract-badge'
import { type ContractKind, type Customer } from '@/lib/data/customers'
import { fmtDate, fmtDateTime, maskEmail, relTime } from '@/lib/format'

interface OverviewTabProps {
  customer: Customer
  onSave: (c: Customer) => void
}

const CONTRACT_ICON: Record<ContractKind, typeof FileText> = {
  ISV: FileText,
  ISO: Shield,
  Acquirer: Check,
  PayFac: Link,
}

export function OverviewTab({ customer, onSave }: OverviewTabProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ name: customer.name, address: customer.address, license: customer.license, notes: customer.notes })

  const handleSave = () => {
    onSave({ ...customer, ...form })
    setEditing(false)
    toast.success('Customer info updated')
  }

  const signedContracts = customer.contracts.filter((c) => c.status === 'Active' || c.status === 'Signed').length
  const lastEvent = customer.events.at(-1)

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
      {/* Left column */}
      <div className="flex flex-col gap-5">
        {/* Company card */}
        <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-line-subtle">
            <span className="text-sm font-semibold text-content-primary">Company</span>
            {!editing ? (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <Edit2 size={13} /> Edit
              </Button>
            ) : (
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => { setForm({ name: customer.name, address: customer.address, license: customer.license, notes: customer.notes }); setEditing(false) }}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" disabled={!form.name.trim() || !form.address.trim()} onClick={handleSave}>
                  Save
                </Button>
              </div>
            )}
          </div>
          <div className="px-5 py-4">
            {!editing ? (
              <dl className="grid gap-y-2.5 text-sm" style={{ gridTemplateColumns: '120px 1fr' }}>
                <dt className="text-content-tertiary">Name</dt>
                <dd className="text-content-primary font-medium">{customer.name}</dd>
                <dt className="text-content-tertiary">Address</dt>
                <dd className="text-content-primary whitespace-pre-line">{customer.address}</dd>
                <dt className="text-content-tertiary">License</dt>
                <dd className="text-content-primary">{customer.license || <span className="text-content-disabled">Not provided</span>}</dd>
                <dt className="text-content-tertiary">Notes</dt>
                <dd className="text-content-secondary">{customer.notes || <span className="text-content-disabled">—</span>}</dd>
                <dt className="text-content-tertiary">Registered</dt>
                <dd className="text-content-primary">{fmtDateTime(customer.registeredAt)}</dd>
              </dl>
            ) : (
              <div className="flex flex-col gap-4">
                <Field label="Company name" required>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Address" required>
                  <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="License">
                    <Input value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} />
                  </Field>
                  <Field label="Notes">
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </Field>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contracts summary */}
        <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-line-subtle">
            <span className="text-sm font-semibold text-content-primary">Contracts</span>
          </div>
          {customer.contracts.length === 0 ? (
            <div className="px-5 py-6 text-sm text-content-tertiary text-center">No contracts yet.</div>
          ) : (
            <div>
              {customer.contracts.map((c, i) => {
                const Icon = CONTRACT_ICON[c.kind]
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-line-subtle last:border-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-content-secondary">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-content-primary">{c.kind}</span>
                        <ContractBadge kind={c.kind} status={c.status} />
                      </div>
                      <div className="text-xs text-content-tertiary mt-0.5">
                        {c.signedAt
                          ? `Signed ${fmtDate(c.signedAt)} · by ${maskEmail(c.signedBy ?? '')}`
                          : 'Awaiting customer admin signature'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right column — mini stats */}
      <div className="flex flex-col gap-3.5">
        <div className="bg-surface-2 rounded-lg py-3.5 px-4">
          <div className="text-xs text-content-tertiary mb-1">Signed contracts</div>
          <div className="text-2xl font-semibold text-content-primary tabular-nums">
            {signedContracts}
            <span className="text-sm font-normal text-content-tertiary"> / {customer.contracts.length}</span>
          </div>
        </div>
        <div className="bg-surface-2 rounded-lg py-3.5 px-4">
          <div className="text-xs text-content-tertiary mb-1">Operators</div>
          <div className="text-2xl font-semibold text-content-primary tabular-nums">{customer.operators.length}</div>
          <div className="text-xs text-content-secondary mt-0.5">
            {customer.operators.filter((o) => !o.pending).length} active
          </div>
        </div>
        <div className="bg-surface-2 rounded-lg py-3.5 px-4">
          <div className="text-xs text-content-tertiary mb-1">Last activity</div>
          <div className="text-lg font-semibold text-content-primary">
            {lastEvent ? relTime(lastEvent.at) : '—'}
          </div>
          {lastEvent && <div className="text-xs text-content-tertiary mt-0.5 truncate">{lastEvent.text}</div>}
        </div>
      </div>
    </div>
  )
}
