'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge, Button } from '@cloud/ui'
import { StepCompany, type CompanyForm } from './_components/step-company'
import { StepContracts, type ContractKind } from './_components/step-contracts'
import { StepConfirm } from './_components/step-confirm'

const STEPS = [
  { sub: 'Step 1', label: 'Company' },
  { sub: 'Step 2', label: 'Contracts' },
  { sub: 'Done',   label: 'Confirmation' },
]

const EMPTY_COMPANY: CompanyForm = { name: '', address: '', registrationNumber: '', license: '', notes: '' }

export default function NewCustomerPage() {
  const router  = useRouter()
  const [step, setStep]         = useState(0)
  const [company, setCompany]   = useState<CompanyForm>(EMPTY_COMPANY)
  const [contracts, setContracts] = useState<ContractKind[]>([])

  const canContinue = step === 0
    ? company.name.trim().length > 0 && company.address.trim().length > 0
    : contracts.length > 0

  const saveDraft = () => {
    toast.info('Draft saved', { description: 'Customer draft is available in this session.' })
  }

  const handleSubmit = () => {
    toast.success('Customer created', { description: `${company.name} has been registered.` })
    router.push('/customers/c-001')
  }

  return (
    <div className="p-6 pb-12">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-content-primary">New customer</h1>
          <p className="text-sm text-content-tertiary mt-0.5">
            Register a company and configure its contracts. Operators can be added later from the customer detail.
          </p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.push('/customers')}>
          <X size={14} /> Cancel
        </Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((it, i) => (
          <StepItem key={i} index={i} item={it} current={step} total={STEPS.length} />
        ))}
      </div>

      {/* Wizard grid: main + aside */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {step === 0 && (
            <StepCompany
              value={company}
              onChange={setCompany}
            />
          )}
          {step === 1 && (
            <StepContracts
              value={contracts}
              onChange={setContracts}
            />
          )}
          {step === 2 && (
            <StepConfirm
              company={company}
              contracts={contracts}
            />
          )}

          {/* Action row */}
          <div className="flex items-center justify-between mt-5">
            <Button variant="ghost" size="md" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft size={14} /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="md" onClick={saveDraft}>
                Save as draft
              </Button>
              {step < 2 ? (
                <Button variant="primary" size="md" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                  Continue <ChevronRight size={14} />
                </Button>
              ) : (
                <Button variant="primary" size="md" disabled={!company.name.trim() || !company.address.trim()} onClick={handleSubmit}>
                  <Check size={14} /> Create customer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Summary aside */}
        <aside className="flex flex-col gap-3">
          <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 p-5">
            <h2 className="text-sm font-semibold text-content-primary mb-4">Summary</h2>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div>
                <dt className="text-xs text-content-tertiary">Name</dt>
                <dd className="text-content-primary">{company.name || <span className="text-content-disabled">—</span>}</dd>
              </div>
              <div>
                <dt className="text-xs text-content-tertiary">Address</dt>
                <dd className="text-xs leading-relaxed text-content-primary">{company.address || <span className="text-content-disabled">—</span>}</dd>
              </div>
              {company.license && (
                <div>
                  <dt className="text-xs text-content-tertiary">License</dt>
                  <dd className="text-content-primary">{company.license}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-content-tertiary">Contracts</dt>
                <dd>
                  {contracts.length === 0
                    ? <span className="text-content-disabled text-xs">None selected</span>
                    : (
                      <div className="flex flex-wrap gap-1 mt-0.5">
	                        {contracts.map((k) => (
	                          <Badge key={k} tone="info">{k}</Badge>
	                        ))}
                      </div>
                    )
                  }
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StepItem({ index, item, current, total }: {
  index: number; item: { sub: string; label: string }; current: number; total: number
}) {
  const done    = index < current
  const active  = index === current
  const isLast  = index === total - 1

  return (
    <>
      <div className="flex items-center gap-2">
        <div
          className={[
            'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-fast',
            done || active
              ? 'bg-primary-700 text-content-on-primary border-primary-700'
              : 'bg-surface-3 text-content-tertiary border-line-default',
          ].join(' ')}
        >
          {done ? <Check size={14} /> : index + 1}
        </div>
        <div className="flex flex-col">
          <span
            className={active ? 'text-[11px] leading-tight text-content-secondary' : 'text-[11px] leading-tight text-content-tertiary'}
          >
            {item.sub}
          </span>
          <span
            className={[
              'text-xs leading-tight font-medium',
              active ? 'text-content-primary' : done ? 'text-content-secondary' : 'text-content-tertiary',
            ].join(' ')}
          >
            {item.label}
          </span>
        </div>
      </div>
      {!isLast && (
        <div
          className={[
            'h-0.5 flex-1 mx-2 rounded-full transition-colors',
            done ? 'bg-primary-700' : 'bg-line-default',
          ].join(' ')}
        />
      )}
    </>
  )
}
