'use client'

import { Input, Field, Textarea } from '@cloud/ui'

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
  const set = (key: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [key]: e.target.value })

  return (
    <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 p-6">
      <h2 className="text-base font-semibold text-content-primary mb-4">Company information</h2>

      <div className="flex flex-col gap-4">
        <Field label="Company name" required>
          <Input
            placeholder="e.g. Northwind Commerce"
            value={value.name}
            onChange={set('name')}
            invalid={value.name.trim() === ''}
          />
        </Field>

        <Field label="Registered address" required>
          <Textarea
            placeholder="Full registered address including country"
            rows={3}
            value={value.address}
            onChange={set('address')}
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
    </div>
  )
}
