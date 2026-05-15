'use client'

import { useState, useEffect } from 'react'
import { Search, Truck } from 'lucide-react'
import {
  Input, Badge, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Field, Textarea, Card, CardHeader, CardTitle, CardContent, CardDescription,
} from '@cloud/ui'
import { CompanyLogo } from '@/components/layout/company-logo'
import { type Customer, type CustomerStatus } from '@/lib/data/customers'
import { type ShippingInfo } from '@/lib/data/orders'

const STATUS_TONE: Record<CustomerStatus, 'success' | 'info' | 'error'> = {
  Active: 'success', Onboarding: 'info', Suspended: 'error',
}

const SHIPPING_METHODS = ['Standard ground', 'Express overnight', 'International express', 'Freight', 'Customer pickup']

export function StepCustomer({ customers, customerId, setCustomerId, shipping, setShipping }: {
  customers: Customer[]
  customerId: string
  setCustomerId: (id: string) => void
  shipping: ShippingInfo
  setShipping: (s: ShippingInfo) => void
}) {
  const [q, setQ] = useState('')
  const filtered = customers.filter(c =>
    !q.trim() || c.name.toLowerCase().includes(q.toLowerCase()) || c.address.toLowerCase().includes(q.toLowerCase())
  )
  const selected = customers.find(c => c.id === customerId)

  useEffect(() => {
    if (selected && !shipping.address) {
      const admin = selected.operators.find(o => o.role === 'Admin') || selected.operators[0]
      setShipping({
        name: admin?.name || '',
        address: selected.address,
        method: 'Standard ground',
      })
    }
  }, [selected, shipping.address, setShipping])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose customer</CardTitle>
        <CardDescription>Orders are billed and shipped to the selected customer company.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input prefix={<Search size={14} />} placeholder="Search customers…" value={q} onChange={e => setQ(e.target.value)} />

        <div className="mt-4 flex flex-col gap-1.5 max-h-[280px] overflow-auto border border-line-default rounded-xl p-1.5">
          {filtered.length === 0 && <div className="py-8 text-center text-sm text-content-tertiary">No customers found.</div>}
          {filtered.map(c => {
            const on = c.id === customerId
            return (
              <button key={c.id} type="button" onClick={() => setCustomerId(c.id)}
                className={[
                  'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer',
                  on ? 'bg-primary-50 border border-primary-200' : 'hover:bg-surface-hover border border-transparent',
                ].join(' ')}>
                <CompanyLogo name={c.name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-content-primary">{c.name}</div>
                  <div className="text-xs text-content-tertiary truncate">{c.address.split(',').slice(-2).join(',').trim()} · {c.operators.length} operators</div>
                </div>
                <Badge tone={STATUS_TONE[c.status] ?? 'neutral'}>{c.status}</Badge>
              </button>
            )
          })}
        </div>

        {selected && (
          <div className="mt-5 p-4 bg-surface-3 border border-line-subtle rounded-xl">
            <div className="text-xs text-content-tertiary uppercase tracking-[0.06em] font-medium mb-3 flex items-center gap-1.5">
              <Truck size={13} /> Shipping address
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <Field label="Recipient">
                <Input value={shipping.name} onChange={e => setShipping({ ...shipping, name: e.target.value })} placeholder="Name" />
              </Field>
              <Field label="Method">
                <Select value={shipping.method} onValueChange={(v) => { if (v) setShipping({ ...shipping, method: v }) }}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHIPPING_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Address">
                <Textarea value={shipping.address} onChange={e => setShipping({ ...shipping, address: e.target.value })} rows={2} />
              </Field>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
