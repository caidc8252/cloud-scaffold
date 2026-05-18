/* global React, Btn, Input, Field, Textarea, Icon, Badge, ContractBadge, CONTRACT_INFO, useToast */
const { useState } = React;

const CONTRACT_OPTIONS = [
  { kind: 'ISV',      title: 'ISV — Independent Software Vendor',  desc: 'Grants the customer the ability to integrate Carbon APIs into their own software and resell payment services.', iconClass: 'isv' },
  { kind: 'ISO',      title: 'ISO — Independent Sales Organization', desc: 'Authorizes the customer to onboard sub-merchants and earn residuals on processing volume.',                  iconClass: 'iso' },
  { kind: 'Acquirer', title: 'Acquirer',                             desc: 'Direct merchant acquiring relationship. Bank sponsorship required.',                                       iconClass: 'acquirer' },
  { kind: 'PayFac',   title: 'PayFac — Payment Facilitator',         desc: 'Customer operates as a master merchant, processing on behalf of sub-merchants.',                           iconClass: 'payfac' },
];

const Stepper = ({ step }) => {
  const items = [
    { n: 1, sub: 'Step 1', label: 'Company' },
    { n: 2, sub: 'Step 2', label: 'Contracts' },
    { n: 3, sub: 'Done',   label: 'Confirmation' },
  ];
  return (
    <div className="stepper">
      {items.map((it, i) => (
        <React.Fragment key={it.n}>
          <div className={`stepper__item ${step === it.n ? 'is-active' : ''} ${step > it.n ? 'is-done' : ''}`}>
            <div className="stepper__dot">{step > it.n ? <Icon name="check" size={14}/> : it.n}</div>
            <div className="stepper__lbl"><small>{it.sub}</small><strong>{it.label}</strong></div>
          </div>
          {i < items.length - 1 && <div className={`stepper__bar ${step > it.n ? 'is-done' : ''}`}/>}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Step 1 — Company info ────────────────────────────────
const Step1 = ({ data, onChange }) => {
  const [touched, setTouched] = useState({});
  const errs = {
    name:    !data.name?.trim()    ? 'Company name is required' : null,
    address: !data.address?.trim() ? 'Address is required'      : null,
  };
  return (
    <div className="tds-card">
      <div className="tds-card__header"><div className="tds-card__title">Company information</div></div>
      <div className="tds-card__body">
        <div className="form-grid" style={{ gap: 18 }}>
          <Field label="Company name" required error={touched.name && errs.name}>
            <Input value={data.name} onChange={e => onChange({ name: e.target.value })} onBlur={() => setTouched(t => ({ ...t, name: true }))} placeholder="e.g. Northwind Commerce" invalid={!!(touched.name && errs.name)}/>
          </Field>
          <Field label="Registered address" required error={touched.address && errs.address}>
            <Textarea value={data.address} onChange={e => onChange({ address: e.target.value })} onBlur={() => setTouched(t => ({ ...t, address: true }))} placeholder="Street, city, region, postal code, country" rows={2} invalid={!!(touched.address && errs.address)}/>
          </Field>
          <div className="form-grid form-grid--2" style={{ gap: 18 }}>
            <Field label="License" hint="Manually entered — leave blank if not yet issued.">
              <Input value={data.license} onChange={e => onChange({ license: e.target.value })} placeholder="e.g. NW-2024-08831-CA"/>
            </Field>
            <Field label="Internal notes" hint="Visible to TOMS admins only.">
              <Input value={data.notes} onChange={e => onChange({ notes: e.target.value })} placeholder="Optional"/>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Step 2 — Contracts (admin-configured, no signing) ────
const Step2 = ({ contracts, toggle }) => (
  <div className="tds-card">
    <div className="tds-card__header">
      <div>
        <div className="tds-card__title">Assign contracts</div>
        <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Select one or more. Contracts take effect immediately once you create the customer — no customer-side signing required.</div>
      </div>
    </div>
    <div className="tds-card__body">
      <div className="form-grid form-grid--2" style={{ gap: 12 }}>
        {CONTRACT_OPTIONS.map(opt => {
          const on = contracts.includes(opt.kind);
          return (
            <div key={opt.kind} className={`pick-card ${on ? 'is-on' : ''}`} onClick={() => toggle(opt.kind)} role="button" tabIndex="0">
              <div className={`pick-card__icon pick-card__icon--${opt.iconClass}`}>
                <Icon name={opt.iconClass === 'isv' ? 'file' : opt.iconClass === 'iso' ? 'shield' : opt.iconClass === 'acquirer' ? 'check' : 'link'} size={20}/>
              </div>
              <div style={{ flex: 1, paddingRight: 32 }}>
                <div className="pick-card__title">{opt.title}</div>
                <div className="pick-card__desc">{opt.desc}</div>
              </div>
              <div className="pick-card__check">{on && <Icon name="check" size={12}/>}</div>
            </div>
          );
        })}
      </div>

      {contracts.length > 0 && (
        <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--color-bg-3)', borderRadius: 10, border: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 500 }}>
            Will be created as
          </div>
          <div className="badge-row" style={{ gap: 6 }}>
            {contracts.map(k => <ContractBadge key={k} kind={k} status="Active"/>)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="info" size={13}/> Configured by you on behalf of the customer. Effective <strong style={{ margin: '0 3px' }}>immediately</strong> on creation.
          </div>
        </div>
      )}
    </div>
  </div>
);

// ─── Step 3 — Done ────────────────────────────────────────
const StepDone = ({ customer, onGoToDetail }) => (
  <div className="tds-card" style={{ textAlign: 'center' }}>
    <div className="tds-card__body" style={{ padding: '40px 32px' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-success-50)', color: 'var(--color-success-700)', display: 'inline-grid', placeItems: 'center', margin: '0 auto 18px', border: '1px solid oklch(58% 0.14 152 / 0.25)' }}>
        <Icon name="check" size={36}/>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Customer created</h2>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 24px', maxWidth: 460, marginInline: 'auto', lineHeight: 1.55 }}>
        <strong style={{ color: 'var(--color-text-primary)' }}>{customer.name}</strong> is now registered with{' '}
        {customer.contracts.length} active contract{customer.contracts.length === 1 ? '' : 's'}. You can add operators and start placing orders from the customer detail page.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Btn variant="primary" icon="chevR" iconRight="chevR" onClick={onGoToDetail}>Open customer detail</Btn>
      </div>
    </div>
  </div>
);

// ─── Wizard shell ────────────────────────────────────────
const CustomerWizard = ({ onCancel, onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: '', address: '', license: '', notes: '' });
  const [contracts, setContracts] = useState([]);
  const [created, setCreated] = useState(null);

  const canNext = (() => {
    if (step === 1) return data.name.trim() && data.address.trim();
    if (step === 2) return contracts.length > 0;
    return true;
  })();

  const toggleContract = (k) => setContracts(c => c.includes(k) ? c.filter(x => x !== k) : [...c, k]);

  const finalize = () => {
    const id = 'c-' + Date.now().toString().slice(-4);
    const nowIso = new Date().toISOString();
    const cust = {
      id,
      name: data.name.trim(),
      address: data.address.trim(),
      license: data.license.trim(),
      notes: data.notes.trim(),
      status: 'Active',
      registeredAt: nowIso,
      contracts: contracts.map(kind => ({ kind, status: 'Active', signedAt: nowIso, signedBy: 'admin@carbon' })),
      operators: [],
      events: [
        { at: nowIso, kind: 'created', by: 'admin@carbon', text: 'Company registered' },
        ...contracts.map(kind => ({ at: nowIso, kind: 'contract+', by: 'admin@carbon', text: `${kind} contract configured · active` })),
      ],
    };
    setCreated(cust);
    setStep(3);
  };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">New customer</h1>
          <p className="page__sub">Register a company and configure its contracts. Operators can be added later from the customer detail.</p>
        </div>
        <Btn variant="ghost" icon="x" onClick={onCancel}>Cancel</Btn>
      </div>

      <Stepper step={step}/>

      <div className="wizard-grid">
        <div>
          {step === 1 && <Step1 data={data} onChange={p => setData(d => ({ ...d, ...p }))}/>}
          {step === 2 && <Step2 contracts={contracts} toggle={toggleContract}/>}
          {step === 3 && created && <StepDone customer={created} onGoToDetail={() => onComplete(created)}/>}

          {step < 3 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <Btn variant="ghost" icon="chevL" disabled={step === 1} onClick={() => setStep(s => s - 1)}>Back</Btn>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="secondary" onClick={onCancel}>Save as draft</Btn>
                {step < 2 ? (
                  <Btn variant="primary" iconRight="chevR" disabled={!canNext} onClick={() => setStep(s => s + 1)}>Continue</Btn>
                ) : (
                  <Btn variant="primary" icon="check" disabled={!canNext} onClick={finalize}>Create customer</Btn>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="wizard-aside">
          <h4>Summary</h4>
          <dl>
            <dt>Name</dt>      <dd>{data.name || <span className="muted">—</span>}</dd>
            <dt>Address</dt>   <dd style={{ fontSize: 12.5 }}>{data.address || <span className="muted">—</span>}</dd>
            <dt>License</dt>   <dd>{data.license || <span className="muted">—</span>}</dd>
            <dt>Contracts</dt> <dd>
              {contracts.length === 0 ? <span className="muted">None selected</span> :
                <div className="badge-row">{contracts.map(k => <ContractBadge key={k} kind={k} status="Active"/>)}</div>
              }
            </dd>
          </dl>
        </aside>
      </div>
    </div>
  );
};

window.CustomerWizard = CustomerWizard;
