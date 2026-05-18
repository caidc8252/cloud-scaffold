'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Plus, MoreHorizontal, UserX, KeyRound, Mail, Lock, Unlock, Eye, EyeOff,
} from 'lucide-react'
import {
  Button, Badge, Modal,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@cloud/ui'
import { type Customer, type Operator } from '@/lib/data/customers'
import { maskEmail, relTime } from '@/lib/format'
import { CompanyLogo } from '@/components/layout/company-logo'
import { usePIIMask } from '@/components/layout/pii-mask-context'
import { InviteOperatorModal } from './invite-operator-modal'
import { RolesSection } from './roles-section'

interface OperatorsTabProps {
  customer: Customer
  onSave: (c: Customer) => void
}

type ConfirmAction = 'remove' | 'lock' | 'unlock'

export function OperatorsTab({ customer, onSave }: OperatorsTabProps) {
  const { maskOn, isRevealed, toggleReveal } = usePIIMask()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ op: Operator; index: number; action: ConfirmAction } | null>(null)

  const scope = (i: number, field: string) => `${customer.id}:op:${i}:${field}`

  const pushEvent = (kind: string, text: string) =>
    onSave({
      ...customer,
      events: [
        ...customer.events,
        { at: new Date().toISOString(), kind, by: 'admin@carbon', text },
      ],
    })

  const handleReveal = (i: number, op: Operator) => {
    const next = toggleReveal(scope(i, 'email'))
    if (next) {
      toast.info('Sensitive field revealed', { description: 'This action is recorded in the audit log.' })
      pushEvent('reveal', `Revealed email for operator ${maskEmail(op.email)}`)
    }
  }

  const handleInvite = (op: Operator) => {
    const text = op.email
      ? `Operator invited · ${op.email}`
      : 'Operator invite link generated'
    onSave({
      ...customer,
      operators: [...customer.operators, op],
      events: [...customer.events, { at: new Date().toISOString(), kind: 'operator+', by: 'admin@carbon', text }],
    })
  }

  const runQuickAction = (op: Operator, action: 'reset' | 'resend') => {
    if (action === 'reset') {
      toast.success('Password reset email sent', { description: op.email })
    } else {
      toast.success('Activation link resent', { description: op.email })
    }
  }

  const handleConfirm = () => {
    if (!confirm) return
    const { op, index, action } = confirm
    if (action === 'remove') {
      onSave({
        ...customer,
        operators: customer.operators.filter((_, i) => i !== index),
        events: [
          ...customer.events,
          { at: new Date().toISOString(), kind: 'warn', by: 'admin@carbon', text: `Operator removed · ${op.email}` },
        ],
      })
      toast.warning('Operator removed', { description: op.email })
    } else {
      const lock = action === 'lock'
      onSave({
        ...customer,
        operators: customer.operators.map((o, i) => (i === index ? { ...o, locked: lock } : o)),
        events: [
          ...customer.events,
          {
            at: new Date().toISOString(),
            kind: 'warn',
            by: 'admin@carbon',
            text: lock ? `Operator locked · ${op.email}` : `Operator unlocked · ${op.email}`,
          },
        ],
      })
      toast.success(lock ? 'Account locked' : 'Account unlocked', { description: op.email })
    }
    setConfirm(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line-subtle">
          <div>
            <span className="text-sm font-semibold text-content-primary">Operators</span>
            <span className="ml-1.5 text-xs text-content-tertiary tabular-nums">
              ({customer.operators.length})
            </span>
          </div>
          <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
            <Plus size={13} /> Invite operator
          </Button>
        </div>

        {customer.operators.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-content-tertiary">No operators yet.</div>
        ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="bg-surface-3">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default">Last login</th>
                  <th className="px-4 py-3 border-b border-line-default w-10" />
                </tr>
              </thead>
              <tbody>
                {customer.operators.map((op, i) => {
                  const showEmail = !maskOn || isRevealed(scope(i, 'email'))
                  return (
                    <tr key={i} className="border-b border-line-subtle last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <CompanyLogo name={op.name || op.email} size={28} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {op.name ? (
                                <span className="text-content-primary font-medium">{op.name}</span>
                              ) : (
                                <span className="text-content-disabled italic">Not yet provided</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {op.pending && <Badge tone="warning">Pending activation</Badge>}
                              {op.locked && <Badge tone="error">Locked</Badge>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-content-secondary">
                            {showEmail ? op.email : maskEmail(op.email)}
                          </span>
                          {maskOn && (
                            <RevealToggle
                              revealed={isRevealed(scope(i, 'email'))}
                              onClick={() => handleReveal(i, op)}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={op.role === 'Admin' ? 'info' : 'neutral'}>{op.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {op.lastLogin ? relTime(op.lastLogin) : <span className="text-content-disabled">Never</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center size-7 rounded-lg text-content-tertiary hover:bg-surface-hover hover:text-content-primary transition-colors cursor-pointer">
                            <MoreHorizontal size={14} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {op.pending ? (
                              <DropdownMenuItem onClick={() => runQuickAction(op, 'resend')}>
                                <Mail size={13} /> Resend activation
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => runQuickAction(op, 'reset')}>
                                <KeyRound size={13} /> Reset password
                              </DropdownMenuItem>
                            )}
                            {!op.pending && (
                              op.locked ? (
                                <DropdownMenuItem onClick={() => setConfirm({ op, index: i, action: 'unlock' })}>
                                  <Unlock size={13} /> Unlock account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setConfirm({ op, index: i, action: 'lock' })}>
                                  <Lock size={13} /> Lock account
                                </DropdownMenuItem>
                              )
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-error focus:text-error"
                              onClick={() => setConfirm({ op, index: i, action: 'remove' })}
                            >
                              <UserX size={13} /> Remove operator
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
      </div>

      <RolesSection customer={customer} onSave={onSave} />

      <InviteOperatorModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={handleInvite} />

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.action === 'remove'
            ? 'Remove operator'
            : confirm?.action === 'lock'
              ? 'Lock account'
              : 'Unlock account'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant={confirm?.action === 'remove' ? 'destructive' : 'primary'}
              onClick={handleConfirm}
            >
              {confirm?.action === 'remove'
                ? 'Remove operator'
                : confirm?.action === 'lock'
                  ? 'Lock account'
                  : 'Unlock account'}
            </Button>
          </>
        }
      >
        {confirm && (
          <p className="text-sm leading-relaxed text-content-primary">
            {confirm.action === 'remove' && (
              <>Remove <strong>{confirm.op.name || confirm.op.email}</strong> from this customer? They will lose access immediately. This action is audited.</>
            )}
            {confirm.action === 'lock' && (
              <>Lock <strong>{confirm.op.name || confirm.op.email}</strong>? They won't be able to sign in until you unlock the account.</>
            )}
            {confirm.action === 'unlock' && (
              <>Unlock <strong>{confirm.op.name || confirm.op.email}</strong>? They'll regain sign-in access immediately.</>
            )}
          </p>
        )}
      </Modal>
    </div>
  )
}

function RevealToggle({ revealed, onClick }: { revealed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={revealed}
      className={`inline-flex w-16 shrink-0 items-center justify-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors cursor-pointer tabular-nums ${
        revealed
          ? 'bg-warning-bg text-warning-strong hover:bg-warning-bg/70'
          : 'bg-primary/10 text-primary hover:bg-primary/15'
      }`}
    >
      {revealed ? <EyeOff size={11} /> : <Eye size={11} />}
      {revealed ? 'Hide' : 'Reveal'}
    </button>
  )
}
