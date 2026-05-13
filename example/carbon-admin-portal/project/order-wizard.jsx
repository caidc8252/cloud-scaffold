/* global React, Btn, Input, Field, Textarea, Select, Icon, Badge, CompanyLogo, useToast,
   DEVICE_MODELS, moneyUSD, orderSubtotal, orderTotal, emptyDevices */
const { useState, useMemo } = React;

// ─── Stepper (re-uses .stepper classes from main stylesheet) ────────────────
const OrderStepper = ({ step }) => {
  const items = [
    { n: 1, sub: 'Step 1', label: 'Customer' },
    { n: 2, sub: 'Step 2', label: 'Models & quantities' },
    { n: 3, sub: 'Step 3', label: 'Pricing & discount' },
    { n: 4, sub: 'Done',   label: 'Review & create' },
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

// ─── Step 1 — Customer picker ──────────────────────────────────────────────
const StepCustomer = ({ customers, customerId, setCustomerId, shipping, setShipping }) => {
  const [q, setQ] = useState('');
  const filtered = customers.filter(c =>
    !q.trim() || c.name.toLowerCase().includes(q.toLowerCase()) || c.address.toLowerCase().includes(q.toLowerCase())
  );
  const selected = customers.find(c => c.id === customerId);

  // Auto-populate shipping address when a customer is picked (if blank)
  React.useEffect(() => {
    if (selected && !shipping.address) {
      const admin = selected.operators.find(o => o.role === 'Admin') || selected.operators[0];
      setShipping({
        name: admin?.name || '',
        address: selected.address,
        method: 'Standard ground',
      });
    }
  }, [selected]);

  return (
    <div className="tds-card">
      <div className="tds-card__header">
        <div>
          <div className="tds-card__title">Choose customer</div>
          <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Orders are billed and shipped to the selected customer company.</div>
        </div>
      </div>
      <div className="tds-card__body">
        <Input prefix={<Icon name="search" size={14}/>} placeholder="Search customers…" value={q} onChange={e => setQ(e.target.value)} size="md"/>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflow: 'auto', border: '1px solid var(--color-border-default)', borderRadius: 10, padding: 6 }}>
          {filtered.length === 0 && <div className="empty" style={{ padding: 24 }}>No customers found.</div>}
          {filtered.map(c => {
            const on = c.id === customerId;
            return (
              <button key={c.id}
                onClick={() => setCustomerId(c.id)}
                className={`role-item ${on ? 'is-on' : ''}`}
                style={{ borderBottom: 'none', borderRadius: 8 }}>
                <CompanyLogo name={c.name} size={32}/>
                <div className="role-item__main">
                  <div className="role-item__name">{c.name}</div>
                  <div className="role-item__meta">{c.address.split(',').slice(-2).join(',').trim()} · {c.operators.length} operators</div>
                </div>
                <Badge tone={c.status === 'Active' ? 'success' : c.status === 'Onboarding' ? 'info' : 'error'} dot>{c.status}</Badge>
              </button>
            );
          })}
        </div>

        {selected && (
          <div style={{ marginTop: 18, padding: 14, background: 'var(--color-bg-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="truck" size={13}/> Shipping address
            </div>
            <div className="form-grid form-grid--2" style={{ gap: 14 }}>
              <Field label="Recipient">
                <Input value={shipping.name} onChange={e => setShipping({ ...shipping, name: e.target.value })} placeholder="Name"/>
              </Field>
              <Field label="Method">
                <Select value={shipping.method} onChange={e => setShipping({ ...shipping, method: e.target.value })}>
                  <option>Standard ground</option>
                  <option>Express overnight</option>
                  <option>International express</option>
                  <option>Freight</option>
                  <option>Customer pickup</option>
                </Select>
              </Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="Address">
                <Textarea value={shipping.address} onChange={e => setShipping({ ...shipping, address: e.target.value })} rows={2}/>
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Step 2 — Models & quantities ──────────────────────────────────────────
const ModelRow = ({ item, onChange, onRemove }) => {
  const model = DEVICE_MODELS.find(m => m.id === item.modelId);
  if (!model) return null;
  const total = model.unitPrice * item.qty;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 110px 110px 32px', gap: 12, alignItems: 'center', padding: '14px 16px', background: 'var(--color-bg-2)', border: '1px solid var(--color-border-default)', borderRadius: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'oklch(96% 0.04 80)', color: 'var(--color-warning-700)', display: 'grid', placeItems: 'center', flex: 'none' }}>
          <Icon name="pos" size={22}/>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.005em' }}>{model.name}</div>
          <div className="cust-meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.family} · {moneyUSD(model.unitPrice)} ea</div>
        </div>
      </div>
      <Select value={item.type} onChange={e => onChange({ ...item, type: e.target.value })}>
        {model.types.map(t => <option key={t}>{t}</option>)}
      </Select>
      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--color-border-default)', borderRadius: 8, background: 'var(--color-bg-2)' }}>
        <button className="iconbtn" style={{ borderRadius: '8px 0 0 8px' }} onClick={() => onChange({ ...item, qty: Math.max(1, item.qty - 1) })}><Icon name="minus" size={12}/></button>
        <input value={item.qty}
          onChange={e => onChange({ ...item, qty: Math.max(1, parseInt(e.target.value || '1', 10)) })}
          style={{ width: 40, border: 0, background: 'transparent', textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontSize: 14, color: 'var(--color-text-primary)', outline: 'none' }}/>
        <button className="iconbtn" style={{ borderRadius: '0 8px 8px 0' }} onClick={() => onChange({ ...item, qty: item.qty + 1 })}><Icon name="plus" size={12}/></button>
      </div>
      <div className="num" style={{ textAlign: 'right', fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{moneyUSD(total)}</div>
      <button className="iconbtn" onClick={onRemove} title="Remove"><Icon name="trash" size={14}/></button>
    </div>
  );
};

const StepModels = ({ items, setItems }) => {
  const [adderOpen, setAdderOpen] = useState(items.length === 0);

  const addModel = (modelId) => {
    const m = DEVICE_MODELS.find(x => x.id === modelId);
    if (!m) return;
    setItems([
      ...items,
      { id: `li-${Date.now()}`, modelId: m.id, modelName: m.name, unitPrice: m.unitPrice, qty: 1, type: m.types[0], devices: emptyDevices(1) },
    ]);
    setAdderOpen(false);
  };

  const updateItem = (idx, next) => {
    setItems(items.map((it, i) => i === idx ? { ...next, devices: emptyDevices(next.qty) } : it));
  };
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const available = DEVICE_MODELS.filter(m => !items.find(i => i.modelId === m.id));

  return (
    <div className="tds-card">
      <div className="tds-card__header">
        <div>
          <div className="tds-card__title">Models & quantities</div>
          <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Add one or more models. An order can contain any number of model lines.</div>
        </div>
      </div>
      <div className="tds-card__body">

        {/* Existing lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13, border: '1px dashed var(--color-border-default)', borderRadius: 10 }}>
              No models yet. Add your first model below.
            </div>
          )}
          {items.map((it, idx) => (
            <ModelRow key={it.id}
              item={it}
              onChange={(next) => updateItem(idx, next)}
              onRemove={() => removeItem(idx)}/>
          ))}
        </div>

        {/* Adder */}
        {adderOpen && available.length > 0 ? (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--color-bg-3)', border: '1px dashed var(--color-border-default)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 500 }}>Add a model</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {available.map(m => (
                <button key={m.id} onClick={() => addModel(m.id)}
                  className="role-item" style={{ borderRadius: 8, borderBottom: 'none', background: 'var(--color-bg-2)', border: '1px solid var(--color-border-default)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'oklch(96% 0.04 80)', color: 'var(--color-warning-700)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                    <Icon name="pos" size={18}/>
                  </div>
                  <div className="role-item__main">
                    <div className="role-item__name">{m.name}</div>
                    <div className="role-item__meta">{m.family} · {moneyUSD(m.unitPrice)} ea</div>
                  </div>
                  <Icon name="plus" size={14}/>
                </button>
              ))}
            </div>
            {items.length > 0 && (
              <div style={{ marginTop: 10, textAlign: 'right' }}>
                <Btn variant="ghost" size="sm" onClick={() => setAdderOpen(false)}>Done adding</Btn>
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <Btn variant="secondary" icon="plus" size="md" onClick={() => setAdderOpen(true)} disabled={available.length === 0}>
              Add another model
            </Btn>
            {available.length === 0 && <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--color-text-tertiary)' }}>All models added.</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Step 3 — Pricing & discount ───────────────────────────────────────────
const StepPricing = ({ subtotal, discountPct, setDiscountPct }) => {
  const discountAmount = subtotal * (discountPct / 100);
  const total = subtotal - discountAmount;
  const free = total <= 0;
  return (
    <div className="tds-card">
      <div className="tds-card__header">
        <div>
          <div className="tds-card__title">Pricing & discount</div>
          <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>You may apply any discount from 0% up to 100% (complimentary).</div>
        </div>
      </div>
      <div className="tds-card__body">

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
          {/* Slider + presets */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 500 }}>Discount</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <input type="number" min="0" max="100"
                value={discountPct}
                onChange={e => setDiscountPct(Math.max(0, Math.min(100, parseInt(e.target.value || '0', 10))))}
                style={{ width: 80, fontSize: 28, fontWeight: 600, padding: '4px 8px', border: '1px solid var(--color-border-default)', borderRadius: 8, fontFamily: 'inherit', color: 'var(--color-text-primary)', background: 'var(--color-bg-2)', fontVariantNumeric: 'tabular-nums' }}/>
              <span style={{ fontSize: 24, color: 'var(--color-text-secondary)', fontWeight: 500 }}>%</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-tertiary)' }}>off subtotal</span>
            </div>
            <input type="range" min="0" max="100" value={discountPct}
              onChange={e => setDiscountPct(parseInt(e.target.value, 10))}
              style={{ width: '100%', marginTop: 14, accentColor: 'var(--color-primary-700)' }}/>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              {[0, 5, 10, 25, 50, 100].map(p => (
                <button key={p}
                  onClick={() => setDiscountPct(p)}
                  className={`perm-fchip ${discountPct === p ? 'is-on' : ''}`}>
                  {p === 100 ? 'Free' : `${p}%`}
                </button>
              ))}
            </div>
            {free && (
              <div className="notice" style={{ marginTop: 16, background: 'var(--color-success-50)', borderColor: 'oklch(58% 0.14 152 / 0.25)', color: 'var(--color-success-700)' }}>
                <Icon name="sparkles" size={14}/>
                <div>
                  <strong>Complimentary order.</strong> No payment required — the order will skip <em>Awaiting payment</em> and go straight to <em>Awaiting shipment</em>.
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--color-bg-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 10 }}>Order total</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
                <span className="num">{moneyUSD(subtotal)}</span>
              </div>
              {discountPct > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--color-success-700)' }}>
                  <span>Discount ({discountPct}%)</span>
                  <span className="num">− {moneyUSD(discountAmount)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--color-border-default)', margin: '6px 0' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 600, alignItems: 'baseline' }}>
                <span>Total</span>
                <span className="num" style={{ color: free ? 'var(--color-success-700)' : 'var(--color-text-primary)' }}>{free ? 'FREE' : moneyUSD(total)}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                Next status: <strong style={{ color: free ? 'var(--color-info-700)' : 'var(--color-warning-700)' }}>{free ? 'Awaiting shipment' : 'Awaiting payment'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Step 4 — Review ───────────────────────────────────────────────────────
const StepReview = ({ customer, items, discountPct, shipping, notes, setNotes }) => {
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
  const total = subtotal * (1 - discountPct / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="tds-card">
        <div className="tds-card__header"><div className="tds-card__title">Review order</div></div>
        <div className="tds-card__body">
          <dl className="kvgrid" style={{ gridTemplateColumns: '120px 1fr' }}>
            <dt>Customer</dt><dd style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CompanyLogo name={customer.name} size={24}/> <strong>{customer.name}</strong>
            </dd>
            <dt>Ship to</dt><dd>{shipping.name} · {shipping.method}<br/><span style={{ color: 'var(--color-text-tertiary)' }}>{shipping.address}</span></dd>
          </dl>
        </div>
      </div>

      <div className="tds-card">
        <div className="tds-card__header"><div className="tds-card__title">Line items</div></div>
        <div style={{ padding: 0 }}>
          <table className="tds-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Unit</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id}>
                  <td><strong>{i.modelName}</strong></td>
                  <td>{i.type}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{moneyUSD(i.unitPrice)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{i.qty}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{moneyUSD(i.unitPrice * i.qty)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>Subtotal</td>
                <td className="num" style={{ textAlign: 'right' }}>{moneyUSD(subtotal)}</td>
              </tr>
              {discountPct > 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'right', color: 'var(--color-success-700)' }}>Discount ({discountPct}%)</td>
                  <td className="num" style={{ textAlign: 'right', color: 'var(--color-success-700)' }}>− {moneyUSD(subtotal * discountPct / 100)}</td>
                </tr>
              )}
              <tr>
                <td colSpan="4" style={{ textAlign: 'right', fontWeight: 600, fontSize: 15 }}>Total</td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 600, fontSize: 15, color: total === 0 ? 'var(--color-success-700)' : 'var(--color-text-primary)' }}>
                  {total === 0 ? 'FREE' : moneyUSD(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="tds-card">
        <div className="tds-card__body">
          <Field label="Internal notes" hint="Visible only to Carbon staff.">
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional — e.g. quarterly refresh batch, evaluation units…"/>
          </Field>
        </div>
      </div>
    </div>
  );
};

// ─── Wizard shell ──────────────────────────────────────────────────────────
const OrderWizard = ({ customers, onCancel, onComplete }) => {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [shipping, setShipping] = useState({ name: '', address: '', method: 'Standard ground' });
  const [items, setItems] = useState([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [notes, setNotes] = useState('');

  const customer = customers.find(c => c.id === customerId);
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
  const total = subtotal * (1 - discountPct / 100);

  const canNext = useMemo(() => {
    if (step === 1) return !!customerId && !!shipping.address.trim();
    if (step === 2) return items.length > 0 && items.every(i => i.qty > 0);
    if (step === 3) return true;
    return true;
  }, [step, customerId, shipping, items]);

  const submit = () => {
    if (!customer) return;
    const num = `SO-2026-${String(200 + Math.floor(Math.random() * 99)).padStart(4, '0')}`;
    const status = total === 0 ? 'Awaiting shipment' : 'Awaiting payment';
    const order = {
      id: 'o-' + Math.random().toString(36).slice(2, 8),
      number: num,
      customerId: customer.id,
      customerName: customer.name,
      createdAt: new Date().toISOString(),
      createdBy: 'jordan.d@carbon',
      status,
      items: items.map(i => ({ ...i, devices: emptyDevices(i.qty) })),
      discountPct,
      notes,
      shipping,
      events: [
        { at: new Date().toISOString(), kind: 'created', by: 'jordan.d@carbon', text: 'Order created' },
        ...(total === 0 ? [{ at: new Date().toISOString(), kind: 'free', by: 'jordan.d@carbon', text: 'Marked as complimentary · 100% discount' }] : [{ at: new Date().toISOString(), kind: 'invoice', by: 'system', text: 'Invoice issued' }]),
      ],
    };
    toast({ kind: 'success', title: `Order ${num} created`, msg: status === 'Awaiting payment' ? 'Invoice issued · awaiting payment' : 'No payment required · ready to ship' });
    onComplete(order);
  };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">New sample order</h1>
          <p className="page__sub">Create a sample device order for a customer company.</p>
        </div>
        <div className="page__actions">
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>

      <OrderStepper step={step}/>

      <div className="wizard-grid">
        <div>
          {step === 1 && <StepCustomer customers={customers} customerId={customerId} setCustomerId={setCustomerId} shipping={shipping} setShipping={setShipping}/>}
          {step === 2 && <StepModels items={items} setItems={setItems}/>}
          {step === 3 && <StepPricing subtotal={subtotal} discountPct={discountPct} setDiscountPct={setDiscountPct}/>}
          {step === 4 && customer && <StepReview customer={customer} items={items} discountPct={discountPct} shipping={shipping} notes={notes} setNotes={setNotes}/>}

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between' }}>
            <Btn variant="ghost" disabled={step === 1} onClick={() => setStep(s => Math.max(1, s - 1))} icon="chevL">Back</Btn>
            {step < 4 ? (
              <Btn variant="primary" disabled={!canNext} onClick={() => setStep(s => s + 1)} iconRight="chevR">Continue</Btn>
            ) : (
              <Btn variant="primary" icon="check" onClick={submit}>Create order</Btn>
            )}
          </div>
        </div>

        {/* Summary aside */}
        <aside className="wizard-aside">
          <h4>Order summary</h4>
          <dl>
            <dt>Customer</dt><dd>{customer ? customer.name : <span className="muted">—</span>}</dd>
            <dt>Models</dt><dd>{items.length === 0 ? <span className="muted">—</span> : `${items.length} model${items.length === 1 ? '' : 's'}`}</dd>
            <dt>Units</dt><dd className="num">{items.reduce((n, i) => n + i.qty, 0)}</dd>
            <dt>Subtotal</dt><dd className="num">{moneyUSD(subtotal)}</dd>
            {discountPct > 0 && <><dt>Discount</dt><dd className="num" style={{ color: 'var(--color-success-700)' }}>− {moneyUSD(subtotal * discountPct / 100)}</dd></>}
            <dt style={{ paddingTop: 6, borderTop: '1px solid var(--color-border-subtle)' }}>Total</dt>
            <dd style={{ paddingTop: 6, borderTop: '1px solid var(--color-border-subtle)', fontWeight: 600, color: total === 0 ? 'var(--color-success-700)' : 'var(--color-text-primary)' }} className="num">
              {total === 0 ? 'FREE' : moneyUSD(total)}
            </dd>
          </dl>
          <div style={{ marginTop: 14, padding: 10, background: 'var(--color-bg-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 8, fontSize: 11.5, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Next:</strong> once created, the warehouse team will activate each device and enter its serial number plus six activation codes before shipping.
          </div>
        </aside>
      </div>
    </div>
  );
};

window.OrderWizard = OrderWizard;
