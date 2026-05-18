'use client'

import { useState } from 'react'
import { Input, Field, Textarea, Card, CardHeader, CardTitle, CardContent } from '@cloud/ui'

export interface CompanyForm {
  name: string
  address: string
  registrationNumber: string
  license: string
  notes: string
}

interface StepCompanyProps {
  value: CompanyForm
  onChange: (v: CompanyForm) => void
}

export function StepCompany({ value, onChange }: StepCompanyProps) {
  const [touched, setTouched] = useState<Partial<Record<keyof CompanyForm, boolean>>>({})

  const set = (key: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [key]: e.target.value })

  const touch = (key: keyof CompanyForm) => () =>
    setTouched((t) => ({ ...t, [key]: true }))

  const nameError    = touched.name    && !value.name.trim()    ? 'Company name is required' : undefined
  const addressError = touched.address && !value.address.trim() ? 'Registered address is required' : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Field label="Company name" required error={nameError}>
            <Input
              placeholder="e.g. Northwind Commerce"
              value={value.name}
              onChange={set('name')}
              onBlur={touch('name')}
              invalid={!!nameError}
            />
          </Field>

          <Field label="Registered address" required error={addressError}>
            <Textarea
              placeholder="Full registered address including country"
              rows={3}
              value={value.address}
              onChange={set('address')}
              onBlur={touch('address')}
              aria-invalid={!!addressError || undefined}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Registration number">
              <Input
                placeholder="e.g. NW-2024-08831"
                value={value.registrationNumber}
                onChange={set('registrationNumber')}
              />
            </Field>
            <Field label="Business license">
              <Input
                placeholder="e.g. CA-BL-44217"
                value={value.license}
                onChange={set('license')}
              />
            </Field>
          </div>

          <Field label="Internal notes" hint="Optional. Visible to admins only.">
            <Textarea
              placeholder="Any context about this company…"
              rows={2}
              value={value.notes}
              onChange={set('notes')}
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}
