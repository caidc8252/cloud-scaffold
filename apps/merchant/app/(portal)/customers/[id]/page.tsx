'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Clock, MoreHorizontal, Plus, Shield } from 'lucide-react'
import { fmtDate } from '@/lib/format'
import {
  Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@cloud/ui'
import { CompanyLogo } from '@/components/layout/company-logo'
import { SEED_CUSTOMERS, type Customer, type CustomerStatus } from '@/lib/data/customers'
import { OverviewTab } from './_components/overview-tab'
import { InformationTab } from './_components/information-tab'
import { ContractsTab } from './_components/contracts-tab'
import { OperatorsTab } from './_components/operators-tab'
import { AuditTab } from './_components/audit-tab'

const STATUS_TONE: Record<CustomerStatus, 'success' | 'info' | 'error'> = {
  Active:     'success',
  Onboarding: 'info',
  Suspended:  'error',
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const seed = SEED_CUSTOMERS.find((c) => c.id === id)
  const [customer, setCustomer] = useState<Customer | undefined>(seed)
  const [tab, setTab] = useState('overview')

  if (!customer) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-3">
        <p className="text-content-tertiary text-sm">Customer not found.</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/customers')}>
          ← Back to customers
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 pb-12">
      {/* Back + header */}
      <div className="mb-6">
        <button
          className="flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors mb-4 cursor-pointer"
          onClick={() => router.push('/customers')}
        >
          <ChevronLeft size={14} /> Back to customers
        </button>

        <div className="flex items-start gap-4">
          <CompanyLogo name={customer.name} size={56} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold text-content-primary">{customer.name}</h1>
              <Badge tone={STATUS_TONE[customer.status] ?? 'neutral'}>{customer.status}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-content-tertiary">
              <span className="inline-flex items-center gap-1"><Clock size={13} /> Registered {fmtDate(customer.registeredAt)}</span>
              {customer.license && (
                <span className="inline-flex items-center gap-1"><Shield size={13} /> {customer.license}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="primary" size="sm" onClick={() => setTab('contracts')}><Plus size={13} /> Add contract</Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line-default bg-surface-2 px-3 py-1.5 text-sm font-medium text-content-primary hover:bg-surface-hover transition-colors cursor-pointer">
                <MoreHorizontal size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Suspend customer</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-error focus:text-error">
                  Delete customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v || 'overview')}>
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="contracts">
            Contracts
            {customer.contracts.length > 0 && (
              <span className="ml-1 text-xs text-content-tertiary tabular-nums">({customer.contracts.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="operators">
            Operators
            {customer.operators.length > 0 && (
              <span className="ml-1 text-xs text-content-tertiary tabular-nums">({customer.operators.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab customer={customer} onSave={(updated) => setCustomer(updated)} />
        </TabsContent>
        <TabsContent value="information">
          <InformationTab customer={customer} onSave={(updated) => setCustomer(updated)} />
        </TabsContent>
        <TabsContent value="contracts">
          <ContractsTab customer={customer} onSave={(updated) => setCustomer(updated)} />
        </TabsContent>
        <TabsContent value="operators">
          <OperatorsTab customer={customer} onSave={(updated) => setCustomer(updated)} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTab customer={customer} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
