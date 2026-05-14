'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, UserX, Shield, RefreshCw } from 'lucide-react'
import {
  Button, Badge, Modal, Input, Field,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@cloud/ui'
import { type Customer, type Operator } from '@/lib/data/customers'
import { maskEmail } from '@/lib/format'
import { SEED_ROLES } from '@/lib/data/roles'

interface OperatorsTabProps {
  customer: Customer
  onSave: (c: Customer) => void
}

export function OperatorsTab({ customer, onSave }: OperatorsTabProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [editTarget, setEditTarget] = useState<number | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Operator')
  const [editRole, setEditRole] = useState('')

  const roles = SEED_ROLES.map((r) => r.name)

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    const op: Operator = {
      name: '', email: inviteEmail.trim(),
      phone: '', role: inviteRole,
      lastLogin: null, pending: true,
    }
    onSave({ ...customer, operators: [...customer.operators, op] })
    setInviteOpen(false)
    setInviteEmail('')
    toast.success('Invitation sent', { description: inviteEmail })
  }

  const handleDelete = () => {
    if (deleteTarget === null) return
    onSave({ ...customer, operators: customer.operators.filter((_, i) => i !== deleteTarget) })
    setDeleteTarget(null)
    toast.success('Operator removed')
  }

  const handleEditRole = () => {
    if (editTarget === null) return
    onSave({
      ...customer,
      operators: customer.operators.map((o, i) => i === editTarget ? { ...o, role: editRole } : o),
    })
    setEditTarget(null)
    toast.success('Role updated')
  }

  const handleMfaReset = (i: number) => {
    toast.success('MFA reset sent', { description: customer.operators[i].email })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-content-primary">Operators</h3>
          <p className="text-xs text-content-tertiary mt-0.5">{customer.operators.length} operator{customer.operators.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setInviteOpen(true)}>
          <Plus size={13} /> Invite operator
        </Button>
      </div>

      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        {customer.operators.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-content-tertiary">No operators yet.</div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="bg-surface-3">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default w-20">MFA</th>
                <th className="px-4 py-3 border-b border-line-default w-10" />
              </tr>
            </thead>
            <tbody>
              {customer.operators.map((op, i) => (
                <tr key={i} className="border-b border-line-subtle last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-content-primary font-medium">
                        {op.name || <span className="text-content-disabled italic">Pending</span>}
                      </span>
                      {op.pending && <Badge tone="warning">Invited</Badge>}
                      {op.locked && <Badge tone="error">Locked</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={op.role === 'Admin' ? 'info' : 'neutral'}>{op.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-content-secondary font-mono text-xs">{maskEmail(op.email)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={op.pending ? 'neutral' : 'success'}>{op.pending ? '—' : 'Active'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center size-7 rounded-lg text-content-tertiary hover:bg-surface-hover hover:text-content-primary transition-colors cursor-pointer">
                        <MoreHorizontal size={14} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditTarget(i); setEditRole(op.role) }}>
                          <Shield size={13} /> Edit role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMfaReset(i)}>
                          <RefreshCw size={13} /> Reset MFA
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-error focus:text-error" onClick={() => setDeleteTarget(i)}>
                          <UserX size={13} /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite operator"
        description="Send an invitation to a new operator for this customer."
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={!inviteEmail.trim()} onClick={handleInvite}>Send invitation</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 py-2">
          <Field label="Email address" required>
            <Input type="email" placeholder="operator@company.com" value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)} />
          </Field>
          <Field label="Role">
            <Select value={inviteRole} onValueChange={(v) => { if (v) setInviteRole(v) }}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Modal>

      {/* Edit role modal */}
      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit role"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditRole}>Save</Button>
          </div>
        }
      >
        <div className="py-2">
          <Select value={editRole} onValueChange={(v) => { if (v) setEditRole(v) }}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Remove operator"
        description={`Remove ${deleteTarget !== null ? (customer.operators[deleteTarget]?.name || customer.operators[deleteTarget]?.email) : ''} from this customer?`}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove</Button>
          </div>
        }
      />
    </div>
  )
}
