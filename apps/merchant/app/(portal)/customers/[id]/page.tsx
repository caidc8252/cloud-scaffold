'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Clock, Edit2, Plus, Shield } from 'lucide-react'
import { fmtDate } from '@/lib/format'
import {
  Badge, Button, Card, Tabs, TabsList, TabsTrigger, TabsContent,
} from '@cloud/ui'
import { CompanyLogo } from '@/components/layout/company-logo'
import { SEED_CUSTOMERS, type Customer, type CustomerStatus } from '@/lib/data/customers'
import { OverviewTab } from './_components/overview-tab'
import { ContractsTab } from './_components/contracts-tab'
import { OperatorsTab } from './_components/operators-tab'
import { HistoryTab } from './_components/history-tab'
import { EditInfoModal } from './_components/edit-info-modal'

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
  const [editOpen, setEditOpen] = useState(false)

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

  const handleSaveInfo = (next: Customer) => {
    setCustomer({
      ...next,
      events: [
        ...next.events,
        { at: new Date().toISOString(), kind: 'info', by: 'admin@carbon', text: 'Basic information updated' },
      ],
    })
  }

  return (
    <div>
      <button
        className="flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors mb-4 cursor-pointer"
        onClick={() => router.push('/customers')}
      >
        <ChevronLeft size={14} /> Back to customers
      </button>

      <Card className="mb-6 p-5">
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
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Edit2 size={13} /> Edit info
            </Button>
            <Button variant="primary" size="sm" onClick={() => setTab('contracts')}>
              <Plus size={13} /> Add contract
            </Button>
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v || 'overview')}>
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="operators">Operators &amp; roles</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab customer={customer} onSave={handleSaveInfo} />
        </TabsContent>
        <TabsContent value="contracts">
          <ContractsTab customer={customer} onSave={setCustomer} />
        </TabsContent>
        <TabsContent value="operators">
          <OperatorsTab customer={customer} onSave={setCustomer} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab customer={customer} />
        </TabsContent>
      </Tabs>

      <EditInfoModal
        open={editOpen}
        customer={customer}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveInfo}
      />
    </div>
  )
}
