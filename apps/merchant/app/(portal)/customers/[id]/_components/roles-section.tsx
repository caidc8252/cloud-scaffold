'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Shield, Star, Eye, Check, X, ChevronRight } from 'lucide-react'
import {
  Button, Badge, Modal, Input, Field, Textarea,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  ToggleCheckbox,
} from '@cloud/ui'
import { type Customer, type ContractKind } from '@/lib/data/customers'
import {
  ALL_CONTRACT_KINDS, PERMISSION_GROUPS, SEED_ROLES, type Role,
} from '@/lib/data/roles'

interface RolesSectionProps {
  customer: Customer
  onSave: (c: Customer) => void
}

function computeRoleAllowed(role: Pick<Role, 'contractMode' | 'contractsAllowed'>): ContractKind[] {
  const sel = role.contractsAllowed ?? []
  if (role.contractMode === 'allow') return sel
  return ALL_CONTRACT_KINDS.filter((k) => !sel.includes(k))
}

export function RolesSection({ customer, onSave }: RolesSectionProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [confirmDel, setConfirmDel] = useState<Role | null>(null)
  const [blockConfirm, setBlockConfirm] = useState<{ rid: string; name: string } | null>(null)
  const [permsPreview, setPermsPreview] = useState<(Role & { _scope?: ContractKind[] }) | null>(null)

  const denied = new Set(customer.deniedRoles ?? [])
  const customRoles = customer.customRoles ?? []

  const activeKinds = customer.contracts
    .filter((c) => c.status === 'Active' || c.status === 'Signed' || c.status === 'Pending')
    .map((c) => c.kind)
  const activeSet = new Set(activeKinds)

  const visibleSystem = SEED_ROLES.map((r) => {
    const allowed = computeRoleAllowed(r)
    const scope = allowed.filter((k) => activeSet.has(k))
    return { ...r, _scope: scope }
  }).filter((r) => r._scope.length > 0)

  const pushEvent = (text: string) => ({
    at: new Date().toISOString(),
    kind: 'role',
    by: 'admin@carbon',
    text,
  })

  const toggleDeny = (rid: string, name: string) => {
    const wasDenied = denied.has(rid)
    const next = new Set(denied)
    if (wasDenied) next.delete(rid)
    else next.add(rid)
    onSave({
      ...customer,
      deniedRoles: [...next],
      events: [
        ...customer.events,
        pushEvent(`${wasDenied ? 'Unblocked' : 'Blocked'} system role "${name}" for this customer`),
      ],
    })
    toast.success(wasDenied ? `"${name}" re-enabled` : `"${name}" blocked for this customer`)
  }

  const saveCustomRole = (role: Role) => {
    const exists = customRoles.find((r) => r.id === role.id)
    const next = exists
      ? customRoles.map((r) => (r.id === role.id ? role : r))
      : [...customRoles, role]
    onSave({
      ...customer,
      customRoles: next,
      events: [
        ...customer.events,
        pushEvent(`${exists ? 'Updated' : 'Added'} custom role "${role.name}"`),
      ],
    })
    toast.success(`Custom role "${role.name}" saved`)
    setEditing(null)
    setShowAdd(false)
  }

  const deleteCustomRole = (role: Role) => {
    onSave({
      ...customer,
      customRoles: customRoles.filter((r) => r.id !== role.id),
      events: [
        ...customer.events,
        pushEvent(`Removed custom role "${role.name}"`),
      ],
    })
    toast.success(`Custom role "${role.name}" removed`)
    setConfirmDel(null)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* System roles */}
      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-line-subtle">
          <div>
            <div className="text-sm font-semibold text-content-primary">
              System roles ({visibleSystem.length})
            </div>
            <div className="text-xs text-content-tertiary mt-0.5 leading-relaxed">
              All system-defined roles whose contract scope overlaps this customer's contracts. Blacklist any role to prevent it from being assigned to operators here.
            </div>
          </div>
          <div className="text-xs text-content-tertiary tabular-nums shrink-0">
            {denied.size > 0 && <span className="text-error font-semibold">{denied.size} blocked</span>}
            {denied.size > 0 && ' · '}
            {visibleSystem.length - denied.size} available
          </div>
        </div>

        {activeKinds.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-content-tertiary">
            No active contracts yet. Roles will appear here once a contract is signed.
          </div>
        )}

        {activeKinds.length > 0 && visibleSystem.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-content-tertiary">
            No system roles match this customer's contract types.
          </div>
        )}

        <div>
          {visibleSystem.map((r) => {
            const isDenied = denied.has(r.id)
            return (
              <div
                key={r.id}
                className={`flex items-start gap-3 px-5 py-3.5 border-b border-line-subtle last:border-0 ${
                  isDenied ? 'opacity-70' : ''
                }`}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-content-secondary">
                  <Shield size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-content-primary">{r.name}</span>
                    {isDenied && <Badge tone="error">Blocked</Badge>}
                  </div>
                  <div className="text-xs text-content-tertiary mt-0.5">{r.description}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                      onClick={() => setPermsPreview(r)}
                    >
                      {r.permissions.length} permissions
                      <Eye size={11} />
                    </button>
                    <span className="text-content-tertiary text-xs">·</span>
                    <span className="text-xs text-content-tertiary">Scope:</span>
                    {r._scope.map((k) => (
                      <Badge key={k} tone="info">{k}</Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant={isDenied ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() =>
                    isDenied ? toggleDeny(r.id, r.name) : setBlockConfirm({ rid: r.id, name: r.name })
                  }
                >
                  {isDenied ? <><Check size={13} /> Unblock</> : <><X size={13} /> Block</>}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom roles */}
      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-line-subtle">
          <div>
            <div className="text-sm font-semibold text-content-primary">
              Custom roles ({customRoles.length})
            </div>
            <div className="text-xs text-content-tertiary mt-0.5 leading-relaxed">
              Customer-specific roles. Only visible to operators of <strong>{customer.name}</strong>.
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setEditing(null); setShowAdd(true) }}>
            <Plus size={13} /> Add custom role
          </Button>
        </div>
        <div>
          {customRoles.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-content-tertiary">
              No custom roles. Add one to extend permissions beyond the system roles.
            </div>
          ) : (
            customRoles.map((r) => (
              <div key={r.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-line-subtle last:border-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Star size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-content-primary">{r.name}</span>
                    <Badge tone="info">Custom</Badge>
                  </div>
                  <div className="text-xs text-content-tertiary mt-0.5">{r.description || 'No description'}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                      onClick={() => setPermsPreview(r)}
                    >
                      {r.permissions.length} permissions
                      <Eye size={11} />
                    </button>
                    {(r.contractsAllowed ?? []).filter((k) => activeSet.has(k)).length > 0 && (
                      <>
                        <span className="text-content-tertiary text-xs">·</span>
                        <span className="text-xs text-content-tertiary">Scope:</span>
                        {r.contractsAllowed
                          .filter((k) => activeSet.has(k))
                          .map((k) => (
                            <Badge key={k} tone="info">{k}</Badge>
                          ))}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setShowAdd(true) }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDel(r)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CustomRoleModal
        open={showAdd}
        role={editing}
        activeKinds={activeKinds}
        customerName={customer.name}
        customRoles={customRoles}
        onClose={() => { setShowAdd(false); setEditing(null) }}
        onSave={saveCustomRole}
      />

      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Remove custom role?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDel(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => confirmDel && deleteCustomRole(confirmDel)}>
              Remove role
            </Button>
          </>
        }
      >
        <p className="text-sm text-content-primary">
          <strong>{confirmDel?.name}</strong> will be removed from this customer. Operators using it will fall back to <strong>Viewer</strong>.
        </p>
      </Modal>

      <Modal
        open={!!blockConfirm}
        onClose={() => setBlockConfirm(null)}
        title="Block this role?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setBlockConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (blockConfirm) toggleDeny(blockConfirm.rid, blockConfirm.name)
                setBlockConfirm(null)
              }}
            >
              Block role
            </Button>
          </>
        }
      >
        <p className="text-sm text-content-primary leading-relaxed">
          Blocking <strong>{blockConfirm?.name}</strong> means it can no longer be assigned to any operator at <strong>{customer.name}</strong>. Operators currently holding this role will lose access immediately.
        </p>
        <div className="mt-3 rounded-lg border border-line-subtle bg-surface-3 px-3 py-2 text-xs text-content-secondary">
          You can unblock the role at any time — no data is deleted.
        </div>
      </Modal>

      <PermissionsPreviewModal
        role={permsPreview}
        activeKinds={activeKinds}
        onClose={() => setPermsPreview(null)}
      />
    </div>
  )
}

// ─── Permissions preview modal ────────────────────────────

interface PermissionsPreviewModalProps {
  role: (Role & { _scope?: ContractKind[] }) | null
  activeKinds: ContractKind[]
  onClose: () => void
}

function PermissionsPreviewModal({ role, activeKinds, onClose }: PermissionsPreviewModalProps) {
  if (!role) {
    return (
      <Modal
        open={false}
        onClose={onClose}
        footer={<Button variant="ghost" size="sm" onClick={onClose}>Close</Button>}
      />
    )
  }
  const ownedIds = new Set(role.permissions ?? [])
  const ownedScope =
    role._scope && role._scope.length
      ? role._scope
      : (role.contractsAllowed ?? []).filter((k) => activeKinds.includes(k))
  const grouped = PERMISSION_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => ownedIds.has(it.id)),
  })).filter((g) => g.items.length > 0)

  return (
    <Modal
      open={!!role}
      onClose={onClose}
      title={`${role.name} — permissions`}
      footer={<Button variant="ghost" size="sm" onClick={onClose}>Close</Button>}
    >
      <div className="flex flex-col gap-3">
        <div className="text-xs text-content-secondary leading-relaxed">
          {role.description || 'System-defined role.'}
        </div>
        {ownedScope.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-content-tertiary">Effective on this customer:</span>
            {ownedScope.map((k) => <Badge key={k} tone="info">{k}</Badge>)}
          </div>
        )}
        {grouped.length === 0 ? (
          <div className="text-sm text-content-tertiary py-6 text-center">No permissions granted.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {grouped.map((g) => (
              <div key={g.id} className="rounded-lg border border-line-subtle bg-surface-3">
                <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-content-primary">
                  <span>{g.label}</span>
                  <span className="text-content-tertiary tabular-nums">{g.items.length}</span>
                </div>
                <ul className="flex flex-col">
                  {g.items.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-start gap-2 px-3 py-2 border-t border-line-subtle text-xs"
                    >
                      <div className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground mt-0.5">
                        <Check size={10} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-content-primary">{it.label}</span>
                          <code className="text-xs text-content-tertiary font-mono">{it.id}</code>
                        </div>
                        <div className="text-xs text-content-tertiary mt-0.5">{it.desc}</div>
                        {it.contracts && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {it.contracts.map((k) => (
                              <Badge key={k} tone={ownedScope.includes(k) ? 'info' : 'neutral'}>{k}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Custom role create/edit modal ────────────────────────

interface CustomRoleModalProps {
  open: boolean
  role: Role | null
  activeKinds: ContractKind[]
  customerName: string
  customRoles: Role[]
  onClose: () => void
  onSave: (role: Role) => void
}

function makeBlankRole(activeKinds: ContractKind[]): Role {
  return {
    id: 'cr-' + Math.random().toString(36).slice(2, 7),
    name: '',
    description: '',
    builtin: false,
    operatorCount: 0,
    contractMode: 'allow',
    contractsAllowed: [...activeKinds],
    permissions: [],
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@carbon',
  }
}

function CustomRoleModal({ open, role, activeKinds, customerName, customRoles, onClose, onSave }: CustomRoleModalProps) {
  const [draft, setDraft] = useState<Role>(role ?? makeBlankRole(activeKinds))
  const [copyFromId, setCopyFromId] = useState<string>('')
  const [openedGroups, setOpenedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (open) {
      setDraft(role ?? makeBlankRole(activeKinds))
      setCopyFromId('')
      setOpenedGroups({})
    }
  }, [open, role, activeKinds])

  const copyFrom = (srcId: string) => {
    setCopyFromId(srcId)
    if (!srcId) return
    const src = [...SEED_ROLES, ...customRoles].find((r) => r.id === srcId)
    if (!src) return
    const srcAllowed = (src.contractsAllowed ?? []).filter((k) => activeKinds.includes(k))
    const allowedNow =
      src.contractMode === 'deny'
        ? activeKinds.filter((k) => !srcAllowed.includes(k))
        : srcAllowed
    const flatItems = PERMISSION_GROUPS.flatMap((g) => g.items)
    const validPerms = src.permissions.filter((pid) => {
      const item = flatItems.find((i) => i.id === pid)
      if (!item) return false
      if (!item.contracts) return true
      return item.contracts.some((c) => allowedNow.includes(c))
    })
    setDraft((d) => ({
      ...d,
      description: d.description || src.description || '',
      contractsAllowed: srcAllowed.length ? srcAllowed : [...activeKinds],
      contractMode: 'allow',
      permissions: validPerms,
    }))
  }

  const togglePerm = (id: string) => {
    setDraft((d) => ({
      ...d,
      permissions: d.permissions.includes(id) ? d.permissions.filter((p) => p !== id) : [...d.permissions, id],
    }))
  }

  const toggleContract = (k: ContractKind) => {
    setDraft((d) => ({
      ...d,
      contractsAllowed: d.contractsAllowed.includes(k)
        ? d.contractsAllowed.filter((x) => x !== k)
        : [...d.contractsAllowed, k],
    }))
  }

  const scope = useMemo(
    () => (draft.contractsAllowed ?? []).filter((k) => activeKinds.includes(k)),
    [draft.contractsAllowed, activeKinds],
  )

  const groups = useMemo(
    () =>
      PERMISSION_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((it) => !it.contracts || it.contracts.some((c) => scope.includes(c))),
      })).filter((g) => g.items.length > 0),
    [scope],
  )

  const valid = draft.name.trim().length > 0 && scope.length > 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={role ? 'Edit custom role' : `Add custom role for ${customerName}`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" disabled={!valid} onClick={() => onSave(draft)}>
            Save role
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!role && (
          <Field label="Copy from" hint="Optional — seed permissions and scope from an existing role.">
            <Select value={copyFromId} onValueChange={(v) => copyFrom(v ?? '')}>
              <SelectTrigger className="w-full"><SelectValue placeholder="— Start blank —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Start blank —</SelectItem>
                {SEED_ROLES.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name} · {r.permissions.length} perms</SelectItem>
                ))}
                {customRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name} · {r.permissions.length} perms (custom)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field label="Role name" required>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. Onboarding Specialist"
          />
        </Field>
        <Field label="Description">
          <Textarea
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="What this role is for…"
          />
        </Field>

        <Field label="Contract scope" hint="Only contracts this customer holds are shown.">
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeKinds.length === 0 && (
              <span className="text-xs text-content-tertiary">No active contracts yet.</span>
            )}
            {activeKinds.map((k) => {
              const on = draft.contractsAllowed.includes(k)
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleContract(k)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    on
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-line-default bg-surface-2 text-content-secondary hover:bg-surface-hover'
                  }`}
                >
                  {on && <Check size={11} />}
                  {k}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label={`Permissions (${draft.permissions.length} selected)`}>
          <div className="flex flex-col gap-2">
            {groups.length === 0 && (
              <div className="text-xs text-content-tertiary py-3">
                Select a contract scope above to choose permissions.
              </div>
            )}
            {groups.map((g) => {
              const open = openedGroups[g.id] ?? true
              const checked = g.items.filter((i) => draft.permissions.includes(i.id)).length
              return (
                <div key={g.id} className="rounded-lg border border-line-default bg-surface-2 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenedGroups((s) => ({ ...s, [g.id]: !open }))}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-content-primary hover:bg-surface-hover cursor-pointer"
                  >
                    <ChevronRight
                      size={12}
                      className={`transition-transform ${open ? 'rotate-90' : ''}`}
                    />
                    <span className="flex-1">{g.label}</span>
                    <span className="text-xs text-content-tertiary tabular-nums">
                      {checked}/{g.items.length}
                    </span>
                  </button>
                  {open && (
                    <div className="flex flex-col divide-y divide-line-subtle border-t border-line-subtle">
                      {g.items.map((it) => {
                        const on = draft.permissions.includes(it.id)
                        return (
                          <label
                            key={it.id}
                            className={`flex items-start gap-2.5 px-3 py-2.5 text-sm cursor-pointer ${
                              on ? 'bg-primary/5' : 'hover:bg-surface-hover'
                            }`}
                          >
                            <ToggleCheckbox checked={on} onCheckedChange={() => togglePerm(it.id)} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-content-primary">{it.label}</div>
                              <div className="text-xs text-content-tertiary mt-0.5">{it.desc}</div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Field>
      </div>
    </Modal>
  )
}
