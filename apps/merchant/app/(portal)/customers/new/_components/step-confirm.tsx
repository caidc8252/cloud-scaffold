import { Badge } from '@cloud/ui'
import { type CompanyForm } from './step-company'
import { type ContractKind } from './step-contracts'

interface StepConfirmProps {
  company: CompanyForm
  contracts: ContractKind[]
}

export function StepConfirm({ company, contracts }: StepConfirmProps) {
  return (
    <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
      <div className="px-5 py-4 border-b border-line-subtle">
        <h2 className="text-base font-semibold text-content-primary">Review & confirm</h2>
        <p className="text-sm text-content-tertiary mt-0.5">Please check the details before creating the customer.</p>
      </div>

      {/* Company info */}
      <div className="px-5 py-4 border-b border-line-subtle">
        <div className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-3">Company information</div>
        <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-sm">
          <dt className="text-content-tertiary">Name</dt>
          <dd className="text-content-primary font-medium">{company.name}</dd>

          <dt className="text-content-tertiary">Address</dt>
          <dd className="text-content-primary whitespace-pre-line">{company.address}</dd>

          {company.registrationNumber && (
            <>
              <dt className="text-content-tertiary">Registration</dt>
              <dd className="text-content-primary">{company.registrationNumber}</dd>
            </>
          )}
          {company.license && (
            <>
              <dt className="text-content-tertiary">License</dt>
              <dd className="text-content-primary">{company.license}</dd>
            </>
          )}
          {company.notes && (
            <>
              <dt className="text-content-tertiary">Notes</dt>
              <dd className="text-content-secondary italic">{company.notes}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Contracts */}
      <div className="px-5 py-4">
        <div className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-3">Contracts</div>
        {contracts.length === 0 ? (
          <p className="text-sm text-content-tertiary">No contracts selected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {contracts.map((k) => (
              <Badge key={k} tone="info">{k}</Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-content-tertiary mt-3">
          Contracts will be created in <strong>Pending</strong> status. The customer admin must sign to activate them.
        </p>
      </div>
    </div>
  )
}
