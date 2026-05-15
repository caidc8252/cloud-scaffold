/* global React */
// ─────────────────────────────────────────────────────────────
// Carbon ISV Console — Shell components
// ─────────────────────────────────────────────────────────────

const { useState, useEffect, useRef, useMemo } = React;

// ─── Icons ─────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = 1.5, fill = "none", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const I = {
  home:    <><path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/></>,
  app:     <><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></>,
  package: <><path d="M3 8 12 3l9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v10"/></>,
  device:  <><rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="17.5" r="0.6" fill="currentColor"/></>,
  store:   <><path d="M3 9l1.5-5h15L21 9"/><path d="M5 9v11h14V9"/><path d="M9 20v-5h6v5"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
  search:  <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  bell:    <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  more:    <><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></>,
  chevd:   <><path d="m6 9 6 6 6-6"/></>,
  chevr:   <><path d="m9 6 6 6-6 6"/></>,
  chevl:   <><path d="m15 6-6 6 6 6"/></>,
  chevu:   <><path d="m6 15 6-6 6 6"/></>,
  plus:    <><path d="M12 5v14M5 12h14"/></>,
  check:   <><path d="m4.5 12.5 5 5 10-11"/></>,
  x:       <><path d="M6 6l12 12M18 6 6 18"/></>,
  external:<><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></>,
  download:<><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></>,
  upload:  <><path d="M12 20V8"/><path d="m7 13 5-5 5 5"/><path d="M5 4h14"/></>,
  refresh: <><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 4v4h-4"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 20v-4h4"/></>,
  filter:  <><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>,
  copy:    <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></>,
  edit:    <><path d="M4 20h4l11-11-4-4L4 16z"/><path d="m14 6 4 4"/></>,
  trash:   <><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></>,
  alert:   <><path d="M12 9v4M12 17h0"/><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></>,
  info:    <><circle cx="12" cy="12" r="9"/><path d="M12 8h0M11 12h1v5h1"/></>,
  shield:  <><path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6z"/></>,
  shieldCheck: <><path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></>,
  arrowR:  <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  arrowL:  <><path d="M19 12H5M11 6l-6 6 6 6"/></>,
  sparkle: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6" opacity="0.6"/><path d="m6 6 3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" opacity="0.6"/></>,
  doc:     <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></>,
  bolt:    <><path d="m13 3-9 12h7l-1 6 9-12h-7z"/></>,
  users:   <><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/></>,
  image:   <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 17 5-5 5 5 4-4 4 4"/></>,
  link:    <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></>,
  cpu:     <><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6" rx="0.5"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></>,
  cloud:   <><path d="M7 18a5 5 0 1 1 1.5-9.8A6 6 0 0 1 20 12a4 4 0 0 1-1 8z"/></>,
  pin:     <><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></>,
};

const Ico = ({ name, size = 16, stroke = 1.5, style }) => (
  <Icon d={I[name]} size={size} stroke={stroke} style={style} />
);
window.Ico = Ico;

// ─── Sidebar ────────────────────────────────────────────────
function Sidebar({ route, navigate }) {
  const items = [
    { id: "home",      icon: "home",    label: "Home" },
    { id: "apps",      icon: "app",     label: "Apps",           count: window.APPS?.length },
    { id: "versions",  icon: "package", label: "Versions",       count: 21 },
    { id: "devices",   icon: "device",  label: "Device Models",  count: 8 },
    { id: "merchants", icon: "store",   label: "Merchants",      count: 187 },
    { id: "settings",  icon: "settings",label: "Settings" },
  ];
  const isActive = (id) => id === "apps" ? route.screen.startsWith("app") : route.screen === id;

  return (
    <aside style={{
      width: 224, flexShrink: 0, background: "var(--bg-sunken)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column",
      padding: "12px 8px",
    }}>
      {/* Brand lockup */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 14px" }}>
        <img src="assets/toms-logo.png" alt="TOMS" width="22" height="22"
             style={{ flexShrink: 0, display: "block" }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em", color: "var(--brand-mono)" }}>TOMS</span>
          <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--fg-tertiary)",
            padding: "1px 5px", border: "1px solid var(--border-default)", borderRadius: 3,
            letterSpacing: "0.04em", textTransform: "uppercase" }}>Carbon</span>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg-tertiary)", padding: "2px 6px",
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 4 }}>
          ISV
        </span>
      </div>

      {/* Tenant pill */}
      <button style={{
        margin: "2px 4px 12px", padding: "7px 9px",
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--bg-surface)", border: "1px solid var(--border-default)",
        borderRadius: 7, color: "var(--fg-primary)", fontSize: 12.5, textAlign: "left",
        boxShadow: "var(--shadow-xs)",
      }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: "var(--brand-mono)",
          color: "white", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>A</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, lineHeight: 1.1 }} className="tm-truncate">Acme Software Inc.</div>
          <div style={{ fontSize: 10.5, color: "var(--fg-tertiary)", marginTop: 1 }}>ISV · Publisher</div>
        </div>
        <Ico name="chevd" size={12} style={{ opacity: 0.5 }} />
      </button>

      {/* Primary nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map((it) => {
          const active = isActive(it.id);
          return (
            <a key={it.id} href="#" onClick={(e) => { e.preventDefault(); navigate({ screen: it.id }); }} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "5.5px 10px", borderRadius: 6,
              fontSize: 12.5, fontWeight: active ? 500 : 400,
              color: active ? "var(--fg-primary)" : "var(--fg-secondary)",
              background: active ? "var(--bg-active)" : "transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}>
              <Ico name={it.icon} size={15} stroke={active ? 1.7 : 1.5} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.count != null && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg-tertiary)",
                  fontFamily: "var(--font-mono)" }}>{it.count}</span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Quick links */}
      <div style={{ marginTop: 18, padding: "6px 10px 4px", fontSize: 10.5,
        color: "var(--fg-quaternary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
        Recent
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {[
          { id: "r1", label: "Loyalty+ · 1.4.0-rc1", state: "warning" },
          { id: "r2", label: "Acme POS Pro · 4.3.2", state: "success" },
          { id: "r3", label: "Stockroom · 2.1.2",   state: null },
        ].map((p) => (
          <a key={p.id} href="#" style={{
            display: "flex", alignItems: "center", gap: 8, padding: "5px 10px",
            borderRadius: 6, fontSize: 12, color: "var(--fg-secondary)", textDecoration: "none",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%",
              background: p.state === "success" ? "var(--success)"
                       : p.state === "warning" ? "var(--warning)"
                       : "var(--fg-quaternary)" }} />
            <span className="tm-truncate" style={{ flex: 1 }}>{p.label}</span>
          </a>
        ))}
      </nav>

      {/* Footer user */}
      <div style={{ marginTop: "auto", padding: "10px 8px",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%",
          background: "var(--brand-mono)", color: "white",
          display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600 }}>MH</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500 }} className="tm-truncate">Maya Hassan</div>
          <div style={{ fontSize: 10.5, color: "var(--fg-tertiary)" }}>Publisher · Acme</div>
        </div>
        <button style={{ color: "var(--fg-tertiary)", padding: 4 }} title="Account">
          <Ico name="chevd" size={13} />
        </button>
      </div>
    </aside>
  );
}

// ─── Top bar ───────────────────────────────────────────────
function TopBar({ crumbs, actions }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 18px",
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)",
      fontSize: 12, color: "var(--fg-tertiary)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0, overflow: "hidden" }}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Ico name="chevr" size={11} style={{ opacity: 0.5, flexShrink: 0 }} />}
            {c.href ? (
              <a href="#" onClick={(e) => { e.preventDefault(); c.onClick && c.onClick(); }}
                 style={{ color: i === crumbs.length - 1 ? "var(--fg-secondary)" : "inherit",
                          textDecoration: "none", whiteSpace: "nowrap",
                          fontFamily: c.mono ? "var(--font-mono)" : undefined,
                          fontWeight: i === crumbs.length - 1 ? 500 : 400 }}>{c.label}</a>
            ) : (
              <span style={{ color: i === crumbs.length - 1 ? "var(--fg-secondary)" : "inherit",
                             whiteSpace: "nowrap",
                             fontFamily: c.mono ? "var(--font-mono)" : undefined,
                             fontWeight: i === crumbs.length - 1 ? 500 : 400 }}>{c.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <button style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "3px 8px", borderRadius: 5,
        background: "var(--bg-sunken)", color: "var(--fg-tertiary)",
        fontSize: 11.5, border: "1px solid var(--border-subtle)",
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        <Ico name="search" size={12} />
        <span>Search apps, versions, merchants…</span>
        <span className="mono" style={{ marginLeft: 6, opacity: 0.7 }}>⌘K</span>
      </button>
      <button style={{ padding: 4, color: "var(--fg-tertiary)" }} title="Notifications">
        <Ico name="bell" size={15} />
      </button>
      {actions}
    </div>
  );
}

// ─── Buttons ───────────────────────────────────────────────
function Button({ children, primary, danger, ghost, icon, iconRight, onClick, disabled, size = "md", type, style }) {
  const sizeMap = {
    sm: { pad: "3px 8px",  fs: 11.5, gap: 5 },
    md: { pad: "5.5px 11px", fs: 12.5, gap: 6 },
    lg: { pad: "8px 14px", fs: 13.5, gap: 7 },
  };
  const s = sizeMap[size];
  return (
    <button onClick={onClick} disabled={disabled} type={type} style={{
      display: "inline-flex", alignItems: "center", gap: s.gap,
      padding: s.pad, borderRadius: 6, fontSize: s.fs, fontWeight: 500,
      border: "1px solid",
      borderColor: ghost ? "transparent"
                  : primary ? "transparent"
                  : "var(--border-default)",
      background: ghost ? "transparent"
                : primary ? "var(--accent-gradient)"
                : danger  ? "var(--bg-surface)"
                : "var(--bg-surface)",
      color: primary ? "var(--fg-on-accent)"
            : danger  ? "var(--danger)"
            : "var(--fg-primary)",
      boxShadow: primary
        ? "inset 0 1px 0 oklch(100% 0 0 / .12), 0 1px 2px oklch(0% 0 0 / .25), 0 0 0 0.5px oklch(0% 0 0 / .4)"
        : ghost ? "none"
        : "var(--shadow-xs)",
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
      whiteSpace: "nowrap",
      ...(style || {}),
    }}>
      {icon && <Ico name={icon} size={s.fs - 0.5} />}
      {children}
      {iconRight && <Ico name={iconRight} size={s.fs - 0.5} />}
    </button>
  );
}

// ─── Pill ──────────────────────────────────────────────────
function Pill({ tone = "neutral", children, dot, size = "md" }) {
  const toneMap = {
    success: { bg: "var(--success-bg)", fg: "var(--success)" },
    warning: { bg: "var(--warning-bg)", fg: "var(--warning)" },
    danger:  { bg: "var(--danger-bg)",  fg: "var(--danger)"  },
    info:    { bg: "var(--info-bg)",    fg: "var(--info)"    },
    accent:  { bg: "var(--accent-50)",  fg: "var(--accent-700)"},
    neutral: { bg: "var(--bg-sunken)",  fg: "var(--fg-secondary)" },
  };
  const t = toneMap[tone];
  const sizes = { sm: { pad: "1px 6px", fs: 10 }, md: { pad: "1.5px 7px", fs: 10.5 }, lg: { pad: "2.5px 9px", fs: 11.5 } };
  const s = sizes[size];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: s.pad, borderRadius: 999,
      fontSize: s.fs, fontWeight: 500,
      background: t.bg, color: t.fg, lineHeight: 1.4, whiteSpace: "nowrap",
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.fg }} />}
      {children}
    </span>
  );
}

// ─── Card ──────────────────────────────────────────────────
function Card({ title, hint, action, children, padding = 16, style }) {
  return (
    <section style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 10,
      ...style,
    }}>
      {(title || action) && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "11px 14px 10px",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <h3 style={{ fontSize: 12.5, fontWeight: 600, margin: 0, letterSpacing: "-0.005em", whiteSpace: "nowrap" }}>{title}</h3>
          {hint && <span style={{ fontSize: 11, color: "var(--fg-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hint}</span>}
          <div style={{ marginLeft: "auto", flexShrink: 0 }}>{action}</div>
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </section>
  );
}

// ─── Field row (label + control) ───────────────────────────
function Field({ label, hint, error, required, children, layout = "stack" }) {
  return (
    <label style={{ display: "flex",
      flexDirection: layout === "stack" ? "column" : "row",
      gap: layout === "stack" ? 6 : 12,
      alignItems: layout === "stack" ? "stretch" : "center" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: layout === "row" ? 160 : undefined }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-primary)" }}>{label}</span>
        {required && <span style={{ color: "var(--danger)", fontSize: 11 }}>*</span>}
        {hint && layout === "stack" && <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>{hint}</span>}
      </div>
      <div style={{ flex: 1 }}>
        {children}
        {error && <div style={{ marginTop: 4, fontSize: 11, color: "var(--danger)" }}>{error}</div>}
      </div>
    </label>
  );
}

function Input({ value, onChange, placeholder, mono, prefix, suffix, error, style, type = "text", ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center",
      border: "1px solid",
      borderColor: error ? "var(--danger)" : focus ? "var(--accent-500)" : "var(--border-default)",
      borderRadius: 6,
      background: "var(--bg-surface)",
      padding: "0 8px",
      boxShadow: focus ? "0 0 0 3px oklch(58% 0.22 270 / 0.15)" : "none",
      transition: "box-shadow .1s, border-color .1s",
      ...style,
    }}>
      {prefix && <span style={{ fontSize: 12, color: "var(--fg-tertiary)", marginRight: 6,
        fontFamily: mono ? "var(--font-mono)" : undefined }}>{prefix}</span>}
      <input value={value || ""} onChange={onChange} placeholder={placeholder} type={type}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          flex: 1, border: 0, outline: 0, background: "transparent",
          padding: "6px 0", fontSize: 12.5,
          fontFamily: mono ? "var(--font-mono)" : "inherit", color: "var(--fg-primary)",
        }} {...rest} />
      {suffix && <span style={{ fontSize: 12, color: "var(--fg-tertiary)", marginLeft: 6 }}>{suffix}</span>}
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4, style }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea value={value || ""} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        width: "100%", padding: "8px 10px", fontSize: 12.5,
        border: "1px solid", borderColor: focus ? "var(--accent-500)" : "var(--border-default)",
        borderRadius: 6, background: "var(--bg-surface)", color: "var(--fg-primary)",
        outline: 0, resize: "vertical", lineHeight: 1.5,
        boxShadow: focus ? "0 0 0 3px oklch(58% 0.22 270 / 0.15)" : "none",
        fontFamily: "inherit",
        ...style,
      }} />
  );
}

// ─── KV grid: rows of label + value ────────────────────────
function KV({ label, value, mono, copy }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 12, padding: "8px 0",
      borderBottom: "1px dashed var(--border-subtle)",
    }}>
      <div style={{ width: 150, fontSize: 11.5, color: "var(--fg-tertiary)", flexShrink: 0 }}>{label}</div>
      <div style={{
        flex: 1, fontSize: 12.5, fontWeight: 450, color: "var(--fg-primary)",
        fontFamily: mono ? "var(--font-mono)" : undefined,
        wordBreak: "break-word",
      }}>{value}</div>
      {copy && (
        <button style={{ color: "var(--fg-quaternary)", padding: 2, opacity: 0.6 }} title="Copy">
          <Ico name="copy" size={12} />
        </button>
      )}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────
function Empty({ title, body, icon = "doc", action }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 8, padding: "48px 24px", textAlign: "center",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: "var(--bg-sunken)", color: "var(--fg-tertiary)",
        display: "grid", placeItems: "center",
        border: "1px solid var(--border-subtle)",
      }}>
        <Ico name={icon} size={18} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      {body && <div style={{ fontSize: 12, color: "var(--fg-tertiary)", maxWidth: 360 }}>{body}</div>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}

// ─── Drawer (slide-from-right panel) ──────────────────────
function Drawer({ open, onClose, width = 720, title, subtitle, footer, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "oklch(0% 0 0 / 0.35)",
        backdropFilter: "blur(2px)",
        animation: "carbonFade .15s ease-out",
      }} />
      <aside style={{
        position: "absolute", top: 0, right: 0, bottom: 0,
        width, maxWidth: "92vw",
        background: "var(--bg-surface)",
        boxShadow: "var(--shadow-lg)",
        display: "flex", flexDirection: "column",
        animation: "carbonSlide .2s cubic-bezier(.2,.7,.2,1)",
      }}>
        {(title || subtitle) && (
          <header style={{
            padding: "14px 18px 12px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              {title && <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h2>}
              {subtitle && <div style={{ marginTop: 3, fontSize: 12, color: "var(--fg-tertiary)" }}>{subtitle}</div>}
            </div>
            <button onClick={onClose} style={{ padding: 6, color: "var(--fg-tertiary)", borderRadius: 6 }} title="Close">
              <Ico name="x" size={15} />
            </button>
          </header>
        )}
        <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
        {footer && (
          <footer style={{
            padding: "12px 18px",
            borderTop: "1px solid var(--border-subtle)",
            background: "var(--bg-sunken)",
            display: "flex", alignItems: "center", gap: 8,
          }}>{footer}</footer>
        )}
      </aside>
      <style>{`
        @keyframes carbonSlide { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes carbonFade  { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const tone = toast.tone || "success";
  const toneColor = tone === "success" ? "var(--success)" : tone === "danger" ? "var(--danger)" : "var(--accent-500)";
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 200,
      background: "var(--bg-surface)", border: "1px solid var(--border-default)",
      borderRadius: 10, boxShadow: "var(--shadow-lg)",
      padding: "10px 12px 10px 10px",
      display: "flex", alignItems: "center", gap: 10,
      minWidth: 260, maxWidth: 360,
      animation: "carbonToast .25s ease-out",
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 6,
        background: tone === "success" ? "var(--success-bg)" : tone === "danger" ? "var(--danger-bg)" : "var(--accent-50)",
        color: toneColor, display: "grid", placeItems: "center",
      }}>
        <Ico name={tone === "success" ? "check" : tone === "danger" ? "alert" : "info"} size={14} stroke={2} />
      </div>
      <div style={{ flex: 1, fontSize: 12.5 }}>{toast.message}</div>
      <button onClick={onClose} style={{ color: "var(--fg-tertiary)", padding: 4 }}>
        <Ico name="x" size={13} />
      </button>
      <style>{`@keyframes carbonToast { from { transform: translateY(10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
    </div>
  );
}

// ─── Severity bar (used in scan summary) ───────────────────
function SeverityBar({ counts, height = 6 }) {
  const order = ["critical", "high", "medium", "low", "info"];
  const total = order.reduce((s, k) => s + (counts[k] || 0), 0);
  if (!total) {
    return (
      <div style={{ height, borderRadius: 999, background: "var(--success-bg)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", height, borderRadius: 999, overflow: "hidden",
      background: "var(--bg-sunken)" }}>
      {order.map(k => {
        const v = counts[k] || 0;
        if (!v) return null;
        return <div key={k} style={{
          width: `${(v / total) * 100}%`,
          background: window.SEVERITY[k].color,
        }} title={`${window.SEVERITY[k].label}: ${v}`} />;
      })}
    </div>
  );
}

Object.assign(window, {
  Sidebar, TopBar, Button, Pill, Card, Field, Input, Textarea, KV, Empty, Drawer, Toast, SeverityBar,
});
