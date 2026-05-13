/* global React, Icon, Btn, Badge, Input, Field, Textarea, Select, ContractBadge, CONTRACT_INFO,
   Modal, useToast, CompanyLogo, fmtDate, fmtDateTime, relTime,
   PERMISSION_GROUPS, ALL_PERMISSION_IDS, ALL_CONTRACT_KINDS, SEED_ROLES */
const { useState, useMemo, useEffect: useEff } = React;

// =====================================================================
// Settings shell — Roles & Permissions only.
// (Contract Templates removed: contracts are now back-office configured
// per-customer, no customer-side signing flow.)
// =====================================================================
const Settings = () => {
  const [roles, setRoles] = useState(SEED_ROLES);

  return (
    <div className="page" data-screen-label="Settings">
      <div className="page__head">
        <div>
          <h1 className="page__title">Roles & Permissions</h1>
          <p className="page__sub">Operator roles and the permissions they grant inside each customer tenant.</p>
        </div>
      </div>

      <div className="stack" style={{ gap: 14 }}>
        <div className="notice">
          <Icon name="shield" size={14}/>
          <div>
            <strong>Admin is implicit.</strong> The first operator registered for each customer is automatically
            assigned the Admin role with full permissions on all contract types. Admin is not configurable here —
            roles below are assigned to additional operators.
          </div>
        </div>
        <RolesPanel roles={roles} setRoles={setRoles}/>
      </div>
    </div>
  );
};

// =====================================================================
// Roles & Permissions
// =====================================================================
const RolesPanel = ({ roles, setRoles }) => {
  const [selectedId, setSelectedId] = useState(roles[0]?.id);
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const toast = useToast();

  const filtered = useMemo(
    () => roles.filter(r => r.name.toLowerCase().includes(query.toLowerCase())),
    [roles, query]
  );
  const selected = roles.find(r => r.id === selectedId) || filtered[0];

  const update = (next) => {
    setRoles(rs => rs.map(r => r.id === next.id ? { ...next, updatedAt: new Date().toISOString(), updatedBy: 'admin@carbon' } : r));
  };

  const createRole = (draft) => {
    const id = 'r-' + Math.random().toString(36).slice(2, 7);
    const r = {
      id, ...draft, builtin: false, operatorCount: 0,
      updatedAt: new Date().toISOString(), updatedBy: 'admin@carbon',
    };
    setRoles(rs => [...rs, r]);
    setSelectedId(id);
    setShowNew(false);
    toast({ kind: 'success', title: 'Role created', msg: `"${draft.name}" is ready to assign.` });
  };

  const deleteRole = (id) => {
    setRoles(rs => rs.filter(r => r.id !== id));
    setSelectedId(roles.find(r => r.id !== id)?.id);
    toast({ kind: 'success', title: 'Role deleted' });
  };

  const duplicate = (r) => {
    const id = 'r-' + Math.random().toString(36).slice(2, 7);
    const copy = { ...r, id, name: r.name + ' (copy)', builtin: false, operatorCount: 0, updatedAt: new Date().toISOString(), updatedBy: 'admin@carbon' };
    setRoles(rs => [...rs, copy]);
    setSelectedId(id);
    toast({ kind: 'success', title: 'Duplicated', msg: 'Edit the copy without affecting the original.' });
  };

  return (
    <div className="roles-grid">
      <aside className="roles-list">
        <div className="roles-list__head">
          <Input
            size="sm"
            placeholder="Search roles…"
            prefix={<Icon name="search" size={13}/>}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Btn variant="primary" size="sm" icon="plus" onClick={() => setShowNew(true)}>New role</Btn>
        </div>
        <div className="roles-list__hint">
          <Icon name="info" size={12}/>
          <span>System-defined roles. Visible to every customer, filtered by the contracts they hold.</span>
        </div>
        <div className="roles-list__items">
          {filtered.map(r => (
            <RoleListItem
              key={r.id}
              role={r}
              active={selected?.id === r.id}
              onClick={() => setSelectedId(r.id)}
            />
          ))}
          {filtered.length === 0 && <div className="empty" style={{ padding: '32px 16px' }}>No roles match "{query}"</div>}
        </div>
      </aside>

      {selected ? (
        <RoleEditor
          key={selected.id}
          role={selected}
          onSave={update}
          onDuplicate={() => duplicate(selected)}
          onDelete={() => deleteRole(selected.id)}
        />
      ) : (
        <div className="info-card" style={{ display: 'grid', placeItems: 'center', minHeight: 320 }}>
          <div className="empty">Select a role to edit.</div>
        </div>
      )}

      <NewRoleModal open={showNew} onClose={() => setShowNew(false)} onCreate={createRole}/>
    </div>
  );
};

// Effective allowed contracts based on mode:
//   allow → only items in contractsAllowed are allowed
//   deny  → items in contractsAllowed are blocked; the rest are allowed
const computeAllowed = (role) => {
  const sel = role.contractsAllowed || [];
  const mode = role.contractMode || 'allow';
  if (mode === 'allow') return sel;
  return ALL_CONTRACT_KINDS.filter(k => !sel.includes(k));
};
const effectiveAllowed = computeAllowed;

// Permission lookup
const PERMS_BY_ID = {};
PERMISSION_GROUPS.forEach(g => g.items.forEach(item => { PERMS_BY_ID[item.id] = item; }));
const findPermItem = (id) => PERMS_BY_ID[id];

// A permission "applies" to a role iff it is global (no .contracts), or its
// contracts intersect the role's effective allowed contracts.
const permAppliesTo = (item, allowed) => {
  if (!item.contracts) return true;
  return item.contracts.some(c => allowed.includes(c));
};

const RoleListItem = ({ role, active, onClick }) => {
  const allowed = effectiveAllowed(role);
  return (
    <button className={`role-item ${active ? 'is-on' : ''}`} onClick={onClick}>
      <div className="role-item__icon"><Icon name="shield" size={14}/></div>
      <div className="role-item__main">
        <div className="role-item__name">
          {role.name}
        </div>
        <div className="role-item__meta">
          <span>{role.permissions.length} permissions</span>
          <span className="dot">·</span>
          <span>{allowed.length}/{ALL_CONTRACT_KINDS.length} contracts</span>
          <span className="role-item__mode" data-mode={role.contractMode || 'allow'}>
            {(role.contractMode || 'allow') === 'allow' ? 'allow' : 'deny'}
          </span>
        </div>
      </div>
    </button>
  );
};

// ─── Permissions card (scalable to hundreds) ─────────────
const PermissionsCard = ({ draft, togglePerm, toggleGroup }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'granted' | 'available'
  const [contractFilter, setContractFilter] = useState('any'); // 'any' | 'global' | <ContractKind>
  const [expanded, setExpanded] = useState(() => new Set()); // collapsed by default

  const allowedNow = effectiveAllowed(draft);
  const grantedSet = useMemo(() => new Set(draft.permissions), [draft.permissions]);

  // Stage 1: scope filter (always applied) + structure preserved
  const scoped = useMemo(() => PERMISSION_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(it => permAppliesTo(it, allowedNow)),
  })).filter(g => g.items.length > 0), [allowedNow]);

  const totalScoped = scoped.reduce((n, g) => n + g.items.length, 0);
  const grantedInScope = scoped.reduce((n, g) => n + g.items.filter(it => grantedSet.has(it.id)).length, 0);
  const hiddenCount = ALL_PERMISSION_IDS.length - totalScoped;

  // Stage 2: user filters (search, granted/available, contract chip)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.map(g => {
      const items = g.items.filter(it => {
        if (filter === 'granted' && !grantedSet.has(it.id)) return false;
        if (filter === 'available' && grantedSet.has(it.id)) return false;
        if (contractFilter === 'global') { if (it.contracts) return false; }
        else if (contractFilter !== 'any') {
          if (!it.contracts || !it.contracts.includes(contractFilter)) return false;
        }
        if (q) {
          const hay = `${it.label} ${it.id} ${it.desc}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      return { ...g, items };
    }).filter(g => g.items.length > 0);
  }, [scoped, query, filter, contractFilter, grantedSet]);

  const filteredTotal = filtered.reduce((n, g) => n + g.items.length, 0);
  const isFiltering = query || filter !== 'all' || contractFilter !== 'any';

  // Auto-expand groups when actively filtering so matches are visible
  const effExpanded = isFiltering ? new Set(filtered.map(g => g.id)) : expanded;

  const toggleExpand = (id) => {
    setExpanded(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const expandAll = () => setExpanded(new Set(scoped.map(g => g.id)));
  const collapseAll = () => setExpanded(new Set());
  const allExpanded = scoped.length > 0 && scoped.every(g => effExpanded.has(g.id));

  return (
    <section className="info-card perms-card">
      <div className="info-card__head perms-card__head">
        <div>
          <div className="info-card__title">Permissions</div>
          <div className="perms-card__sub muted">
            <span className="num"><strong>{grantedInScope}</strong> granted</span>
            <span className="dot">·</span>
            <span className="num">{totalScoped} in scope</span>
            {hiddenCount > 0 && (
              <>
                <span className="dot">·</span>
                <span className="num" style={{ color: 'var(--color-warning-700)' }}>{hiddenCount} hidden</span>
              </>
            )}
          </div>
        </div>
        <button className="perm-group__toggle" onClick={allExpanded ? collapseAll : expandAll} disabled={isFiltering}>
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div className="perms-toolbar">
        <div className="perms-toolbar__row">
          <Input
            size="sm"
            placeholder="Search permissions by name, id, or description…"
            prefix={<Icon name="search" size={13}/>}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="perm-seg">
            {[
              { v: 'all', label: 'All', n: totalScoped },
              { v: 'granted', label: 'Granted', n: grantedInScope },
              { v: 'available', label: 'Available', n: totalScoped - grantedInScope },
            ].map(opt => (
              <button key={opt.v} className={`perm-seg__btn ${filter === opt.v ? 'is-on' : ''}`} onClick={() => setFilter(opt.v)}>
                {opt.label}
                <span className="perm-seg__count">{opt.n}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="perms-toolbar__chips">
          <span className="perms-toolbar__chiplabel">Scope:</span>
          <button className={`perm-fchip ${contractFilter === 'any' ? 'is-on' : ''}`} onClick={() => setContractFilter('any')}>Any</button>
          <button className={`perm-fchip ${contractFilter === 'global' ? 'is-on' : ''}`} onClick={() => setContractFilter('global')}>Global</button>
          {ALL_CONTRACT_KINDS.filter(k => allowedNow.includes(k)).map(k => (
            <button
              key={k}
              className={`perm-fchip perm-fchip--${k.toLowerCase()} ${contractFilter === k ? 'is-on' : ''}`}
              onClick={() => setContractFilter(k)}
            >{k}</button>
          ))}
          {isFiltering && (
            <button className="perm-fchip perm-fchip--clear" onClick={() => { setQuery(''); setFilter('all'); setContractFilter('any'); }}>
              <Icon name="x" size={11}/> Clear
            </button>
          )}
        </div>
      </div>

      {hiddenCount > 0 && !isFiltering && (
        <div className="perm-locked-banner">
          <Icon name="shield" size={13}/>
          <span>
            <strong>{hiddenCount} permission{hiddenCount === 1 ? '' : 's'}</strong> hidden — they require contract types
            not in this role's scope. Enable a contract above to unlock them.
          </span>
        </div>
      )}

      <div className="perms-card__body">
        {filtered.length === 0 && (
          <div className="empty" style={{ padding: '48px 20px' }}>
            {isFiltering ? `No permissions match these filters.` : `No permissions available — this role has no allowed contracts.`}
          </div>
        )}
        {filtered.map(g => {
          const open = effExpanded.has(g.id);
          const ids = g.items.map(i => i.id);
          const granted = ids.filter(id => grantedSet.has(id)).length;
          const all = granted === ids.length;
          const scopedTotal = scoped.find(s => s.id === g.id)?.items.length ?? ids.length;
          return (
            <div key={g.id} className={`perm-group ${open ? 'is-open' : ''}`}>
              <button className="perm-group__head perm-group__head--btn" onClick={() => toggleExpand(g.id)} disabled={isFiltering}>
                <div className="perm-group__chev"><Icon name={open ? 'chevD' : 'chevR'} size={13}/></div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div className="perm-group__name">{g.label}</div>
                  <div className="perm-group__meta">
                    <span className="num">{granted}/{ids.length}</span> granted
                    {ids.length < scopedTotal && <span className="muted"> &nbsp;·&nbsp; filtered from {scopedTotal}</span>}
                  </div>
                </div>
                <span className="perm-group__bar" aria-hidden>
                  <span className="perm-group__bar-fill" style={{ width: ids.length ? `${(granted/ids.length)*100}%` : '0' }}/>
                </span>
                <span className="perm-group__toggle" onClick={(e) => { e.stopPropagation(); toggleGroup(g, !all); }}>
                  {all ? 'Revoke all' : 'Grant all'}
                </span>
              </button>
              {open && (
                <div className="perm-group__items">
                  {g.items.map(item => {
                    const on = grantedSet.has(item.id);
                    const applicable = item.contracts ? item.contracts.filter(c => allowedNow.includes(c)) : null;
                    return (
                      <label key={item.id} className={`perm-row perm-row--compact ${on ? 'is-on' : ''}`}>
                        <Toggle checked={on} onChange={() => togglePerm(item.id)}/>
                        <div className="perm-row__main">
                          <div className="perm-row__name">
                            <span>{item.label}</span>
                            <code className="perm-row__id">{item.id}</code>
                            {applicable && applicable.length > 0 && (
                              <span className="perm-row__chips">
                                {applicable.map(c => (
                                  <span key={c} className={`perm-chip perm-chip--${c.toLowerCase()}`}>{c}</span>
                                ))}
                              </span>
                            )}
                            {!item.contracts && (
                              <span className="perm-row__chips">
                                <span className="perm-chip perm-chip--global" title="Not tied to any contract type">Global</span>
                              </span>
                            )}
                          </div>
                          <div className="perm-row__desc">{item.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ─── Role editor (right pane) ────────────────────────────
const RoleEditor = ({ role, onSave, onDuplicate, onDelete }) => {
  const [draft, setDraft] = useState(role);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(role);
  const toast = useToast();

  useEff(() => setDraft(role), [role.id]);

  const togglePerm = (id) => {
    setDraft(d => ({ ...d, permissions: d.permissions.includes(id) ? d.permissions.filter(p => p !== id) : [...d.permissions, id] }));
  };
  const toggleGroup = (group, on) => {
    setDraft(d => {
      const ids = group.items.map(i => i.id);
      const rest = d.permissions.filter(p => !ids.includes(p));
      return { ...d, permissions: on ? [...rest, ...ids] : rest };
    });
  };
  const toggleContract = (kind) => {
    setDraft(d => {
      const nextSelected = d.contractsAllowed.includes(kind) ? d.contractsAllowed.filter(k => k !== kind) : [...d.contractsAllowed, kind];
      const nextAllowed = computeAllowed({ ...d, contractsAllowed: nextSelected });
      // Drop any permissions that are now orphaned (require a contract no longer allowed).
      const nextPerms = d.permissions.filter(pid => {
        const item = findPermItem(pid);
        if (!item || !item.contracts) return true; // global perm — unaffected
        return item.contracts.some(c => nextAllowed.includes(c));
      });
      return { ...d, contractsAllowed: nextSelected, permissions: nextPerms };
    });
  };

  const save = () => {
    onSave(draft);
    toast({ kind: 'success', title: 'Role saved', msg: `${draft.name} updated.` });
  };

  return (
    <section className="role-editor">
      <header className="role-editor__head">
        <div className="role-editor__title-wrap">
          <input
            className="role-editor__title-input"
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
          />
          <div className="role-editor__sub">
            <Icon name="users" size={12}/>
            <span>{role.operatorCount} operator{role.operatorCount === 1 ? '' : 's'} assigned</span>
            <span className="dot">·</span>
            <Icon name="clock" size={12}/>
            <span>Updated {relTime(role.updatedAt)} by {role.updatedBy}</span>
          </div>
        </div>
        <div className="role-editor__actions">
          <Btn variant="ghost" size="sm" icon="copy" onClick={onDuplicate}>Duplicate</Btn>
          <Btn variant="ghost" size="sm" icon="trash" onClick={() => setConfirmDelete(true)}>Delete</Btn>
          <Btn variant="primary" size="sm" icon="check" onClick={save} disabled={!dirty}>{dirty ? 'Save changes' : 'Saved'}</Btn>
        </div>
      </header>

      <div className="role-editor__body">
        {/* Description */}
        <section className="info-card">
          <div className="info-card__head">
            <div className="info-card__title">Description</div>
          </div>
          <div className="info-card__body">
            <Field hint="Shown when assigning this role to an operator.">
              <Textarea
                value={draft.description}
                onChange={e => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
          </div>
        </section>

        {/* Contract scope */}
        <section className="info-card">
          <div className="info-card__head">
            <div className="info-card__title">Contract scope</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {effectiveAllowed(draft).length}/{ALL_CONTRACT_KINDS.length} types effectively allowed
            </div>
          </div>
          <div className="info-card__body">
            <div className="scope-mode">
              <button
                type="button"
                className={`scope-mode__btn ${(draft.contractMode || 'allow') === 'allow' ? 'is-on' : ''}`}
                onClick={() => setDraft({ ...draft, contractMode: 'allow' })}>
                <Icon name="check" size={13}/>
                <div>
                  <div className="scope-mode__name">Allow list</div>
                  <div className="scope-mode__desc">Only the contracts you select are usable.</div>
                </div>
              </button>
              <button
                type="button"
                className={`scope-mode__btn ${(draft.contractMode || 'allow') === 'deny' ? 'is-on' : ''}`}
                onClick={() => setDraft({ ...draft, contractMode: 'deny' })}>
                <Icon name="x" size={13}/>
                <div>
                  <div className="scope-mode__name">Deny list</div>
                  <div className="scope-mode__desc">Selected contracts are blocked; everything else is allowed by default.</div>
                </div>
              </button>
            </div>

            <div className="scope-summary">
              {(() => {
                const sel = draft.contractsAllowed || [];
                const mode = draft.contractMode || 'allow';
                const allowed = effectiveAllowed(draft);
                if (mode === 'allow') {
                  return sel.length === 0
                    ? <><Icon name="info" size={12}/><span><strong>No contracts allowed.</strong> Operators with this role won't see any contracts.</span></>
                    : <><Icon name="check" size={12}/><span>Allowed: <strong>{allowed.join(', ')}</strong></span></>;
                }
                return sel.length === 0
                  ? <><Icon name="check" size={12}/><span><strong>All contracts allowed.</strong> Nothing is blocked.</span></>
                  : <><Icon name="x" size={12}/><span>Blocked: <strong>{sel.join(', ')}</strong> &nbsp;·&nbsp; Allowed: <strong>{allowed.join(', ') || 'none'}</strong></span></>;
              })()}
            </div>

            <div className="contract-grid">
              {ALL_CONTRACT_KINDS.map(kind => {
                const selected = draft.contractsAllowed.includes(kind);
                const mode = draft.contractMode || 'allow';
                const effective = (mode === 'allow' && selected) || (mode === 'deny' && !selected);
                const info = CONTRACT_INFO[kind];
                return (
                  <label key={kind} className={`contract-row ${selected ? 'is-on' : ''}`} data-mode={mode}>
                    <div className={`pick-card__icon pick-card__icon--${kind.toLowerCase()}`} style={{ width: 32, height: 32, borderRadius: 8 }}>
                      <Icon name="file" size={14}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="contract-row__name">{info.label}</div>
                      <div className="contract-row__desc">
                        {effective ? <span className="contract-row__eff contract-row__eff--allow">● allowed</span>
                                   : <span className="contract-row__eff contract-row__eff--deny">● blocked</span>}
                        <span style={{ opacity: 0.6, margin: '0 6px' }}>·</span>
                        {info.desc}
                      </div>
                    </div>
                    <Toggle checked={selected} onChange={() => toggleContract(kind)}/>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        {/* Permissions */}
        <PermissionsCard draft={draft} togglePerm={togglePerm} toggleGroup={toggleGroup}/>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete role?" width={420}
        footer={<>
          <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn>
          <Btn variant="danger" size="sm" icon="trash" onClick={() => { setConfirmDelete(false); onDelete(); }}>Delete role</Btn>
        </>}>
        <p style={{ margin: 0, fontSize: 13.5 }}>
          <strong>{role.name}</strong> will be removed. {role.operatorCount > 0 && <>The {role.operatorCount} operator(s) currently using it will fall back to <strong>Viewer</strong>.</>}
        </p>
      </Modal>
    </section>
  );
};

// ─── New role modal ──────────────────────────────────────
const NewRoleModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [base, setBase] = useState('r-viewer');

  useEff(() => { if (open) { setName(''); setDescription(''); setBase('r-viewer'); } }, [open]);

  const seed = SEED_ROLES.find(r => r.id === base) || SEED_ROLES[0];
  const ok = name.trim().length > 1;

  return (
    <Modal open={open} onClose={onClose} title="New role" width={460}
      footer={<>
        <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" size="sm" icon="plus" disabled={!ok} onClick={() => onCreate({
          name: name.trim(), description: description.trim() || 'Custom role.',
          contractMode: seed.contractMode || 'allow',
          contractsAllowed: [...seed.contractsAllowed],
          permissions: [...seed.permissions],
        })}>Create role</Btn>
      </>}>
      <div className="stack" style={{ gap: 14 }}>
        <Field label="Role name" required>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Underwriting Analyst"/>
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What can this role do?"/>
        </Field>
        <Field label="Start from" hint="Copy permissions & contract scope from an existing role. You can edit after.">
          <Select value={base} onChange={e => setBase(e.target.value)}>
            {SEED_ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  );
};

// ─── Toggle switch ───────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    className={`tg ${checked ? 'is-on' : ''} ${disabled ? 'is-disabled' : ''}`}
    onClick={(e) => { e.preventDefault(); if (!disabled) onChange(!checked); }}
    aria-pressed={checked}
  >
    <span className="tg__knob"/>
  </button>
);

window.Settings = Settings;
