import { Check, ChevronRight } from 'lucide-react'
import { Button, Card, CardContent } from '@cloud/ui'
import { type CompanyForm } from './step-company'
import { type ContractKind } from './step-contracts'

interface StepConfirmProps {
  company: CompanyForm
  contracts: ContractKind[]
  onGoToDetail: () => void
}

export function StepConfirm({ company, contracts, onGoToDetail }: StepConfirmProps) {
  return (
    <Card>
      <CardContent className="py-10 px-8 text-center">
        {/* Success icon */}
        <div className="inline-grid place-items-center size-[72px] rounded-full bg-success-50 text-success-700 border border-[oklch(58%_0.14_152/0.25)] mb-[18px]">
          <Check size={36} />
        </div>

        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-content-primary mb-2">
          Customer created
        </h2>

        <p className="text-sm text-content-secondary mb-6 max-w-[460px] mx-auto leading-[1.55]">
          <strong className="text-content-primary">{company.name}</strong> is now registered with{' '}
          {contracts.length} active contract{contracts.length === 1 ? '' : 's'}. You can add
          operators and start placing orders from the customer detail page.
        </p>

        <div className="flex justify-center">
          <Button variant="primary" size="md" onClick={onGoToDetail}>
            Open customer detail <ChevronRight size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
