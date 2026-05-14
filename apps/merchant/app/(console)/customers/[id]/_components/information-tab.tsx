'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Edit2 } from 'lucide-react'
import { Button, Input, Field, Textarea } from '@cloud/ui'
import { type Customer } from '@/lib/data/customers'

interface InformationTabProps {
  customer: Customer
  onSave: (c: Customer) => void
}

export function InformationTab({ customer, onSave }: InformationTabProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: customer.name,
    address: customer.address,
    license: customer.license,
    notes: customer.notes,
  })

  const handleSave = () => {
    onSave({ ...customer, ...form })
    setEditing(false)
    toast.success('Customer info updated')
  }

  const handleCancel = () => {
    setForm({ name: customer.name, address: customer.address, license: customer.license, notes: customer.notes })
    setEditing(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line-subtle">
          <span className="text-sm font-semibold text-content-primary">Basic information</span>
          {!editing ? (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Edit2 size={13} /> Edit
            </Button>
          ) : (
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
              <Button variant="primary" size="sm" disabled={!form.name.trim() || !form.address.trim()} onClick={handleSave}>
                Save changes
              </Button>
            </div>
          )}
        </div>

        <div className="px-5 py-4">
          {!editing ? (
            <dl className="grid gap-y-3 text-sm" style={{ gridTemplateColumns: '140px 1fr' }}>
              <dt className="text-content-tertiary py-0.5">Company name</dt>
              <dd className="text-content-primary font-medium">{customer.name}</dd>

              <dt className="text-content-tertiary py-0.5">Registered address</dt>
              <dd className="text-content-primary whitespace-pre-line">{customer.address}</dd>

              <dt className="text-content-tertiary py-0.5">Business license</dt>
              <dd className="text-content-primary">
                {customer.license || <span className="text-content-disabled">Not provided</span>}
              </dd>

              <dt className="text-content-tertiary py-0.5">Internal notes</dt>
              <dd className="text-content-secondary">
                {customer.notes || <span className="text-content-disabled">—</span>}
              </dd>
            </dl>
          ) : (
            <div className="flex flex-col gap-4">
              <Field label="Company name" required>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  invalid={!form.name.trim()}
                />
              </Field>
              <Field label="Registered address" required>
                <Textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Business license">
                  <Input
                    value={form.license}
                    onChange={(e) => setForm({ ...form, license: e.target.value })}
                  />
                </Field>
                <Field label="Internal notes">
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
