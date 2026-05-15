'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, FileText, Shield, Check, Link, X } from 'lucide-react'
import {
  Button, Badge, Modal,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@cloud/ui'
import { type Customer, type Contract, type ContractKind } from '@/lib/data/customers'
import { fmtDate, maskEmail } from '@/lib/format'

interface ContractsTabProps {
  customer: Customer
  onSave: (c: Customer) => void
}

const KIND_ICONS: Record<string, React.ReactNode> = {
  ISV:      <FileText size={16} />,
  ISO:      <Shield size={16} />,
  Acquirer: <Check size={16} />,
  PayFac:   <Link size={16} />,
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  Active:     'success',
  Signed:     'success',
  Pending:    'warning',
  Terminated: 'error',
}

export function ContractsTab({ customer, onSave }: ContractsTabProps) {
  const [addOpen, setAddOpen]             = useState(false)
  const [terminateTarget, setTerminateTarget] = useState<number | null>(null)
  const [newKind, setNewKind]             = useState<ContractKind>('ISV')

  const existing = customer.contracts.map((c) => c.kind)
  const available = (['ISV', 'ISO', 'Acquirer', 'PayFac'] as ContractKind[]).filter((k) => !existing.includes(k))

  const handleAdd = () => {
    const newContract: Contract = {
      kind: newKind,
      status: 'Pending',
      signedAt: null,
      signedBy: null,
    }
    onSave({ ...customer, contracts: [...customer.contracts, newContract] })
    setAddOpen(false)
    toast.success(`${newKind} contract added`)
  }

  const handleTerminate = () => {
    if (terminateTarget === null) return
    const updated = customer.contracts.map((c, i) =>
      i === terminateTarget ? { ...c, status: 'Terminated' as const } : c,
    )
    onSave({ ...customer, contracts: updated })
    setTerminateTarget(null)
    toast.success('Contract terminated')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-content-primary">Contracts</h3>
          <p className="text-xs text-content-tertiary mt-0.5">{customer.contracts.length} contract{customer.contracts.length !== 1 ? 's' : ''}</p>
        </div>
        {available.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => { setNewKind(available[0]); setAddOpen(true) }}>
            <Plus size={13} /> Add contract
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        {customer.contracts.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-content-tertiary">No contracts yet.</div>
        ) : (
          customer.contracts.map((c, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-line-subtle last:border-0">
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--color-surface-3)', color: 'var(--color-content-secondary)',
              }}>
                {KIND_ICONS[c.kind] ?? <FileText size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-content-primary">{c.kind}</span>
                  <Badge tone={STATUS_TONE[c.status] ?? 'neutral'}>{c.status}</Badge>
                </div>
                <div className="text-xs text-content-tertiary mt-0.5">
                  {c.signedAt
                    ? `Signed ${fmtDate(c.signedAt)} · by ${maskEmail(c.signedBy ?? '')}`
                    : 'Awaiting customer admin signature'}
                </div>
              </div>
              {c.status !== 'Terminated' && (
                <Button variant="ghost" size="sm" onClick={() => setTerminateTarget(i)}>
                  <X size={13} /> Terminate
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add contract modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add contract"
        description="Select a contract type to attach to this customer."
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd}>Add contract</Button>
          </div>
        }
      >
        <div className="py-2">
          <Select value={newKind} onValueChange={(v) => { if (v) setNewKind(v as ContractKind) }}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {available.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Modal>

      {/* Terminate confirmation modal */}
      <Modal
        open={terminateTarget !== null}
        onClose={() => setTerminateTarget(null)}
        title="Terminate contract"
        description={`Are you sure you want to terminate the ${terminateTarget !== null ? customer.contracts[terminateTarget]?.kind : ''} contract? This action cannot be undone.`}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setTerminateTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleTerminate}>Terminate</Button>
          </div>
        }
      />
    </div>
  )
}
