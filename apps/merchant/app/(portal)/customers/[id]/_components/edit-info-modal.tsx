'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, Modal, Input, Field, Textarea } from '@cloud/ui'
import { type Customer } from '@/lib/data/customers'

interface EditInfoModalProps {
  open: boolean
  customer: Customer
  onClose: () => void
  onSave: (next: Customer) => void
}

export function EditInfoModal({ open, customer, onClose, onSave }: EditInfoModalProps) {
  const [form, setForm] = useState({
    name: customer.name,
    address: customer.address,
    license: customer.license,
    notes: customer.notes,
  })

  useEffect(() => {
    if (open) {
      setForm({
        name: customer.name,
        address: customer.address,
        license: customer.license,
        notes: customer.notes,
      })
    }
  }, [open, customer])

  const valid = form.name.trim().length > 0 && form.address.trim().length > 0

  const handleSave = () => {
    onSave({ ...customer, ...form })
    toast.success('Customer info updated')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit customer info"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={handleSave}>Save changes</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Company name" required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Address" required>
          <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <Field label="License">
          <Input value={form.license} placeholder="Optional"
            onChange={(e) => setForm({ ...form, license: e.target.value })} />
        </Field>
        <Field label="Internal notes">
          <Textarea rows={2} value={form.notes} placeholder="Optional"
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}
