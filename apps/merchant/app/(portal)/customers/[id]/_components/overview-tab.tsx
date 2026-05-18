'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Edit2, Check } from 'lucide-react'
import { Button, Input, Field, Textarea } from '@cloud/ui'
import { type Customer } from '@/lib/data/customers'
import { fmtDateTime, relTime } from '@/lib/format'

interface OverviewTabProps {
  customer: Customer
  onSave: (c: Customer) => void
}

export function OverviewTab({ customer, onSave }: OverviewTabProps) {
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({
    name: customer.name,
    address: customer.address,
    license: customer.license,
    notes: customer.notes,
  })

  useEffect(() => {
    setForm({
      name: customer.name,
      address: customer.address,
      license: customer.license,
      notes: customer.notes,
    })
  }, [customer])

  const valid = form.name.trim().length > 0 && form.address.trim().length > 0

  const handleSave = () => {
    onSave({ ...customer, ...form })
    setEdit(false)
    toast.success('Customer info updated')
  }

  const handleCancel = () => {
    setForm({
      name: customer.name,
      address: customer.address,
      license: customer.license,
      notes: customer.notes,
    })
    setEdit(false)
  }

  const signedContracts = customer.contracts.filter((c) => c.status === 'Active' || c.status === 'Signed').length
  const activeOperators = customer.operators.filter((o) => !o.pending).length
  const lastEvent = customer.events.at(-1)

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-line-subtle">
            <span className="text-sm font-semibold text-content-primary">Company</span>
            {!edit ? (
              <Button variant="secondary" size="sm" onClick={() => setEdit(true)}>
                <Edit2 size={13} /> Edit
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
                <Button variant="primary" size="sm" disabled={!valid} onClick={handleSave}>
                  <Check size={13} /> Save changes
                </Button>
              </div>
            )}
          </div>
          <div className="px-5 py-4">
            {!edit ? (
              <dl className="grid gap-y-2.5 text-sm" style={{ gridTemplateColumns: '120px 1fr' }}>
                <dt className="text-content-tertiary">Name</dt>
                <dd className="text-content-primary font-medium">{customer.name}</dd>
                <dt className="text-content-tertiary">Address</dt>
                <dd className="text-content-primary whitespace-pre-line">{customer.address}</dd>
                <dt className="text-content-tertiary">License</dt>
                <dd className="text-content-primary">
                  {customer.license || <span className="text-content-disabled">Not provided</span>}
                </dd>
                <dt className="text-content-tertiary">Notes</dt>
                <dd className="text-content-secondary">
                  {customer.notes || <span className="text-content-disabled">—</span>}
                </dd>
                <dt className="text-content-tertiary">Registered</dt>
                <dd className="text-content-primary">{fmtDateTime(customer.registeredAt)}</dd>
              </dl>
            ) : (
              <div className="flex flex-col gap-4">
                <Field label="Company name" required>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Address" required>
                  <Textarea rows={2} value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="License">
                    <Input value={form.license} placeholder="Optional"
                      onChange={(e) => setForm({ ...form, license: e.target.value })} />
                  </Field>
                  <Field label="Internal notes">
                    <Input value={form.notes} placeholder="Optional"
                      onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </Field>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
          <div className="text-xs text-content-secondary mt-0.5">{activeOperators} active</div>
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
