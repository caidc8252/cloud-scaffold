'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardContent, PageHeader } from '@cloud/ui'
import { ContractBadge } from '@/components/layout/contract-badge'
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

  const handleCreate = () => {
    toast.success('Customer created', { description: `${company.name} has been registered.` })
    setStep(2)
  }

  return (
    <div>
      <PageHeader
        title="New customer"
        description="Register a company and configure its contracts. Operators can be added later from the customer detail."
      >
        <Button variant="ghost" size="md" onClick={() => router.push('/customers')}>
          <X size={14} /> Cancel
        </Button>
      </PageHeader>

      {/* Stepper */}
      <Card className="mb-8 px-6 py-4">
        <div className="flex items-center gap-0">
          {STEPS.map((it, i) => (
            <StepItem key={i} index={i} item={it} current={step} total={STEPS.length} />
          ))}
        </div>
      </Card>

      {step === 2 ? (
        /* Success screen — full width, no aside */
        <StepConfirm
          company={company}
          contracts={contracts}
          onGoToDetail={() => router.push('/customers/c-001')}
        />
      ) : (
        /* Wizard grid: main + aside */
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {step === 0 && (
              <StepCompany value={company} onChange={setCompany} />
            )}
            {step === 1 && (
              <StepContracts value={contracts} onChange={setContracts} />
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
                {step === 0 ? (
                  <Button variant="primary" size="md" disabled={!canContinue} onClick={() => setStep(1)}>
                    Continue <ChevronRight size={14} />
                  </Button>
                ) : (
                  <Button variant="primary" size="md" disabled={!canContinue} onClick={handleCreate}>
                    <Check size={14} /> Create customer
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Summary aside */}
          <aside className="flex flex-col gap-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
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
                              <ContractBadge key={k} kind={k} status="Active" />
                            ))}
                          </div>
                        )
                      }
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
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
