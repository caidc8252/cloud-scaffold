'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, FileText, Shield, Check, Link as LinkIcon, Download, Trash2 } from 'lucide-react'
import { Button, Badge, Modal, Field, Textarea } from '@cloud/ui'
import {
  type Customer,
  type Contract,
  type ContractKind,
  type ContractStatus,
} from '@/lib/data/customers'
import { ContractBadge } from '@/components/layout/contract-badge'
import { fmtDate, fmtDateTime, maskEmail, relTime } from '@/lib/format'

interface ContractsTabProps {
  customer: Customer
  onSave: (c: Customer) => void
}

const ALL_KINDS: ContractKind[] = ['ISV', 'ISO', 'Acquirer', 'PayFac']

const KIND_ICON: Record<ContractKind, React.ReactNode> = {
  ISV:      <FileText size={18} />,
  ISO:      <Shield size={18} />,
  Acquirer: <Check size={18} />,
  PayFac:   <LinkIcon size={18} />,
}

const CONTRACT_INFO: Record<ContractKind, string> = {
  ISV:      'Independent Software Vendor',
  ISO:      'Independent Sales Organization',
  Acquirer: 'Merchant acquirer',
  PayFac:   'Payment facilitator',
}

const KIND_HUE: Record<ContractKind, { bg: string; fg: string }> = {
  ISV:      { bg: 'bg-primary-50', fg: 'text-primary-700' },
  ISO:      { bg: 'bg-info-bg',    fg: 'text-info-strong' },
  Acquirer: { bg: 'bg-success-bg', fg: 'text-success-strong' },
  PayFac:   { bg: 'bg-warning-bg', fg: 'text-warning-strong' },
}

const STATUS_TONE: Record<ContractStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  Active:     'success',
  Signed:     'success',
  Pending:    'warning',
  Terminated: 'error',
}

const isActiveLike = (s: ContractStatus) => s === 'Active' || s === 'Signed'

export function ContractsTab({ customer, onSave }: ContractsTabProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [picked, setPicked] = useState<ContractKind[]>([])
  const [viewTarget, setViewTarget] = useState<Contract | null>(null)
  const [removeTarget, setRemoveTarget] = useState<{ contract: Contract; index: number } | null>(null)
  const [reason, setReason] = useState('')

  const existing = customer.contracts.map((c) => c.kind)
  const available = ALL_KINDS.filter((k) => !existing.includes(k))

  const handleAdd = () => {
    if (picked.length === 0) return
    const now = new Date().toISOString()
    const newContracts: Contract[] = picked.map((k) => ({
      kind: k,
      status: 'Active',
      signedAt: now,
      signedBy: 'admin@carbon',
    }))
    const newEvents = picked.map((k) => ({
      at: now,
      kind: 'contract+',
      by: 'admin@carbon',
      text: `${k} contract configured · active`,
    }))
    onSave({
      ...customer,
      contracts: [...customer.contracts, ...newContracts],
      events: [...customer.events, ...newEvents],
    })
    setAddOpen(false)
    setPicked([])
    toast.success(`${picked.length} contract${picked.length === 1 ? '' : 's'} added`, {
      description: 'Active immediately.',
    })
  }

  const handleRemove = () => {
    if (!removeTarget) return
    const { contract, index } = removeTarget
    const now = new Date().toISOString()
    const isTerminating = isActiveLike(contract.status)
    const contracts = isTerminating
      ? customer.contracts.map((c, i) => (i === index ? { ...c, status: 'Terminated' as const } : c))
      : customer.contracts.filter((_, i) => i !== index)
    const event = {
      at: now,
      kind: 'contract-',
      by: 'admin@carbon',
      text: isTerminating
        ? `${contract.kind} contract terminated${reason.trim() ? ` · ${reason.trim()}` : ''}`
        : `${contract.kind} contract removed`,
    }
    onSave({
      ...customer,
      contracts,
      events: [...customer.events, event],
    })
    toast.warning(isTerminating ? `${contract.kind} contract terminated` : `${contract.kind} contract removed`)
    setRemoveTarget(null)
    setReason('')
  }

  const togglePick = (k: ContractKind) => {
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))
  }

  return (
    <div>
      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line-subtle">
          <div>
            <span className="text-sm font-semibold text-content-primary">Contracts</span>
            <span className="ml-1.5 text-xs text-content-tertiary tabular-nums">
              ({customer.contracts.length})
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={available.length === 0}
            onClick={() => { setPicked([]); setAddOpen(true) }}
          >
            <Plus size={13} /> Add contract
          </Button>
        </div>

        {customer.contracts.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-content-tertiary">
            No contracts yet. Click "Add contract" to assign one.
          </div>
        ) : (
          customer.contracts.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-line-subtle last:border-0">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${KIND_HUE[c.kind].bg} ${KIND_HUE[c.kind].fg}`}>
                {KIND_ICON[c.kind]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-content-primary">{c.kind}</span>
                  <ContractBadge kind={c.status} status={c.status} />
                </div>
                <div className="text-xs text-content-tertiary mt-0.5">
                  {isActiveLike(c.status) && (
                    <>Active · configured {c.signedAt ? fmtDate(c.signedAt) : relTime(customer.registeredAt)} by {maskEmail(c.signedBy ?? 'admin@carbon')}</>
                  )}
                  {c.status === 'Pending' && <>Pending activation · created {relTime(customer.registeredAt)}</>}
                  {c.status === 'Terminated' && (
                    <>Terminated · originally active from {c.signedAt ? fmtDate(c.signedAt) : '—'}</>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isActiveLike(c.status) && (
                  <Button variant="ghost" size="sm" onClick={() => setViewTarget(c)}>
                    <FileText size={13} /> View details
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={isActiveLike(c.status) ? 'text-error hover:text-error' : ''}
                  onClick={() => { setRemoveTarget({ contract: c, index: i }); setReason('') }}
                >
                  <Trash2 size={13} /> {isActiveLike(c.status) ? 'Terminate' : 'Remove'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add contract"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={picked.length === 0} onClick={handleAdd}>
              Add {picked.length > 0 ? `(${picked.length})` : ''}
            </Button>
          </>
        }
      >
        {available.length === 0 ? (
          <div className="text-center text-sm text-content-tertiary py-6">
            All contract types are already assigned.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <p className="text-xs text-content-secondary">
              Each added contract becomes <strong>active immediately</strong> — no customer-side signing required.
            </p>
            {available.map((k) => {
              const on = picked.includes(k)
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => togglePick(k)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors cursor-pointer ${
                    on
                      ? 'border-primary bg-primary/5'
                      : 'border-line-default bg-surface-2 hover:bg-surface-hover'
                  }`}
                >
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${KIND_HUE[k].bg} ${KIND_HUE[k].fg}`}>
                    {KIND_ICON[k]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-content-primary">{k}</div>
                    <div className="text-xs text-content-tertiary mt-0.5">{CONTRACT_INFO[k]}</div>
                  </div>
                  <div
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      on ? 'border-primary bg-primary text-primary-foreground' : 'border-line-strong'
                    }`}
                  >
                    {on && <Check size={11} />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Modal>

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Contract details"
        footer={
          <>
            <Button variant="ghost" onClick={() => toast.info('Signed PDF download started')}>
              <Download size={13} /> Download PDF
            </Button>
            <Button variant="primary" onClick={() => setViewTarget(null)}>Close</Button>
          </>
        }
      >
        {viewTarget && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${KIND_HUE[viewTarget.kind].bg} ${KIND_HUE[viewTarget.kind].fg}`}>
                {KIND_ICON[viewTarget.kind]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-md font-semibold text-content-primary">{viewTarget.kind} Contract</div>
                <div className="text-xs text-content-tertiary mt-0.5">{CONTRACT_INFO[viewTarget.kind]}</div>
              </div>
              <Badge tone={STATUS_TONE[viewTarget.status] ?? 'neutral'}>{viewTarget.status}</Badge>
            </div>
            <dl className="grid gap-y-2.5 text-sm" style={{ gridTemplateColumns: '130px 1fr' }}>
              <dt className="text-content-tertiary">Contract ID</dt>
              <dd className="text-content-primary font-mono text-xs">
                CT-{viewTarget.kind.toUpperCase()}-{String(customer.id || '0000').padStart(4, '0')}
              </dd>
              <dt className="text-content-tertiary">Status</dt>
              <dd><Badge tone={STATUS_TONE[viewTarget.status] ?? 'neutral'}>{viewTarget.status}</Badge></dd>
              <dt className="text-content-tertiary">Signed at</dt>
              <dd className="text-content-primary">
                {viewTarget.signedAt ? fmtDateTime(viewTarget.signedAt) : <span className="text-content-disabled">—</span>}
              </dd>
              <dt className="text-content-tertiary">Signed by</dt>
              <dd className="text-content-primary">
                {viewTarget.signedBy
                  ? <span>{maskEmail(viewTarget.signedBy)} <span className="text-content-tertiary ml-1 text-xs">(Customer admin)</span></span>
                  : <span className="text-content-disabled">—</span>}
              </dd>
              <dt className="text-content-tertiary">IP address</dt>
              <dd className="text-content-primary font-mono text-xs">
                198.51.100.{(viewTarget.kind.charCodeAt(0) % 99) + 1}
              </dd>
              <dt className="text-content-tertiary">Effective from</dt>
              <dd className="text-content-primary">
                {viewTarget.signedAt ? fmtDate(viewTarget.signedAt) : <span className="text-content-disabled">—</span>}
              </dd>
              <dt className="text-content-tertiary">Term</dt>
              <dd className="text-content-primary">12 months · auto-renew</dd>
            </dl>
          </div>
        )}
      </Modal>

      <Modal
        open={!!removeTarget}
        onClose={() => { setRemoveTarget(null); setReason('') }}
        title={removeTarget && isActiveLike(removeTarget.contract.status) ? 'Terminate contract' : 'Remove contract'}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setRemoveTarget(null); setReason('') }}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemove}>
              <Trash2 size={13} /> {removeTarget && isActiveLike(removeTarget.contract.status) ? 'Terminate contract' : 'Remove contract'}
            </Button>
          </>
        }
      >
        {removeTarget && (
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-content-primary">
              {isActiveLike(removeTarget.contract.status) ? (
                <>You're about to terminate <strong>{removeTarget.contract.kind}</strong>. The customer will lose access to features granted by this contract.</>
              ) : (
                <>Remove the <strong>{removeTarget.contract.kind}</strong> contract? It will be deleted from this customer.</>
              )}
            </p>
            {isActiveLike(removeTarget.contract.status) && (
              <Field label="Reason (audit log)">
                <Textarea
                  rows={2}
                  placeholder="e.g. customer requested transition to PayFac model"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
