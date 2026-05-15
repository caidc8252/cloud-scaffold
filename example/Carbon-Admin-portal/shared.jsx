/* global React */
const { useState, useEffect, useRef, createContext, useContext } = React;

// ─── Icons (inline SVG, currentColor) ──────────────────────
const Icon = ({ name, size = 16, ...rest }) => {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    users:        <g {...stroke}><circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9.5" r="2.4"/><path d="M21 17.5c0-2.2-1.8-4-4-4"/></g>,
    file:         <g {...stroke}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></g>,
    operator:     <g {...stroke}><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"/></g>,
    audit:        <g {...stroke}><path d="M4 5h12l4 4v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M7 11h8M7 15h5"/></g>,
    settings:     <g {...stroke}><circle cx="12" cy="12" r="2.6"/><path d="M19.4 14a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></g>,
    home:         <g {...stroke}><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></g>,
    search:       <g {...stroke}><circle cx="11" cy="11" r="6"/><path d="m20 20-4.3-4.3"/></g>,
    plus:         <g {...stroke}><path d="M12 5v14M5 12h14"/></g>,
    chevR:        <g {...stroke}><path d="m9 6 6 6-6 6"/></g>,
    chevL:        <g {...stroke}><path d="m15 6-6 6 6 6"/></g>,
    chevD:        <g {...stroke}><path d="m6 9 6 6 6-6"/></g>,
    check:        <g {...stroke}><path d="m5 12 4.5 4.5L19 7"/></g>,
    x:            <g {...stroke}><path d="m6 6 12 12M18 6 6 18"/></g>,
    more:         <g {...stroke}><circle cx="12" cy="6" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="18" r="1"/></g>,
    edit:         <g {...stroke}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></g>,
    copy:         <g {...stroke}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></g>,
    mail:         <g {...stroke}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></g>,
    link:         <g {...stroke}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></g>,
    info:         <g {...stroke}><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></g>,
    trash:        <g {...stroke}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></g>,
    eye:          <g {...stroke}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></g>,
    eyeOff:       <g {...stroke}><path d="M3 3l18 18"/><path d="M10.6 6.1A10.3 10.3 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.3 3.9M6.1 6.1A17 17 0 0 0 2 12s4 6 10 6a10 10 0 0 0 4-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></g>,
    shield:       <g {...stroke}><path d="M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6z"/></g>,
    clock:        <g {...stroke}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>,
    download:     <g {...stroke}><path d="M12 4v12M7 11l5 5 5-5M5 20h14"/></g>,
    bell:         <g {...stroke}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></g>,
    filter:       <g {...stroke}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></g>,
    package:      <g {...stroke}><path d="m3.3 7 8.7 5 8.7-5M12 22V12M21 7v10l-9 5-9-5V7l9-5z"/><path d="m7.5 4.5 9 5"/></g>,
    truck:        <g {...stroke}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7.5" cy="18" r="1.7"/><circle cx="17" cy="18" r="1.7"/></g>,
    cash:         <g {...stroke}><rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M5.5 9.5h.01M18.5 14.5h.01"/></g>,
    pos:          <g {...stroke}><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M5 7h14M8 11h8M8 15h5"/></g>,
    minus:        <g {...stroke}><path d="M5 12h14"/></g>,
    gift:         <g {...stroke}><rect x="3.5" y="9" width="17" height="5"/><path d="M5 14v7h14v-7M12 9v12M12 9c-2 0-4-1-4-3a2 2 0 0 1 4 0c0 2 2 3 4 3a2 2 0 1 0-4-3"/></g>,
    sparkles:     <g {...stroke}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></g>,
    monitor:      <g {...stroke}><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17v4"/></g>,
    upload:       <g {...stroke}><path d="M12 4v12M7 9l5-5 5 5M5 20h14"/></g>,
    image:        <g {...stroke}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m3 17 5-5 4 4 3-3 6 6"/></g>,
    rotate:       <g {...stroke}><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/></g>,
    cpu:          <g {...stroke}><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></g>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" {...rest}>{paths[name] || null}</svg>;
};

// ─── Badge ────────────────────────────────────────────────
const Badge = ({ tone = 'neutral', children, dot }) => (
  <span className={`tds-badge tds-badge--${tone}`}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 2 }}/>}
    {children}
  </span>
);

// ─── Contract badge w/ status ─────────────────────────────
const CONTRACT_INFO = {
  ISV:      { label: 'ISV',      desc: 'Independent Software Vendor', icon: 'isv',      hue: 'accent' },
  ISO:      { label: 'ISO',      desc: 'Independent Sales Organization', icon: 'iso',   hue: 'info' },
  Acquirer: { label: 'Acquirer', desc: 'Merchant acquirer', icon: 'acquirer', hue: 'success' },
  PayFac:   { label: 'PayFac',   desc: 'Payment facilitator', icon: 'payfac', hue: 'warning' },
};

const STATUS_TONE = {
  Active:   'success',
  Signed:   'success',
  Pending:  'warning',
  Terminated: 'error',
  Expired:  'neutral',
};

const ContractBadge = ({ kind, status = 'Active' }) => {
  const tone = STATUS_TONE[status] || 'neutral';
  return (
    <span className={`tds-badge tds-badge--${tone}`} title={`${kind} · ${status}`}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }}/>
      {kind}
      {status !== 'Active' && status !== 'Signed' && status !== kind && <span style={{ opacity: 0.7, marginLeft: 2 }}>· {status}</span>}
    </span>
  );
};

// ─── Buttons ──────────────────────────────────────────────
const Btn = ({ variant = 'secondary', size = 'md', loading, icon, iconRight, children, ...rest }) => (
  <button className={`tds-btn tds-btn--${variant} tds-btn--${size}`} {...rest}>
    {loading && <span className="tds-btn__spinner"/>}
    {!loading && icon && <Icon name={icon} size={size === 'sm' ? 13 : 14}/>}
    {children}
    {iconRight && <Icon name={iconRight} size={size === 'sm' ? 13 : 14}/>}
  </button>
);

// ─── Input + Field ───────────────────────────────────────
const Input = ({ size = 'md', invalid, prefix, suffix, ...rest }) => (
  <div className={`tds-input tds-input--${size} ${invalid ? 'tds-input--invalid' : ''}`}>
    {prefix && <span className="tds-input__addon tds-input__addon--prefix">{prefix}</span>}
    <input className="tds-input__el" {...rest}/>
    {suffix && <span className="tds-input__addon tds-input__addon--suffix">{suffix}</span>}
  </div>
);

const Field = ({ label, hint, error, required, children }) => (
  <label className="tds-field">
    {label && <span className={`tds-field__label ${required ? 'tds-field__label--required' : ''}`}>{label}</span>}
    {children}
    {error && <span className="tds-field__error">{error}</span>}
    {!error && hint && <span className="tds-field__hint">{hint}</span>}
  </label>
);

const Textarea = ({ invalid, ...rest }) => (
  <textarea className="textarea" style={invalid ? { borderColor: 'var(--color-error-500)' } : null} {...rest}/>
);

const Select = ({ size = 'md', children, ...rest }) => (
  <div className={`tds-select tds-select--${size}`}>
    <select {...rest}>{children}</select>
    <span className="tds-select__chevron"><Icon name="chevD" size={14}/></span>
  </div>
);

// ─── Modal ────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, footer, width = 480 }) => {
  if (!open) return null;
  return (
    <div className="tds-modal-overlay" onClick={onClose}>
      <div className="tds-modal" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className="tds-modal__header">
          <h3 className="tds-modal__title">{title}</h3>
          <button className="iconbtn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="tds-modal__body">{children}</div>
        {footer && <div className="tds-modal__footer">{footer}</div>}
      </div>
    </div>
  );
};

// ─── Toasts ───────────────────────────────────────────────
const ToastCtx = createContext(null);
const ToastProvider = ({ children }) => {
  const [list, setList] = useState([]);
  const push = (t) => {
    const id = Math.random().toString(36).slice(2);
    setList(l => [...l, { id, ...t }]);
    setTimeout(() => setList(l => l.filter(x => x.id !== id)), t.timeout || 3200);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="tds-toast-stack">
        {list.map(t => (
          <div key={t.id} className={`tds-toast tds-toast--${t.kind || 'info'}`}>
            <div className="tds-toast__icon">
              <Icon name={t.kind === 'success' ? 'check' : t.kind === 'error' ? 'x' : t.kind === 'warning' ? 'info' : 'info'} size={18}/>
            </div>
            <div className="tds-toast__body">
              <div className="tds-toast__title">{t.title}</div>
              {t.msg && <div className="tds-toast__msg">{t.msg}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};
const useToast = () => useContext(ToastCtx);

// ─── Avatar / company logo ────────────────────────────────
const HUES = [
  ['#5B7CFA', '#3D5BC9'],
  ['#7A5BFA', '#5A3DC9'],
  ['#13A47A', '#0F8060'],
  ['#D17A3A', '#A65A22'],
  ['#3A99D1', '#1F6FA8'],
  ['#C24E8B', '#962F66'],
];
const hueFor = (name) => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return HUES[h % HUES.length];
};
const CompanyLogo = ({ name, size = 32, square = true }) => {
  const [a, b] = hueFor(name);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  return (
    <span className="cust-avatar" style={{ width: size, height: size, borderRadius: square ? 8 : '50%', background: `linear-gradient(135deg, ${a}, ${b})`, fontSize: size * 0.36 }}>{initials}</span>
  );
};

// ─── Masking helpers (EO 14117 / GDPR) ────────────────────
const maskEmail = (e) => {
  if (!e) return '';
  const [u, d] = e.split('@');
  const head = u.slice(0, 1);
  return `${head}${'•'.repeat(Math.max(3, u.length - 1))}@${d}`;
};
const maskPhone = (p) => {
  if (!p) return '';
  return p.replace(/(\+?\d{1,3})[\s-]?(\d{2,4})[\s-]?(\d{2,4})[\s-]?(\d{2,4})/, (_, a, _b, _c, d) => `${a} ••• ••• ${d}`);
};
const maskName = (n) => {
  if (!n) return '';
  const parts = n.split(' ');
  return parts.map((p, i) => i === 0 ? p : p[0] + '.').join(' ');
};

// ─── Relative time ───────────────────────────────────────
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const fmtDateTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const relTime = (iso) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff/86400)}d ago`;
  return fmtDate(iso);
};

Object.assign(window, {
  Icon, Badge, ContractBadge, Btn, Input, Field, Textarea, Select, Modal,
  ToastProvider, useToast, CompanyLogo,
  CONTRACT_INFO, STATUS_TONE,
  maskEmail, maskPhone, maskName, fmtDate, fmtDateTime, relTime,
});
