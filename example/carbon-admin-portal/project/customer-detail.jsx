/* global React, Btn, Input, Field, Textarea, Icon, Badge, ContractBadge, Modal, CompanyLogo, CONTRACT_INFO, useToast, maskEmail, maskPhone, maskName, fmtDate, fmtDateTime, relTime, SEED_ROLES, ALL_CONTRACT_KINDS, PERMISSION_GROUPS, ALL_PERMISSION_IDS, ORDER_STATUSES, ORDER_STATUS_TONE, orderTotal, orderQty, deviceProgress, moneyUSD */
const { useState, useMemo } = React;

const STATUS_TONE_MAP = { Active: 'success', Onboarding: 'info', Suspended: 'error' };

// ─── Overview tab ────────────────────────────────────────
const TabOverview = ({ customer, onSave }) => {
  const signedCount = customer.contracts.filter(c => c.status === 'Active' || c.status === 'Signed').length;
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(customer);
  const toast = useToast();
  React.useEffect(() => { setForm(customer); }, [customer]);
  const handleSave = () => {
    onSave(form);
    setEdit(false);
    toast({ kind: 'success', title: 'Customer info updated' });
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
      <div className="stack" style={{ gap: 20 }}>
        <div className="info-card">
          <div className="info-card__head">
            <div className="info-card__title">Company</div>
            {!edit ? (
              <Btn variant="secondary" size="sm" icon="edit" onClick={() => setEdit(true)}>Edit</Btn>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn variant="ghost" size="sm" onClick={() => { setForm(customer); setEdit(false); }}>Cancel</Btn>
                <Btn variant="primary" size="sm" icon="check" disabled={!form.name.trim() || !form.address.trim()} onClick={handleSave}>Save changes</Btn>
              </div>
            )}
          </div>
          <div className="info-card__body">
            {!edit ? (
              <dl className="kvgrid">
                <dt>Name</dt>     <dd>{customer.name}</dd>
                <dt>Address</dt>  <dd style={{ whiteSpace: 'pre-line' }}>{customer.address}</dd>
                <dt>License</dt>  <dd>{customer.license || <span className="muted">Not provided</span>}</dd>
                <dt>Notes</dt>    <dd>{customer.notes || <span className="muted">—</span>}</dd>
                <dt>Registered</dt><dd>{fmtDateTime(customer.registeredAt)}</dd>
              </dl>
            ) : (
              <div className="stack" style={{ gap: 16 }}>
                <Field label="Company name" required>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
                </Field>
                <Field label="Address" required>
                  <Textarea rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}/>
                </Field>
                <div className="form-grid form-grid--2" style={{ gap: 16 }}>
                  <Field label="License">
                    <Input value={form.license} onChange={e => setForm({ ...form, license: e.target.value })}/>
                  </Field>
                  <Field label="Internal notes">
                    <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/>
                  </Field>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="info-card">
          <div className="info-card__head"><div className="info-card__title">Contracts</div></div>
          <div>
            {customer.contracts.length === 0 ? <div className="empty">No contracts yet.</div> :
              customer.contracts.map((c, i) => (
                <div key={i} className="crow">
                  <div className={`pick-card__icon pick-card__icon--${c.kind.toLowerCase()}`} style={{ width: 36, height: 36, borderRadius: 8 }}>
                    <Icon name={c.kind === 'ISV' ? 'file' : c.kind === 'ISO' ? 'shield' : c.kind === 'Acquirer' ? 'check' : 'link'} size={16}/>
                  </div>
                  <div className="crow__main">
                    <div className="crow__title">{c.kind} <ContractBadge kind={c.status} status={c.status}/></div>
                    <div className="crow__sub">{c.signedAt ? `Signed ${fmtDate(c.signedAt)} · by ${maskEmail(c.signedBy)}` : 'Awaiting customer admin signature'}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="stack" style={{ gap: 14 }}>
        <div className="stat" style={{ padding: '14px 16px' }}>
          <div className="stat__label">Signed contracts</div>
          <div className="stat__val">{signedCount}<span style={{ fontSize: 14, color: 'var(--color-text-tertiary)', fontWeight: 500 }}> / {customer.contracts.length}</span></div>
        </div>
        <div className="stat" style={{ padding: '14px 16px' }}>
          <div className="stat__label">Operators</div>
          <div className="stat__val">{customer.operators.length}</div>
          <div className="stat__delta">{customer.operators.filter(o => !o.pending).length} active</div>
        </div>
        <div className="stat" style={{ padding: '14px 16px' }}>
          <div className="stat__label">Last activity</div>
          <div className="stat__val" style={{ fontSize: 18 }}>{customer.events.length ? relTime(customer.events[customer.events.length - 1].at) : '—'}</div>
        </div>
      </div>
    </div>
  );
};

// ─── Information tab (Scene 3) ────────────────────────────
const TabInfo = ({ customer, onSave }) => {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(customer);
  const toast = useToast();

  React.useEffect(() => { setForm(customer); }, [customer]);

  const handleSave = () => {
    onSave(form);
    setEdit(false);
    toast({ kind: 'success', title: 'Customer info updated' });
  };

  return (
    <div className="info-card" style={{ maxWidth: 760 }}>
      <div className="info-card__head">
        <div className="info-card__title">Basic information</div>
        {!edit ? (
          <Btn variant="secondary" size="sm" icon="edit" onClick={() => setEdit(true)}>Edit</Btn>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="ghost" size="sm" onClick={() => { setForm(customer); setEdit(false); }}>Cancel</Btn>
            <Btn variant="primary" size="sm" icon="check" disabled={!form.name.trim() || !form.address.trim()} onClick={handleSave}>Save changes</Btn>
          </div>
        )}
      </div>
      <div className="info-card__body">
        {!edit ? (
          <dl className="kvgrid">
            <dt>Name</dt>     <dd>{customer.name}</dd>
            <dt>Address</dt>  <dd style={{ whiteSpace: 'pre-line' }}>{customer.address}</dd>
            <dt>License</dt>  <dd>{customer.license || <span className="muted">Not provided</span>}</dd>
            <dt>Notes</dt>    <dd>{customer.notes || <span className="muted">—</span>}</dd>
          </dl>
        ) : (
          <div className="stack" style={{ gap: 16 }}>
            <Field label="Company name" required>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
            </Field>
            <Field label="Address" required>
              <Textarea rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}/>
            </Field>
            <div className="form-grid form-grid--2" style={{ gap: 16 }}>
              <Field label="License">
                <Input value={form.license} onChange={e => setForm({ ...form, license: e.target.value })}/>
              </Field>
              <Field label="Internal notes">
                <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/>
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Contracts tab (Scene 4) ──────────────────────────────
const TabContracts = ({ customer, onAdd, onRemove }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [picked, setPicked] = useState([]);
  const toast = useToast();

  const existingKinds = customer.contracts.map(c => c.kind);
  const available = ['ISV', 'ISO', 'Acquirer', 'PayFac'].filter(k => !existingKinds.includes(k));

  return (
    <>
      <div className="info-card">
        <div className="info-card__head">
          <div className="info-card__title">Contracts ({customer.contracts.length})</div>
          <Btn variant="primary" size="sm" icon="plus" onClick={() => { setPicked([]); setAddOpen(true); }} disabled={available.length === 0}>Add contract</Btn>
        </div>
        <div>
          {customer.contracts.length === 0 ? <div className="empty">No contracts yet. Click "Add contract" to assign one.</div> :
            customer.contracts.map((c, i) => (
              <div key={i} className="crow">
                <div className={`pick-card__icon pick-card__icon--${c.kind.toLowerCase()}`} style={{ width: 40, height: 40, borderRadius: 10 }}>
                  <Icon name={c.kind === 'ISV' ? 'file' : c.kind === 'ISO' ? 'shield' : c.kind === 'Acquirer' ? 'check' : 'link'} size={18}/>
                </div>
                <div className="crow__main">
                  <div className="crow__title">{c.kind} <ContractBadge kind={c.status} status={c.status}/></div>
                  <div className="crow__sub">
                    {(c.status === 'Active' || c.status === 'Signed') && <>Active · configured {c.signedAt ? fmtDate(c.signedAt) : relTime(customer.registeredAt)} by {maskEmail(c.signedBy || 'admin@carbon')}</>}
                    {c.status === 'Pending'    && <>Pending activation · created {relTime(customer.registeredAt)}</>}
                    {c.status === 'Terminated' && <>Terminated · originally active from {c.signedAt && fmtDate(c.signedAt)}</>}
                  </div>
                </div>
                <div className="crow__actions">
                  {(c.status === 'Active' || c.status === 'Signed') && (
                    <Btn variant="ghost" size="sm" icon="file" onClick={() => setViewTarget(c)}>View details</Btn>
                  )}
                  <Btn variant="ghost" size="sm" icon="trash" onClick={() => setRemoveTarget(c)} style={(c.status === 'Active' || c.status === 'Signed') ? { color: 'var(--color-error-700)' } : undefined}>{(c.status === 'Active' || c.status === 'Signed') ? 'Terminate' : 'Remove'}</Btn>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add contract" width={560}
        footer={<>
          <Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn>
          <Btn variant="primary" icon="check" disabled={picked.length === 0} onClick={() => {
            onAdd(picked);
            setAddOpen(false);
            toast({ kind: 'success', title: `${picked.length} contract${picked.length === 1 ? '' : 's'} added`, msg: 'Active immediately.' });
          }}>Add {picked.length > 0 ? `(${picked.length})` : ''}</Btn>
        </>}>
        {available.length === 0 ? <div className="empty">All contract types are already assigned.</div> :
          <div className="stack" style={{ gap: 10 }}>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>Each added contract becomes <strong>active immediately</strong> — no customer-side signing required.</div>
            {available.map(k => {
              const on = picked.includes(k);
              const info = CONTRACT_INFO[k];
              return (
                <div key={k} className={`pick-card ${on ? 'is-on' : ''}`} onClick={() => setPicked(p => on ? p.filter(x => x !== k) : [...p, k])}>
                  <div className={`pick-card__icon pick-card__icon--${k.toLowerCase()}`}>
                    <Icon name={k === 'ISV' ? 'file' : k === 'ISO' ? 'shield' : k === 'Acquirer' ? 'check' : 'link'} size={18}/>
                  </div>
                  <div style={{ flex: 1, paddingRight: 28 }}>
                    <div className="pick-card__title">{k}</div>
                    <div className="pick-card__desc">{info.desc}</div>
                  </div>
                  <div className="pick-card__check">{on && <Icon name="check" size={11}/>}</div>
                </div>
              );
            })}
          </div>
        }
      </Modal>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Contract details" width={520}
        footer={<>
          <Btn variant="ghost" icon="download" onClick={() => toast({ kind: 'info', title: 'Signed PDF download started' })}>Download PDF</Btn>
          <Btn variant="primary" onClick={() => setViewTarget(null)}>Close</Btn>
        </>}>
        {viewTarget && (
          <div className="stack">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={`pick-card__icon pick-card__icon--${viewTarget.kind.toLowerCase()}`} style={{ width: 44, height: 44, borderRadius: 10 }}>
                <Icon name={viewTarget.kind === 'ISV' ? 'file' : viewTarget.kind === 'ISO' ? 'shield' : viewTarget.kind === 'Acquirer' ? 'check' : 'link'} size={20}/>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{viewTarget.kind} Contract</div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>{CONTRACT_INFO[viewTarget.kind]?.desc}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}><ContractBadge kind={viewTarget.status} status={viewTarget.status}/></div>
            </div>
            <dl className="kv" style={{ marginTop: 4 }}>
              <dt>Contract ID</dt><dd><code style={{ fontSize: 12.5 }}>CT-{viewTarget.kind.toUpperCase()}-{String(customer.id || '0000').padStart(4, '0')}</code></dd>
              <dt>Status</dt><dd><ContractBadge kind={viewTarget.status} status={viewTarget.status}/></dd>
              <dt>Signed at</dt><dd>{viewTarget.signedAt ? fmtDateTime(viewTarget.signedAt) : <span className="muted">—</span>}</dd>
              <dt>Signed by</dt><dd>{viewTarget.signedBy ? <><span>{maskEmail(viewTarget.signedBy)}</span> <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 6, fontSize: 12 }}>(Customer admin)</span></> : <span className="muted">—</span>}</dd>
              <dt>IP address</dt><dd><code style={{ fontSize: 12.5 }}>198.51.100.{(viewTarget.kind.charCodeAt(0) % 99) + 1}</code></dd>
              <dt>Effective from</dt><dd>{viewTarget.signedAt ? fmtDate(viewTarget.signedAt) : <span className="muted">—</span>}</dd>
              <dt>Term</dt><dd>12 months · auto-renew</dd>
            </dl>
          </div>
        )}
      </Modal>

      <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)} title={(removeTarget?.status === 'Active' || removeTarget?.status === 'Signed') ? 'Terminate contract' : 'Remove contract'} width={440}
        footer={<>
          <Btn variant="ghost" onClick={() => setRemoveTarget(null)}>Cancel</Btn>
          <Btn variant="danger" icon="trash" onClick={() => { onRemove(removeTarget); toast({ kind: 'warning', title: `${removeTarget.kind} contract ${(removeTarget.status === 'Active' || removeTarget.status === 'Signed') ? 'terminated' : 'removed'}` }); setRemoveTarget(null); }}>
            {(removeTarget?.status === 'Active' || removeTarget?.status === 'Signed') ? 'Terminate contract' : 'Remove contract'}
          </Btn>
        </>}>
        {removeTarget && (
          <div className="stack">
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
              {(removeTarget.status === 'Active' || removeTarget.status === 'Signed')
                ? <>You're about to terminate <strong>{removeTarget.kind}</strong>. The customer will lose access to features granted by this contract.</>
                : <>Remove the <strong>{removeTarget.kind}</strong> contract? It will be deleted from this customer.</>
              }
            </p>
            {(removeTarget.status === 'Active' || removeTarget.status === 'Signed') && (
              <Field label="Reason (audit log)">
                <Textarea rows={2} placeholder="e.g. customer requested transition to PayFac model" defaultValue=""/>
              </Field>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

// ─── Invite Operator modal (mirrors wizard Step 3) ────────
const InviteOperatorModal = ({ open, onClose, onInvite }) => {
  const toast = useToast();
  const [method, setMethod] = useState('link');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const inviteUrl = React.useMemo(() => `https://app.carbon.toms/invite/${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 6)}`, [open]);
  const expires = React.useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }, [open]);
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  React.useEffect(() => { if (open) { setMethod('link'); setEmail(''); setSent(false); setCopied(false); } }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Invite operator" width={560}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        {method === 'link'
          ? <Btn variant="primary" icon="check" onClick={() => { onInvite({ method: 'link' }); onClose(); }}>Done</Btn>
          : <Btn variant="primary" icon="mail" disabled={!validEmail} onClick={() => { setSent(true); onInvite({ method: 'email', email }); toast({ kind: 'success', title: 'Activation email sent', msg: `Sent to ${email}` }); setTimeout(onClose, 600); }}>Send invite</Btn>
        }
      </>}>
      <div className="seg" style={{ marginBottom: 18 }}>
        <button className={`seg__btn ${method === 'link' ? 'is-on' : ''}`} onClick={() => setMethod('link')}><Icon name="link" size={13}/> Share a link</button>
        <button className={`seg__btn ${method === 'email' ? 'is-on' : ''}`} onClick={() => setMethod('email')}><Icon name="mail" size={13}/> Email invite</button>
      </div>

      {method === 'link' ? (
        <div className="stack" style={{ gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>One-time invite link</div>
            <div className="link-box">
              <Icon name="link" size={14}/>
              <span className="link-box__url">{inviteUrl}</span>
              <Btn variant="secondary" size="sm" icon={copied ? 'check' : 'copy'} onClick={() => { navigator.clipboard?.writeText(inviteUrl); setCopied(true); toast({ kind: 'success', title: 'Link copied to clipboard' }); setTimeout(() => setCopied(false), 1800); }}>
                {copied ? 'Copied' : 'Copy'}
              </Btn>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 6 }}>Expires {expires} · single use.</div>
          </div>
          <div className="qr-block">
            <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden>
              <rect width="92" height="92" fill="#fff"/>
              {Array.from({ length: 11 * 11 }).map((_, i) => {
                const x = i % 11, y = Math.floor(i / 11);
                const filled = ((x * 7 + y * 13 + (inviteUrl.charCodeAt(i % inviteUrl.length) || 0)) % 3) === 0 || (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
                return filled ? <rect key={i} x={6 + x * 7} y={6 + y * 7} width="6" height="6" fill="#18181B"/> : null;
              })}
              <rect x="6" y="6" width="20" height="20" fill="none" stroke="#18181B" strokeWidth="2"/>
              <rect x="66" y="6" width="20" height="20" fill="none" stroke="#18181B" strokeWidth="2"/>
              <rect x="6" y="66" width="20" height="20" fill="none" stroke="#18181B" strokeWidth="2"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Or scan the QR code</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>The recipient will set their password and enroll 2FA before first login.</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="stack" style={{ gap: 14 }}>
          <Field label="Operator email address" required hint="Activation link is valid for 7 days.">
            <Input type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} prefix={<Icon name="mail" size={14}/>}/>
          </Field>
          {sent && <span style={{ fontSize: 12, color: 'var(--color-success-700)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={13}/> Sent · expires in 7 days</span>}
          <div className="notice"><Icon name="info" size={14}/><div>The recipient receives a one-time activation link and must enroll 2FA before first login.</div></div>
        </div>
      )}
    </Modal>
  );
};

// ─── Operator action menu ─────────────────────────────────
const OP_ACTIONS = {
  lock:    { label: 'Lock account',        icon: 'shield' },
  unlock:  { label: 'Unlock account',      icon: 'check' },
  reset:   { label: 'Reset password',      icon: 'edit' },
  resend:  { label: 'Resend activation',   icon: 'mail' },
  remove:  { label: 'Remove operator',     icon: 'trash', danger: true },
};

const OperatorMenu = ({ op, onAction }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = React.useRef(null);
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    const onDoc = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  const pick = (a) => { setOpen(false); onAction(a); };

  return (
    <div className="opmenu-wrap">
      <button ref={btnRef} className="iconbtn" onClick={() => setOpen(o => !o)} aria-label="Operator actions"><Icon name="more"/></button>
      {open && pos && ReactDOM.createPortal(
        <div ref={menuRef} className="opmenu" role="menu" style={{ position: 'fixed', top: pos.top, right: pos.right }}>
          {op.pending && <button className="opmenu__item" onClick={() => pick('resend')}><Icon name="mail" size={14}/>{OP_ACTIONS.resend.label}</button>}
          {!op.pending && <button className="opmenu__item" onClick={() => pick('reset')}><Icon name="edit" size={14}/>{OP_ACTIONS.reset.label}</button>}
          {!op.pending && (op.locked
            ? <button className="opmenu__item" onClick={() => pick('unlock')}><Icon name="check" size={14}/>{OP_ACTIONS.unlock.label}</button>
            : <button className="opmenu__item" onClick={() => pick('lock')}><Icon name="shield" size={14}/>{OP_ACTIONS.lock.label}</button>)}
          <div className="opmenu__sep"/>
          <button className="opmenu__item opmenu__item--danger" onClick={() => pick('remove')}><Icon name="trash" size={14}/>{OP_ACTIONS.remove.label}</button>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── Devices tab (sample devices + sample orders for this customer) ──
const deviceRowStatus = (order, item, dev) => {
  const activated = !!(dev.sn && dev.code && dev.code.length === 6);
  const shipped = item.shipped === true || order.status === 'Shipped' || order.status === 'Complete';
  if (!activated) return { label: 'Pending activation', tone: 'warning' };
  if (shipped) return { label: 'Deployed', tone: 'success' };
  return { label: 'Activated', tone: 'info' };
};

const TabDevices = ({ customer, orders, onOpenOrder, onNewOrder }) => {
  const [view, setView] = useState('devices'); // 'devices' | 'orders'

  const customerOrders = useMemo(
    () => orders.filter(o => o.customerId === customer.id),
    [orders, customer.id]
  );

  // Flatten every device line across all orders for this customer
  const allDevices = useMemo(() => {
    const rows = [];
    customerOrders.forEach(o => {
      o.items.forEach(item => {
        item.devices.forEach((dev, idx) => {
          rows.push({
            key: `${o.id}:${item.id}:${idx}`,
            order: o,
            item,
            dev,
            slot: idx + 1,
            status: deviceRowStatus(o, item, dev),
          });
        });
        // If an item's qty exceeds its devices array length, surface remaining slots as pending
        const missing = item.qty - item.devices.length;
        for (let i = 0; i < missing; i++) {
          rows.push({
            key: `${o.id}:${item.id}:empty:${i}`,
            order: o,
            item,
            dev: { sn: '', code: '', type: item.type || '' },
            slot: item.devices.length + i + 1,
            status: { label: 'Pending activation', tone: 'warning' },
          });
        }
      });
    });
    return rows;
  }, [customerOrders]);

  // Combined stats across both worlds
  const stats = useMemo(() => {
    const totalDevices = allDevices.length;
    const activated = allDevices.filter(r => r.dev.sn && r.dev.code && r.dev.code.length === 6).length;
    const deployed = allDevices.filter(r => r.status.label === 'Deployed').length;
    const pending = totalDevices - activated;
    return {
      totalDevices,
      activated,
      deployed,
      pending,
      ordersTotal: customerOrders.length,
      ordersActive: customerOrders.filter(o => o.status === 'Shipped' || o.status === 'Partially complete' || o.status === 'Awaiting shipment').length,
    };
  }, [allDevices, customerOrders]);

  return (
    <div className="stack" style={{ gap: 14 }}>
      {/* Shared summary across both sub-views */}
      <div className="stats" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 0 }}>
        <div className="stat" style={{ padding: '14px 16px' }}>
          <div className="stat__label">Sample devices</div>
          <div className="stat__val">{stats.totalDevices}</div>
          <div className="stat__delta">across {stats.ordersTotal} order{stats.ordersTotal === 1 ? '' : 's'}</div>
        </div>
        <div className="stat" style={{ padding: '14px 16px' }}>
          <div className="stat__label">Deployed</div>
          <div className="stat__val" style={{ color: 'var(--color-success-700)' }}>{stats.deployed}</div>
          <div className="stat__delta">activated &amp; shipped</div>
        </div>
        <div className="stat" style={{ padding: '14px 16px' }}>
          <div className="stat__label">Pending activation</div>
          <div className="stat__val" style={{ color: 'var(--color-warning-700)' }}>{stats.pending}</div>
          <div className="stat__delta">awaiting SN + code</div>
        </div>
        <div className="stat" style={{ padding: '14px 16px' }}>
          <div className="stat__label">Orders in flight</div>
          <div className="stat__val" style={{ color: 'var(--color-info-700)' }}>{stats.ordersActive}</div>
          <div className="stat__delta">unpaid or unshipped</div>
        </div>
      </div>

      <div className="info-card">
        <div className="info-card__head" style={{ padding: 0, paddingRight: 16, alignItems: 'stretch' }}>
          <div className="tds-tabs" role="tablist" style={{ border: 0, boxShadow: 'none', marginBottom: -1 }}>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'devices'}
              className={`tds-tab ${view === 'devices' ? 'tds-tab--active' : ''}`}
              onClick={() => setView('devices')}>
              Sample devices
              <span className="tds-tab__count">{stats.totalDevices}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'orders'}
              className={`tds-tab ${view === 'orders' ? 'tds-tab--active' : ''}`}
              onClick={() => setView('orders')}>
              Sample orders
              <span className="tds-tab__count">{stats.ordersTotal}</span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Btn variant="secondary" size="sm" icon="link" onClick={() => onOpenOrder && onOpenOrder('__all__')}>View in Orders</Btn>
            <Btn variant="primary" size="sm" icon="plus" onClick={() => onNewOrder && onNewOrder(customer)}>New order</Btn>
          </div>
        </div>

        {view === 'devices'
          ? <DevicesView rows={allDevices} customer={customer} onOpenOrder={onOpenOrder} onNewOrder={onNewOrder}/>
          : <OrdersView orders={customerOrders} customer={customer} onOpenOrder={onOpenOrder} onNewOrder={onNewOrder}/>
        }
      </div>
    </div>
  );
};

// ─── Devices sub-view ─────────────────────────────────────
const DevicesView = ({ rows, customer, onOpenOrder, onNewOrder }) => {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let r = rows;
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter(row =>
        (row.dev.sn || '').toLowerCase().includes(s) ||
        (row.dev.code || '').toLowerCase().includes(s) ||
        row.item.modelName.toLowerCase().includes(s) ||
        row.order.number.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== 'All') r = r.filter(row => row.status.label === statusFilter);
    return r;
  }, [rows, q, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (rows.length === 0) {
    return (
      <div className="empty" style={{ padding: '48px 20px' }}>
        <div style={{ marginBottom: 10, color: 'var(--color-text-secondary)' }}>No sample devices for this customer yet.</div>
        <Btn variant="secondary" size="sm" icon="plus" onClick={() => onNewOrder && onNewOrder(customer)}>Create first order</Btn>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div style={{ flex: 1, maxWidth: 320 }}>
          <Input prefix={<Icon name="search" size={14}/>} placeholder="Search SN, code, model or order…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} size="sm"/>
        </div>
        <div className="tds-select tds-select--sm" style={{ width: 180 }}>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option>All</option>
            <option>Pending activation</option>
            <option>Activated</option>
            <option>Deployed</option>
          </select>
          <span className="tds-select__chevron"><Icon name="chevD" size={14}/></span>
        </div>
      </div>

      <table className="tds-table">
        <colgroup>
          <col style={{ width: '1%' }}/>
          <col/>
          <col style={{ width: '1%' }}/>
          <col style={{ width: '1%' }}/>
          <col style={{ width: '1%' }}/>
          <col style={{ width: '40px' }}/>
        </colgroup>
        <thead>
          <tr>
            <th style={{ whiteSpace: 'nowrap' }}>SN</th>
            <th>Model</th>
            <th style={{ whiteSpace: 'nowrap' }}>Activation code</th>
            <th style={{ whiteSpace: 'nowrap' }}>Status</th>
            <th style={{ whiteSpace: 'nowrap' }}>Source order</th>
            <th style={{ textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 ? (
            <tr><td colSpan="6"><div className="empty">No devices match your filters.</div></td></tr>
          ) : pageRows.map(row => (
            <tr key={row.key} onClick={() => onOpenOrder(row.order.id)} style={{ cursor: 'pointer' }}>
              <td style={{ whiteSpace: 'nowrap' }}>
                {row.dev.sn
                  ? <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: 13, fontWeight: 500 }}>{row.dev.sn}</div>
                  : <div className="muted" style={{ fontSize: 12.5 }}>— not assigned —</div>}
              </td>
              <td>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{row.item.modelName}</div>
                <div className="cust-meta">{row.dev.type || row.item.type}</div>
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {row.dev.code
                  ? <code style={{ fontFamily: 'var(--font-family-mono)', fontSize: 13, letterSpacing: 1 }}>{row.dev.code}</code>
                  : <span className="muted" style={{ fontSize: 12.5 }}>—</span>}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <Badge tone={row.status.tone} dot>{row.status.label}</Badge>
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: 12.5, color: 'var(--color-primary-600)' }}>{row.order.number}</div>
                <div className="cust-meta">{fmtDate(row.order.createdAt)}</div>
              </td>
              <td style={{ textAlign: 'right' }}>
                <button className="iconbtn" onClick={(e) => { e.stopPropagation(); onOpenOrder(row.order.id); }}>
                  <Icon name="chevR" size={14}/>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="table-foot">
          <div className="table-foot__meta">
            Showing <strong>{pageRows.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong>–<strong>{(page - 1) * pageSize + pageRows.length}</strong> of <strong>{filtered.length}</strong>
          </div>
          <div className="tds-pagination">
            <button className="tds-pagination__page" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><Icon name="chevL" size={12}/></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`tds-pagination__page ${p === page ? 'tds-pagination__page--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="tds-pagination__page" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><Icon name="chevR" size={12}/></button>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Orders sub-view ──────────────────────────────────────
const OrdersView = ({ orders, customer, onOpenOrder, onNewOrder }) => {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    let rows = orders;
    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter(o =>
        o.number.toLowerCase().includes(s) ||
        o.items.some(i => i.modelName.toLowerCase().includes(s))
      );
    }
    if (status === 'In transit') rows = rows.filter(o => o.status === 'Shipped' || o.status === 'Partially complete');
    else if (status !== 'All') rows = rows.filter(o => o.status === status);
    rows = [...rows].sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy];
      const r = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === 'asc' ? r : -r;
    });
    return rows;
  }, [orders, q, status, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const sortCell = (key, label) => (
    <span className="tds-table__sort" onClick={() => {
      if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else { setSortBy(key); setSortDir('asc'); }
    }}>
      {label}
      <span style={{ opacity: sortBy === key ? 1 : 0.3, fontSize: 9 }}>{sortBy === key && sortDir === 'asc' ? '▲' : '▼'}</span>
    </span>
  );

  if (orders.length === 0) {
    return (
      <div className="empty" style={{ padding: '48px 20px' }}>
        <div style={{ marginBottom: 10, color: 'var(--color-text-secondary)' }}>No sample orders for this customer yet.</div>
        <Btn variant="secondary" size="sm" icon="plus" onClick={() => onNewOrder && onNewOrder(customer)}>Create first order</Btn>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div style={{ flex: 1, maxWidth: 320 }}>
          <Input prefix={<Icon name="search" size={14}/>} placeholder="Search order # or model…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} size="sm"/>
        </div>
        <div className="tds-select tds-select--sm" style={{ width: 160 }}>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option>All</option>
            {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
            <option>In transit</option>
          </select>
          <span className="tds-select__chevron"><Icon name="chevD" size={14}/></span>
        </div>
      </div>

      <table className="tds-table">
        <colgroup>
          <col style={{ width: '1%' }}/>
          <col/>
          <col style={{ width: '1%' }}/>
          <col style={{ width: '1%' }}/>
          <col style={{ width: '1%' }}/>
          <col style={{ width: '40px' }}/>
        </colgroup>
        <thead>
          <tr>
            <th style={{ whiteSpace: 'nowrap' }}>{sortCell('number', 'Order')}</th>
            <th>Models &amp; units</th>
            <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Total</th>
            <th style={{ whiteSpace: 'nowrap' }}>{sortCell('status', 'Status')}</th>
            <th style={{ whiteSpace: 'nowrap' }}>{sortCell('createdAt', 'Created')}</th>
            <th style={{ textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 ? (
            <tr><td colSpan="6"><div className="empty">No orders match your filters.</div></td></tr>
          ) : pageRows.map(o => {
            const prog = deviceProgress(o);
            const showProgress = o.status === 'Awaiting shipment';
            return (
              <tr key={o.id} onClick={() => onOpenOrder(o.id)} style={{ cursor: 'pointer' }}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: 13, fontWeight: 500 }}>{o.number}</div>
                </td>
                <td>
                  {o.items.slice(0, 2).map((i, idx) => (
                    <div key={idx} style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{i.modelName}</span>
                      <span style={{ marginLeft: 6 }}>× {i.qty}</span>
                    </div>
                  ))}
                  {o.items.length > 2 ? (
                    <div className="cust-meta">+{o.items.length - 2} more · {orderQty(o)} units total</div>
                  ) : o.items.length > 1 ? (
                    <div className="cust-meta">{orderQty(o)} units total</div>
                  ) : null}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} className="num">
                  <div>
                    {orderTotal(o) === 0
                      ? <span style={{ color: 'var(--color-success-700)', fontWeight: 600 }}>Free</span>
                      : moneyUSD(orderTotal(o))}
                  </div>
                  {o.discountPct > 0 && (
                    <div className="cust-meta" style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                      <Icon name="gift" size={10} style={{ verticalAlign: '-1px' }}/>
                      {o.discountPct === 100 ? 'Complimentary' : `${o.discountPct}% off`}
                    </div>
                  )}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                    <Badge tone={ORDER_STATUS_TONE[o.status] || 'neutral'} dot>{o.status}</Badge>
                    {showProgress && prog.total > 0 && (
                      <div className="cust-meta num" title="Devices activated / total">
                        {prog.done}/{prog.total} activated
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: 13 }}>{fmtDate(o.createdAt)}</div>
                  <div className="cust-meta">{relTime(o.createdAt)}</div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="iconbtn" onClick={(e) => { e.stopPropagation(); onOpenOrder(o.id); }}>
                    <Icon name="chevR" size={14}/>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="table-foot">
          <div className="table-foot__meta">
            Showing <strong>{pageRows.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong>–<strong>{(page - 1) * pageSize + pageRows.length}</strong> of <strong>{filtered.length}</strong>
          </div>
          <div className="tds-pagination">
            <button className="tds-pagination__page" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><Icon name="chevL" size={12}/></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`tds-pagination__page ${p === page ? 'tds-pagination__page--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="tds-pagination__page" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><Icon name="chevR" size={12}/></button>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Roles tab (system + custom) ─────────────────────────
const computeRoleAllowed = (role) => {
  const sel = role.contractsAllowed || [];
  const mode = role.contractMode || 'allow';
  if (mode === 'allow') return sel;
  return ALL_CONTRACT_KINDS.filter(k => !sel.includes(k));
};

const TabRoles = ({ customer, onUpdate }) => {
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null); // custom role being edited
  const [confirmDel, setConfirmDel] = useState(null);

  const activeKinds = customer.contracts
    .filter(c => c.status === 'Active' || c.status === 'Signed' || c.status === 'Pending')
    .map(c => c.kind);
  const activeSet = new Set(activeKinds);

  const denied = new Set(customer.deniedRoles || []);
  const customRoles = customer.customRoles || [];

  // System roles whose effective allowed-contracts intersect this customer's active contracts
  const visibleSystem = SEED_ROLES.map(r => {
    const allowed = computeRoleAllowed(r);
    const scope = allowed.filter(k => activeSet.has(k));
    return { ...r, _scope: scope };
  }).filter(r => r._scope.length > 0);

  const toggleDeny = (rid, name) => {
    const next = new Set(denied);
    const wasDenied = next.has(rid);
    if (wasDenied) next.delete(rid); else next.add(rid);
    onUpdate({
      ...customer,
      deniedRoles: [...next],
      events: [...customer.events, {
        at: new Date().toISOString(), kind: 'role',
        by: 'admin@carbon',
        text: `${wasDenied ? 'Unblocked' : 'Blocked'} system role "${name}" for this customer`,
      }],
    });
    toast(wasDenied ? `"${name}" re-enabled` : `"${name}" blocked for this customer`);
  };

  const saveCustomRole = (role) => {
    const exists = customRoles.find(r => r.id === role.id);
    const next = exists
      ? customRoles.map(r => r.id === role.id ? role : r)
      : [...customRoles, role];
    onUpdate({
      ...customer,
      customRoles: next,
      events: [...customer.events, {
        at: new Date().toISOString(), kind: 'role',
        by: 'admin@carbon',
        text: `${exists ? 'Updated' : 'Added'} custom role "${role.name}"`,
      }],
    });
    toast(`Custom role "${role.name}" saved`);
    setEditing(null);
    setShowAdd(false);
  };

  const deleteCustomRole = (role) => {
    onUpdate({
      ...customer,
      customRoles: customRoles.filter(r => r.id !== role.id),
      events: [...customer.events, {
        at: new Date().toISOString(), kind: 'role',
        by: 'admin@carbon',
        text: `Removed custom role "${role.name}"`,
      }],
    });
    toast(`Custom role "${role.name}" removed`);
    setConfirmDel(null);
  };

  return (
    <div className="stack" style={{ gap: 14 }}>
      {/* System roles */}
      <div className="info-card">
        <div className="info-card__head">
          <div>
            <div className="info-card__title">System roles ({visibleSystem.length})</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              All system-defined roles whose contract scope overlaps this customer's contracts. Blacklist any role to prevent it from being assigned to operators here.
            </div>
          </div>
          <div className="muted" style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
            {denied.size > 0 ? <><strong style={{ color: 'var(--color-danger-700)' }}>{denied.size}</strong> blocked · </> : null}
            {visibleSystem.length - denied.size} available
          </div>
        </div>

        {activeKinds.length === 0 && (
          <div className="empty" style={{ padding: '40px 20px' }}>
            No active contracts yet. Roles will appear here once a contract is signed.
          </div>
        )}

        {activeKinds.length > 0 && visibleSystem.length === 0 && (
          <div className="empty" style={{ padding: '40px 20px' }}>
            No system roles match this customer's contract types.
          </div>
        )}

        <div>
          {visibleSystem.map(r => {
            const isDenied = denied.has(r.id);
            return (
              <div key={r.id} className={`crow cust-role-row ${isDenied ? 'is-denied' : ''}`}>
                <div className="pick-card__icon" style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-bg-3)', color: 'var(--color-text-secondary)' }}>
                  <Icon name="shield" size={16}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                    {isDenied && <Badge tone="error">Blocked</Badge>}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{r.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span className="muted" style={{ fontSize: 11.5 }}>{r.permissions.length} permissions</span>
                    <span className="dot">·</span>
                    <span className="muted" style={{ fontSize: 11.5 }}>Scope:</span>
                    {r._scope.map(k => (
                      <span key={k} className={`perm-chip perm-chip--${k.toLowerCase()}`}>{k}</span>
                    ))}
                  </div>
                </div>
                <Btn variant={isDenied ? 'primary' : 'ghost'} size="sm" icon={isDenied ? 'check' : 'x'} onClick={() => toggleDeny(r.id, r.name)}>
                  {isDenied ? 'Unblock' : 'Block'}
                </Btn>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom roles */}
      <div className="info-card">
        <div className="info-card__head">
          <div>
            <div className="info-card__title">Custom roles ({customRoles.length})</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              Customer-specific roles. Only visible to operators of <strong>{customer.name}</strong>.
            </div>
          </div>
          <Btn variant="primary" size="sm" icon="plus" onClick={() => { setEditing(null); setShowAdd(true); }}>Add custom role</Btn>
        </div>
        <div>
          {customRoles.length === 0 ? (
            <div className="empty" style={{ padding: '32px 20px' }}>
              No custom roles. Add one to extend permissions beyond the system roles.
            </div>
          ) : customRoles.map(r => (
            <div key={r.id} className="crow">
              <div className="pick-card__icon" style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-primary-50)', color: 'var(--color-primary-700)' }}>
                <Icon name="star" size={16}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <Badge tone="info">Custom</Badge>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{r.description || 'No description'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className="muted" style={{ fontSize: 11.5 }}>{r.permissions.length} permissions</span>
                  {(r.contractsAllowed || []).length > 0 && <>
                    <span className="dot">·</span>
                    <span className="muted" style={{ fontSize: 11.5 }}>Scope:</span>
                    {r.contractsAllowed.filter(k => activeSet.has(k)).map(k => (
                      <span key={k} className={`perm-chip perm-chip--${k.toLowerCase()}`}>{k}</span>
                    ))}
                  </>}
                </div>
              </div>
              <Btn variant="ghost" size="sm" icon="edit" onClick={() => { setEditing(r); setShowAdd(true); }}>Edit</Btn>
              <Btn variant="ghost" size="sm" icon="trash" onClick={() => setConfirmDel(r)}>Remove</Btn>
            </div>
          ))}
        </div>
      </div>

      <CustomRoleModal
        open={showAdd}
        onClose={() => { setShowAdd(false); setEditing(null); }}
        onSave={saveCustomRole}
        role={editing}
        activeKinds={activeKinds}
        customerName={customer.name}
        customRoles={customRoles}
      />

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Remove custom role?" width={420}
        footer={<>
          <Btn variant="ghost" size="sm" onClick={() => setConfirmDel(null)}>Cancel</Btn>
          <Btn variant="danger" size="sm" icon="trash" onClick={() => deleteCustomRole(confirmDel)}>Remove role</Btn>
        </>}>
        <p style={{ margin: 0, fontSize: 13.5 }}>
          <strong>{confirmDel?.name}</strong> will be removed from this customer. Operators using it will fall back to <strong>Viewer</strong>.
        </p>
      </Modal>
    </div>
  );
};

const CustomRoleModal = ({ open, onClose, onSave, role, activeKinds, customerName, customRoles = [] }) => {
  const initial = role || {
    id: 'cr-' + Math.random().toString(36).slice(2, 7),
    name: '', description: '',
    contractsAllowed: [...activeKinds],
    contractMode: 'allow',
    permissions: [],
  };
  const [draft, setDraft] = useState(initial);
  const [copyFromId, setCopyFromId] = useState('');
  React.useEffect(() => { setDraft(role || initial); setCopyFromId(''); /* eslint-disable-next-line */ }, [open, role]);

  if (!open) return null;

  const copyFrom = (srcId) => {
    setCopyFromId(srcId);
    if (!srcId) return;
    const src = [...SEED_ROLES, ...customRoles].find(r => r.id === srcId);
    if (!src) return;
    // Filter source scope to this customer's active contracts
    const srcAllowed = (src.contractsAllowed || []).filter(k => activeKinds.includes(k));
    // Filter source perms to those applicable under the new scope
    const allowedNow = (src.contractMode === 'deny')
      ? activeKinds.filter(k => !srcAllowed.includes(k))
      : srcAllowed;
    const validPerms = src.permissions.filter(pid => {
      const item = PERMISSION_GROUPS.flatMap(g => g.items).find(i => i.id === pid);
      if (!item) return false;
      if (!item.contracts) return true;
      return item.contracts.some(c => allowedNow.includes(c));
    });
    setDraft(d => ({
      ...d,
      description: d.description || src.description || '',
      contractsAllowed: srcAllowed.length ? srcAllowed : [...activeKinds],
      contractMode: 'allow',
      permissions: validPerms,
    }));
  };
  const togglePerm = (id) => {
    setDraft(d => ({ ...d, permissions: d.permissions.includes(id) ? d.permissions.filter(p => p !== id) : [...d.permissions, id] }));
  };
  const toggleContract = (k) => {
    setDraft(d => ({ ...d, contractsAllowed: d.contractsAllowed.includes(k) ? d.contractsAllowed.filter(x => x !== k) : [...d.contractsAllowed, k] }));
  };

  // Only show permissions whose contracts overlap the chosen scope for this customer
  const scope = (draft.contractsAllowed || []).filter(k => activeKinds.includes(k));
  const groups = PERMISSION_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(it => !it.contracts || it.contracts.some(c => scope.includes(c))),
  })).filter(g => g.items.length > 0);

  const valid = draft.name.trim().length > 0 && scope.length > 0;

  return (
    <Modal open={open} onClose={onClose} title={role ? 'Edit custom role' : `Add custom role for ${customerName}`} width={640}
      footer={<>
        <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" size="sm" icon="check" onClick={() => onSave(draft)} disabled={!valid}>Save role</Btn>
      </>}>
      <div className="stack" style={{ gap: 14 }}>
        {!role && (
          <Field label="Copy from" hint="Optional — seed permissions and scope from an existing role.">
            <div className="tds-select tds-select--md">
              <select value={copyFromId} onChange={e => copyFrom(e.target.value)}>
                <option value="">— Start blank —</option>
                {SEED_ROLES.length > 0 && (
                  <optgroup label="System roles">
                    {SEED_ROLES.map(r => <option key={r.id} value={r.id}>{r.name} · {r.permissions.length} perms</option>)}
                  </optgroup>
                )}
                {customRoles.length > 0 && (
                  <optgroup label="This customer's custom roles">
                    {customRoles.map(r => <option key={r.id} value={r.id}>{r.name} · {r.permissions.length} perms</option>)}
                  </optgroup>
                )}
              </select>
              <span className="tds-select__chevron"><Icon name="chevD" size={14}/></span>
            </div>
          </Field>
        )}
        <Field label="Role name" required>
          <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Onboarding Specialist"/>
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="What this role is for…"/>
        </Field>

        <Field label="Contract scope" hint="Only contracts this customer holds are shown.">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {activeKinds.length === 0 && <span className="muted" style={{ fontSize: 12 }}>No active contracts yet.</span>}
            {activeKinds.map(k => {
              const on = draft.contractsAllowed.includes(k);
              return (
                <button key={k}
                  className={`perm-fchip perm-fchip--${k.toLowerCase()} ${on ? 'is-on' : ''}`}
                  onClick={() => toggleContract(k)}>{k}</button>
              );
            })}
          </div>
        </Field>

        <Field label={`Permissions (${draft.permissions.length} selected)`}>
          <div className="cust-role-perms">
            {groups.length === 0 && <div className="muted" style={{ fontSize: 12, padding: 12 }}>Select a contract scope above to choose permissions.</div>}
            {groups.map(g => (
              <details key={g.id} className="cust-role-perms__group">
                <summary>
                  <Icon name="chevR" size={12}/>
                  <span>{g.label}</span>
                  <span className="muted" style={{ fontSize: 11 }}>
                    {g.items.filter(i => draft.permissions.includes(i.id)).length}/{g.items.length}
                  </span>
                </summary>
                <div>
                  {g.items.map(it => {
                    const on = draft.permissions.includes(it.id);
                    return (
                      <label key={it.id} className={`cust-role-perms__row ${on ? 'is-on' : ''}`}>
                        <input type="checkbox" checked={on} onChange={() => togglePerm(it.id)}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{it.label}</div>
                          <div className="muted" style={{ fontSize: 11.5 }}>{it.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
};

// ─── Operators tab ────────────────────────────────────────
const TabOperators = ({ customer, maskOn, setMaskOn }) => {
  const toast = useToast();
  const [revealed, setRevealed] = useState({});
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // { op, action }
  const toggle = (idx, field) => {
    setRevealed(r => ({ ...r, [`${idx}.${field}`]: !r[`${idx}.${field}`] }));
    if (!revealed[`${idx}.${field}`]) toast({ kind: 'info', title: 'Sensitive field revealed', msg: 'This action is recorded in the audit log.' });
  };

  const handleOpAction = (op, idx, action) => {
    if (action === 'remove' || action === 'lock' || action === 'unlock') { setConfirm({ op, idx, action }); return; }
    if (action === 'reset')  toast({ kind: 'success', title: 'Password reset email sent', msg: `Sent to ${op.email}` });
    if (action === 'resend') toast({ kind: 'success', title: 'Activation link resent',  msg: `Sent to ${op.email}` });
  };

  return (
    <>
    <div className="info-card">
      <div className="info-card__head">
        <div>
          <div className="info-card__title">Operators ({customer.operators.length})</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn variant="primary" size="sm" icon="plus" onClick={() => setInviteOpen(true)}>Invite operator</Btn>
        </div>
      </div>
      <div>
        {customer.operators.length === 0 ? <div className="empty">No operators yet.</div> :
          <table className="tds-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last login</th>
                <th style={{ paddingRight: 20 }}></th>
              </tr>
            </thead>
            <tbody>
              {customer.operators.map((op, i) => {
                const showEmail = !maskOn || revealed[`${i}.email`];
                const showName  = !maskOn || revealed[`${i}.name`];
                return (
                  <tr key={i} style={{ cursor: 'default' }}>
                    <td style={{ paddingLeft: 20 }}>
                      <div className="cust-cell">
                        <CompanyLogo name={op.name || op.email} size={28}/>
                        <div>
                          {op.name
                            ? <div className="cust-name">{showName ? op.name : maskName(op.name)}</div>
                            : <div className="cust-name muted" style={{ fontStyle: 'italic', fontWeight: 400 }}>Not yet provided</div>}
                          <div className="cust-meta" style={{ display: 'flex', gap: 6 }}>
                            {op.pending && <Badge tone="warning" dot>Pending activation</Badge>}
                            {op.locked  && <Badge tone="error" dot>Locked</Badge>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="op-mask">{showEmail ? op.email : maskEmail(op.email)}</span>
                      {maskOn && <button className="reveal-btn" onClick={() => toggle(i, 'email')}>{revealed[`${i}.email`] ? 'Hide' : 'Reveal'}</button>}
                    </td>
                    <td>
                      <Badge tone={op.role === 'Admin' ? 'info' : 'neutral'}>{op.role}</Badge>
                    </td>
                    <td><span className="num" style={{ fontSize: 13 }}>{op.lastLogin ? relTime(op.lastLogin) : <span className="muted">Never</span>}</span></td>
                    <td style={{ paddingRight: 20, textAlign: 'right' }}>
                      <OperatorMenu op={op} onAction={(a) => handleOpAction(op, i, a)}/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        }
      </div>
    </div>
    <InviteOperatorModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={() => {}}/>
    <Modal open={!!confirm} onClose={() => setConfirm(null)}
      title={confirm?.action === 'remove' ? 'Remove operator' : confirm?.action === 'lock' ? 'Lock account' : 'Unlock account'}
      width={420}
      footer={<>
        <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancel</Btn>
        <Btn variant={confirm?.action === 'remove' ? 'danger' : 'primary'} icon={confirm?.action === 'remove' ? 'trash' : 'check'}
          onClick={() => {
            const verb = confirm.action === 'remove' ? 'removed' : confirm.action === 'lock' ? 'locked' : 'unlocked';
            toast({ kind: confirm.action === 'remove' ? 'warning' : 'success', title: `Operator ${verb}`, msg: confirm.op.email });
            setConfirm(null);
          }}>
          {confirm?.action === 'remove' ? 'Remove operator' : confirm?.action === 'lock' ? 'Lock account' : 'Unlock account'}
        </Btn>
      </>}>
      {confirm && (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
          {confirm.action === 'remove' && <>Remove <strong>{confirm.op.name}</strong> from this customer? They will lose access immediately. This action is audited.</>}
          {confirm.action === 'lock'   && <>Lock <strong>{confirm.op.name}</strong>? They won't be able to sign in until you unlock the account.</>}
          {confirm.action === 'unlock' && <>Unlock <strong>{confirm.op.name}</strong>? They'll regain sign-in access immediately.</>}
        </p>
      )}
    </Modal>
    </>
  );
};

// ─── History tab ─────────────────────────────────────────
const KIND_META = {
  created:   { tone: 'success', label: 'Created' },
  'contract+': { tone: 'info',    label: 'Contract added' },
  'contract✓': { tone: 'success', label: 'Contract signed' },
  'contract-': { tone: 'warning', label: 'Contract removed' },
  'operator+': { tone: 'info',    label: 'Operator invited' },
  info:      { tone: 'neutral', label: 'Info updated' },
  reveal:    { tone: 'warning', label: 'Sensitive data revealed' },
  warn:      { tone: 'warning', label: 'Status changed' },
};

const TabHistory = ({ customer }) => (
  <div className="info-card">
    <div className="info-card__head">
      <div className="info-card__title">History ({customer.events.length})</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn variant="ghost" size="sm" icon="filter">Filter</Btn>
        <Btn variant="ghost" size="sm" icon="download">Export</Btn>
      </div>
    </div>
    <div className="info-card__body">
      <div className="timeline">
        {[...customer.events].reverse().map((ev, i) => {
          const meta = KIND_META[ev.kind] || { tone: 'neutral', label: ev.kind };
          return (
            <div key={i} className="tl-row">
              <div className={`tl-row__dot tl-row__dot--${meta.tone}`}/>
              <div className="tl-row__title">{ev.text}</div>
              <div className="tl-row__meta">
                <span>{fmtDateTime(ev.at)}</span>
                <span>·</span>
                <span>by {ev.by}</span>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ─── Detail shell ────────────────────────────────────────
const CustomerDetail = ({ customer, orders = [], onBack, onUpdate, onOpenOrder, onNewOrder, maskOn, setMaskOn }) => {
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'operators', label: 'Operators & roles' },
    { id: 'history',   label: 'History' },
  ];

  const handleSaveInfo = (next) => onUpdate({ ...next, events: [...customer.events, { at: new Date().toISOString(), kind: 'info', by: 'admin@carbon', text: 'Basic information updated' }] });
  const handleAddContracts = (kinds) => onUpdate({
    ...customer,
    contracts: [...customer.contracts, ...kinds.map(k => ({ kind: k, status: 'Active', signedAt: new Date().toISOString(), signedBy: 'admin@carbon' }))],
    events: [...customer.events, ...kinds.map(k => ({ at: new Date().toISOString(), kind: 'contract+', by: 'admin@carbon', text: `${k} contract configured · active` }))],
  });
  const handleRemoveContract = (c) => onUpdate({
    ...customer,
    contracts: (c.status === 'Active' || c.status === 'Signed')
      ? customer.contracts.map(x => x === c ? { ...x, status: 'Terminated' } : x)
      : customer.contracts.filter(x => x !== c),
    events: [...customer.events, { at: new Date().toISOString(), kind: 'contract-', by: 'admin@carbon', text: `${c.kind} contract ${(c.status === 'Active' || c.status === 'Signed') ? 'terminated' : 'removed'}` }],
  });

  return (
    <div className="page">
      <div style={{ marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 0, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, marginLeft: -8 }}>
          <Icon name="chevL" size={14}/> Back to customers
        </button>
      </div>

      <div className="det-header">
        <CompanyLogo name={customer.name} size={56}/>
        <div className="det-header__main">
          <h1 className="det-header__title">
            {customer.name}
            <Badge tone={STATUS_TONE_MAP[customer.status]} dot>{customer.status}</Badge>
          </h1>
          <div className="det-header__meta">
            <span><Icon name="clock" size={13}/> Registered {fmtDate(customer.registeredAt)}</span>
            {customer.license && <span><Icon name="shield" size={13}/> {customer.license}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" icon="edit" onClick={() => setEditOpen(true)}>Edit info</Btn>
          <Btn variant="primary" icon="plus" onClick={() => setTab('contracts')}>Add contract</Btn>
        </div>
      </div>

      <div className="det-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tds-tab ${tab === t.id ? 'tds-tab--active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
            {typeof t.count === 'number' && <span className="tds-tab__count">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview'  && <TabOverview customer={customer} onSave={handleSaveInfo}/>}
      {tab === 'contracts' && <TabContracts customer={customer} onAdd={handleAddContracts} onRemove={handleRemoveContract}/>}
      {tab === 'operators' && (
        <div className="stack" style={{ gap: 14 }}>
          <TabOperators customer={customer} maskOn={maskOn} setMaskOn={setMaskOn}/>
          <TabRoles customer={customer} onUpdate={onUpdate}/>
        </div>
      )}
      {tab === 'history'   && <TabHistory customer={customer}/>}

      <EditInfoModal open={editOpen} customer={customer} onClose={() => setEditOpen(false)} onSave={(next) => { handleSaveInfo(next); setEditOpen(false); }}/>
    </div>
  );
};

const EditInfoModal = ({ open, customer, onClose, onSave }) => {
  const [form, setForm] = useState(customer);
  const toast = useToast();
  React.useEffect(() => { if (open) setForm(customer); }, [open, customer]);
  const valid = form.name?.trim() && form.address?.trim();
  return (
    <Modal open={open} onClose={onClose} title="Edit customer info" width={520}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" icon="check" disabled={!valid} onClick={() => { onSave(form); toast({ kind: 'success', title: 'Customer info updated' }); }}>Save changes</Btn>
      </>}>
      <div className="stack" style={{ gap: 16 }}>
        <Field label="Company name" required>
          <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}/>
        </Field>
        <Field label="Address" required>
          <Textarea rows={2} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })}/>
        </Field>
        <Field label="License">
          <Input value={form.license || ''} onChange={e => setForm({ ...form, license: e.target.value })} placeholder="Optional"/>
        </Field>
        <Field label="Internal notes">
          <Textarea rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional"/>
        </Field>
      </div>
    </Modal>
  );
};

window.CustomerDetail = CustomerDetail;
