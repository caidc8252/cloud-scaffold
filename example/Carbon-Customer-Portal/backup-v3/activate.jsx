/* global React, Ico, Badge, Button, Card, Input, PageHeader */
// ─────────────────────────────────────────────────────────────
// Sample Activation — simplified
// Top:    6-digit code entry → check ISV → auto-bind → fire update cmd (fire & forget)
// Bottom: history list of already-activated devices
// ─────────────────────────────────────────────────────────────

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA, useMemo: useMemoA } = React;

// Pull shell primitives off window — Babel scripts don't share scope.
const { Ico, Badge, Button, Card, PageHeader } = window;

// Small adapter so source code that expects TextInput(value, onChange:value)
// can use the current shell's Input (which yields event).
function TextInput({ value, onChange, size, prefix, suffix, placeholder, mono }) {
  return (
    <window.Input
      value={value || ""}
      onChange={(e) => onChange && onChange(e.target.value)}
      size={size}
      prefix={prefix}
      suffix={suffix}
      placeholder={placeholder}
      mono={mono}
    />
  );
}

const CODE_LENGTH = 6;
function stripCode(raw) {
  return (raw || "").replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
}
function formatCode(raw) {
  const clean = stripCode(raw);
  if (clean.length <= 3) return clean;
  return clean.slice(0, 3) + " " + clean.slice(3);
}

// Known good codes (numeric, matched to this ISV)
const VALID_CODES = {
  "482915": { sn: "NL910-K9F2H7B3-0042",  model: "Newland N910 Pro",    sku: "N910P-EU",    region: "EU",   batch: "BAT-2026-04-N910P-A", isv: "Acme Coffee", orderId: "SO-2026-0418" },
  "739264": { sn: "NL910-K9F2H7B3-0043",  model: "Newland N910 Pro",    sku: "N910P-EU",    region: "EU",   batch: "BAT-2026-04-N910P-A", isv: "Acme Coffee", orderId: "SO-2026-0418" },
  "104857": { sn: "NL750-M7P2H4N8-0019",  model: "Newland N750P",       sku: "N750P-EU",    region: "EU",   batch: "BAT-2026-04-N750P-C", isv: "Acme Coffee", orderId: "SO-2026-0418" },
  "356821": { sn: "NLNQ-X3Y8Z2K7-0007",   model: "Newland NQuire 1000", sku: "NQ1000-APAC", region: "APAC", batch: "BAT-2026-04-NQ1K-B",  isv: "Acme Coffee", orderId: "SO-2026-0402" },
};
const OTHER_ISV_CODE = "999111";
const UNKNOWN_CODE   = "000000";

// Seed history — already activated devices
const SEED_HISTORY = [
  { sn: "NL750-M7P2H4N8-0018", model: "Newland N750P",       sku: "N750P-NA",   orderId: "SO-2026-0411", code: "104853", activatedAt: "Apr 12, 2026 · 09:22", activatedBy: "Yuki Chen",  status: "active" },
  { sn: "NL750-M7P2H4N8-0017", model: "Newland N750P",       sku: "N750P-NA",   orderId: "SO-2026-0411", code: "104852", activatedAt: "Apr 12, 2026 · 09:21", activatedBy: "Yuki Chen",  status: "active" },
  { sn: "NL750-M7P2H4N8-0016", model: "Newland N750P",       sku: "N750P-NA",   orderId: "SO-2026-0411", code: "104851", activatedAt: "Apr 12, 2026 · 09:19", activatedBy: "Yuki Chen",  status: "active" },
  { sn: "NL910-K9F2H7B3-0041", model: "Newland N910 Pro",    sku: "N910P-EU",   orderId: "SO-2026-0407", code: "482912", activatedAt: "Apr 09, 2026 · 14:08", activatedBy: "Marcus Lin", status: "active" },
  { sn: "NL910-K9F2H7B3-0040", model: "Newland N910 Pro",    sku: "N910P-EU",   orderId: "SO-2026-0407", code: "482911", activatedAt: "Apr 09, 2026 · 14:06", activatedBy: "Marcus Lin", status: "update-queued" },
  { sn: "NLNP-G6XR-0011",      model: "Newland NPT-G6",      sku: "NPT-G6-EU",  orderId: "SO-2026-0329", code: "672341", activatedAt: "Apr 02, 2026 · 11:34", activatedBy: "Priya Rao",  status: "active" },
  { sn: "NL950-J3K2L9M5-0028", model: "Newland N950",        sku: "N950-EU",    orderId: "SO-2026-0329", code: "551203", activatedAt: "Apr 01, 2026 · 16:52", activatedBy: "Priya Rao",  status: "active" },
  { sn: "NL950-J3K2L9M5-0027", model: "Newland N950",        sku: "N950-EU",    orderId: "SO-2026-0329", code: "551202", activatedAt: "Apr 01, 2026 · 16:51", activatedBy: "Priya Rao",  status: "active" },
  { sn: "NLNP-G6XR-0009",      model: "Newland NPT-G6",      sku: "NPT-G6-EU",  orderId: "SO-2026-0314", code: "672334", activatedAt: "Mar 18, 2026 · 10:20", activatedBy: "Marcus Lin", status: "active" },
  { sn: "NLNP-G6XR-0008",      model: "Newland NPT-G6",      sku: "NPT-G6-EU",  orderId: "SO-2026-0314", code: "672333", activatedAt: "Mar 17, 2026 · 15:44", activatedBy: "Yuki Chen",  status: "active" },
];

// ─── Code input — 6 single-digit cells ──────────────────────
function CodeInput({ value, onChange, error, disabled, autoFocus }) {
  const inputRef = useRefA(null);
  const stripped = stripCode(value);

  useEffectA(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  return (
    <div style={{ position: "relative", maxWidth: 380 }}>
      <input
        ref={inputRef}
        value={stripped}
        onChange={(e) => onChange(stripCode(e.target.value))}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        inputMode="numeric"
        pattern="[0-9]*"
        style={{
          position: "absolute", inset: 0, opacity: 0, border: 0,
          background: "transparent", padding: 0,
          fontSize: 32, width: "100%", height: "100%",
          cursor: disabled ? "not-allowed" : "text",
          letterSpacing: "0.5em",
        }}
        aria-label="6-digit activation code"
      />
      <div
        onClick={() => inputRef.current && inputRef.current.focus()}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "var(--space-2)",
          cursor: disabled ? "not-allowed" : "text",
        }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const ch = stripped[i];
          const isCurrent = i === stripped.length && !disabled;
          const isFilled = ch != null;
          const extraMargin = i === 3 ? "var(--space-2)" : undefined;
          return (
            <div key={i} style={{
              marginLeft: extraMargin,
              height: 56,
              borderRadius: "var(--radius-md)",
              background: disabled ? "var(--bg3)" : "var(--bg2)",
              border: "1px solid",
              borderColor: error      ? "var(--error)"
                         : isCurrent  ? "var(--accent)"
                         : "var(--border-2)",
              boxShadow: error     ? "0 0 0 3px oklch(58% 0.20 25 / 0.18)"
                       : isCurrent ? "var(--shadow-focus)"
                       : "var(--shadow-1)",
              display: "grid", placeItems: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 26, fontWeight: 500,
              color: error ? "var(--error)" : "var(--fg1)",
              transition: "all var(--duration-fast) var(--easing-standard)",
            }}>
              {isFilled
                ? ch
                : (isCurrent
                    ? <span className="a-caret" style={{
                        width: 2, height: 24, background: "var(--accent)", display: "block",
                      }} />
                    : null)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Validation hook ───────────────────────────────────────
function useValidation(code, freeze) {
  const stripped = stripCode(code);
  const [result, setResult] = useStateA({ state: "idle" });

  useEffectA(() => {
    if (freeze)                       { return; }
    if (stripped.length === 0)        { setResult({ state: "idle" }); return; }
    if (stripped.length < CODE_LENGTH){
      setResult({ state: "typing", progress: stripped.length / CODE_LENGTH });
      return;
    }
    setResult({ state: "validating" });
    const t = setTimeout(() => {
      if (VALID_CODES[stripped]) {
        setResult({ state: "matched", device: VALID_CODES[stripped] });
      } else if (stripped === OTHER_ISV_CODE) {
        setResult({ state: "wrong-isv", reason: "This activation code does not belong to your ISV. Please verify the code and your ISV account." });
      } else {
        setResult({ state: "unknown", reason: "No matching device. Check the code on the device screen and try again." });
      }
    }, 700);
    return () => clearTimeout(t);
  }, [stripped, freeze]);

  return result;
}

// ─── Mini key/value pair ────────────────────────────────────
function Mini({ label, value, mono, accent, iconRight }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <span className="overline" style={{ fontSize: 10 }}>{label}</span>
      <span style={{
        fontFamily: mono ? "var(--font-mono)" : undefined,
        fontSize: mono ? 12.5 : 13,
        color: accent || "var(--fg1)",
        fontWeight: 500,
        display: "inline-flex", alignItems: "center", gap: 4,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {value}
        {iconRight && <Ico name={iconRight} size={12} stroke={2.4} />}
      </span>
    </div>
  );
}

// ─── Inline validation/success panel ────────────────────────
function ResultPanel({ result, justActivated }) {
  // Just-bound success
  if (justActivated) {
    const d = justActivated.device;
    return (
      <div className="a-fade" style={{
        padding: "var(--space-4) var(--space-5)",
        borderRadius: "var(--radius-lg)",
        background: "linear-gradient(135deg, var(--success-bg) 0%, oklch(95% 0.04 152) 100%)",
        border: "1px solid oklch(58% 0.14 152 / 0.25)",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div className="a-pop" style={{
          width: 42, height: 42, borderRadius: "50%",
          background: "var(--success)", color: "#fff",
          display: "grid", placeItems: "center", flexShrink: 0,
          boxShadow: "0 0 0 4px oklch(58% 0.14 152 / 0.18)",
        }}>
          <Ico name="check" size={20} stroke={2.6} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-success-700)" }}>
            Activated · update command sent
          </div>
          <div style={{ fontSize: 12, color: "var(--color-success-700)", opacity: 0.85, marginTop: 3, lineHeight: 1.5 }}>
            <span className="mono">{d.sn}</span> bound to <b>{d.isv}</b>.
            Device-update command queued — delivery handled by Deployments.
          </div>
        </div>
        <Badge tone="success" dot>Bound</Badge>
      </div>
    );
  }

  if (result.state === "idle") {
    return (
      <div style={{
        padding: "var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-md)",
        background: "var(--bg3)",
        border: "1px dashed var(--border-2)",
        fontSize: 12, color: "var(--fg3)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Ico name="info" size={14} />
        <span>TOMS will auto-match the code to a device and verify it belongs to your ISV.</span>
      </div>
    );
  }

  if (result.state === "typing") {
    return (
      <div className="a-fade" style={{
        padding: "var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-md)",
        background: "var(--bg3)",
        border: "1px solid var(--border-1)",
        fontSize: 12, color: "var(--fg2)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="7" fill="none" stroke="var(--border-2)" strokeWidth="1.5" />
          <circle cx="9" cy="9" r="7" fill="none" stroke="var(--accent)" strokeWidth="1.5"
            strokeDasharray={`${result.progress * 44} 44`} strokeLinecap="round"
            transform="rotate(-90 9 9)" />
        </svg>
        <span>{CODE_LENGTH - Math.round(result.progress * CODE_LENGTH)} digit{CODE_LENGTH - Math.round(result.progress * CODE_LENGTH) !== 1 ? "s" : ""} remaining.</span>
      </div>
    );
  }

  if (result.state === "validating") {
    return (
      <div className="a-fade" style={{
        padding: "var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-md)",
        background: "var(--info-bg)",
        border: "1px solid oklch(60% 0.14 230 / 0.25)",
        fontSize: 12, color: "var(--info)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <svg className="a-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
          <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span>Checking ISV ownership and matching to a sample…</span>
      </div>
    );
  }

  if (result.state === "matched") {
    const d = result.device;
    return (
      <div className="a-fade" style={{
        padding: "var(--space-5)",
        borderRadius: "var(--radius-lg)",
        background: "var(--success-bg)",
        border: "1px solid oklch(58% 0.14 152 / 0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--success)", color: "#fff",
            display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <Ico name="check" size={14} stroke={2.6} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-success-700)" }}>
              Code verified · belongs to your ISV
            </div>
            <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 1 }}>
              Review the matched device, then click <b>Activate &amp; bind</b>.
            </div>
          </div>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "var(--space-3) var(--space-5)",
          background: "var(--bg2)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4) var(--space-5)",
        }}>
          <Mini label="Serial number" value={d.sn} mono />
          <Mini label="Model"         value={d.model} />
          <Mini label="Order"         value={d.orderId} mono />
          <Mini label="Status"        value="Ready to bind" accent="var(--accent)" />
        </div>
      </div>
    );
  }

  if (result.state === "wrong-isv" || result.state === "unknown") {
    return (
      <div className="a-fade" style={{
        padding: "var(--space-4)",
        borderRadius: "var(--radius-md)",
        background: "var(--error-bg)",
        border: "1px solid oklch(58% 0.20 25 / 0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ico name="alert" size={15} style={{ color: "var(--error)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-error-700)" }}>
            {result.state === "wrong-isv" ? "ISV mismatch" : "Code not recognized"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--color-error-700)", marginTop: 6, lineHeight: 1.5 }}>
          {result.reason}
        </div>
      </div>
    );
  }
  return null;
}

// ─── Demo chip ──────────────────────────────────────────────
function DemoChip({ onClick, icon, label, style }) {
  return (
    <button onClick={onClick} className="tds-btn tds-btn--secondary tds-btn--sm" style={{
      height: 26, padding: "0 var(--space-3)",
      borderRadius: "var(--radius-full)",
      fontSize: 11.5, fontWeight: 450,
      color: "var(--fg2)",
      ...style,
    }}>
      <Ico name={icon} size={11} stroke={1.7} />
      <span>{label}</span>
    </button>
  );
}

// ─── Avatar ─────────────────────────────────────────────────
function Avatar({ name, size = 20 }) {
  const initials = name.split(" ").map(p => p[0]).slice(0, 2).join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, oklch(70% 0.13 268), oklch(50% 0.18 282))",
      color: "#fff", flexShrink: 0,
      display: "grid", placeItems: "center",
      fontSize: size <= 22 ? 9.5 : 11, fontWeight: 600,
    }}>{initials}</div>
  );
}

// ─── History list ───────────────────────────────────────────
function HistoryList({ history }) {
  const [query, setQuery] = useStateA("");
  const filtered = useMemoA(() => {
    if (!query) return history;
    const q = query.toLowerCase();
    return history.filter(h =>
      `${h.sn} ${h.model} ${h.sku} ${h.orderId} ${h.activatedBy} ${h.code}`.toLowerCase().includes(q)
    );
  }, [history, query]);

  return (
    <Card padding={0}
      title="Activated devices"
      hint={`${history.length} total`}
      action={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 240 }}>
            <TextInput
              prefix={<Ico name="search" size={13} />}
              placeholder="Search SN, model, code…"
              value={query}
              onChange={setQuery}
              size="sm"
            />
          </div>
          <Button size="sm" icon="download">Export</Button>
        </div>
      }
    >
      <div style={{ overflowX: "auto" }}>
        <table className="tds-table num">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Serial number</th>
              <th>Model</th>
              <th>Order</th>
              <th>Activated</th>
              <th>By</th>
              <th>Code</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => {
              return (
                <tr key={h.sn} style={h.justAdded ? { background: "var(--success-bg)" } : undefined}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 26, height: 26, flexShrink: 0,
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg3)",
                        border: "1px solid var(--border-1)",
                        display: "grid", placeItems: "center",
                        color: "var(--fg3)",
                      }}>
                        <Ico name="device" size={13} />
                      </div>
                      <span className="mono" style={{
                        fontSize: 12, color: "var(--fg1)",
                        whiteSpace: "nowrap",
                      }}>{h.sn}</span>
                      {h.justAdded && <Badge tone="success">just now</Badge>}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12.5, color: "var(--fg1)" }}>{h.model}</span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 12, color: "var(--fg2)" }}>{h.orderId}</span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--fg2)" }}>{h.activatedAt}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Avatar name={h.activatedBy} size={20} />
                      <span style={{ fontSize: 12, color: "var(--fg2)" }}>{h.activatedBy}</span>
                    </div>
                  </td>
                  <td>
                    <span className="mono" style={{
                      fontSize: 11.5, padding: "2px 6px",
                      background: "var(--bg3)", color: "var(--fg2)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-1)",
                    }}>{h.code}</span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--fg3)" }}>
                  No matching devices.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Sample Activation page ─────────────────────────────────
function SampleActivationPage({ presetState, presetCode }) {
  const [code, setCode] = useStateA("");
  const [history, setHistory] = useStateA(SEED_HISTORY);
  const [justActivated, setJustActivated] = useStateA(null);

  // While justActivated is set, freeze validation so the success panel stays
  const validation = useValidation(code, !!justActivated);

  // Apply preset state from tweaks
  useEffectA(() => {
    if (presetCode != null) setCode(presetCode);
    setJustActivated(null);
    if (presetState === "post-bind") {
      // Simulate having just activated
      const d = VALID_CODES["482915"];
      setJustActivated({
        device: d,
        code: "482915",
      });
    }
  }, [presetState, presetCode]);

  function handleActivate() {
    if (validation.state !== "matched") return;
    const d = validation.device;
    const codeStr = stripCode(code);
    setJustActivated({ device: d, code: codeStr });
    // Push to history at top
    setHistory(prev => [
      {
        sn: d.sn,
        model: d.model,
        sku: d.sku,
        orderId: d.orderId,
        code: codeStr,
        activatedAt: nowStamp(),
        activatedBy: "Yuki Chen",
        status: "update-queued",
        justAdded: true,
      },
      ...prev.map(h => ({ ...h, justAdded: false })),
    ]);
    // Auto-reset the input after 4s
    setTimeout(() => {
      setCode("");
      setJustActivated(null);
    }, 4500);
  }

  const canSubmit = validation.state === "matched" && !justActivated;

  return (
    <div style={{ background: "var(--bg1)", minHeight: "100%" }}>
      <PageHeader
        title="Sample Activation"
        subtitle="Enter the 6-digit code shown on the device. If it belongs to your ISV, the device is bound automatically and an update command is queued."
      />

      <div style={{
        padding: "var(--space-6)",
        display: "flex", flexDirection: "column", gap: "var(--space-6)",
        maxWidth: 1280, margin: "0 auto",
      }}>

        {/* ── TOP: Activation card ── */}
        <Card padding="var(--space-5) var(--space-6)">
          <div style={{ display: "flex", gap: "var(--space-8)", alignItems: "flex-start" }}>
            {/* Left — code input */}
            <div style={{ flex: "0 0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "var(--space-4)" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "var(--radius-md)",
                  background: "var(--accent)", color: "var(--accent-on)",
                  display: "grid", placeItems: "center",
                  boxShadow: "var(--shadow-cta)",
                }}>
                  <Ico name="key" size={15} stroke={1.7} />
                </div>
                <div>
                  <div className="h4" style={{ fontSize: 14, margin: 0 }}>Activation code</div>
                  <div className="caption" style={{ fontSize: 11 }}>
                    6-digit numeric · shown on device first boot
                  </div>
                </div>
              </div>

              <CodeInput
                value={code}
                onChange={setCode}
                error={!justActivated && (validation.state === "wrong-isv" || validation.state === "unknown")}
                disabled={!!justActivated}
                autoFocus
              />

              <div style={{ display: "flex", gap: 8, marginTop: "var(--space-4)", flexWrap: "wrap" }}>
                <DemoChip onClick={() => setCode("482915")} icon="sparkle" label="Valid code" />
                <DemoChip onClick={() => setCode("999111")} icon="shield"  label="Other ISV" />
                <DemoChip onClick={() => setCode("000000")} icon="alert"   label="Invalid" />
                <DemoChip onClick={() => setCode("")}       icon="refresh" label="Clear" />
              </div>
            </div>

            {/* Right — validation/success panel */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <ResultPanel result={validation} justActivated={justActivated} />

              <div style={{
                marginTop: "var(--space-4)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  fontSize: 11.5, color: "var(--fg3)",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  <Ico name="lock" size={12} />
                  Audit ID generated on submit · ISV ownership re-checked server-side
                </span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <Button variant="ghost" onClick={() => { setCode(""); setJustActivated(null); }}>Clear</Button>
                  <Button variant="primary" size="md" iconRight="arrowR" disabled={!canSubmit} onClick={handleActivate}>
                    {justActivated ? "Bound · resetting…" : canSubmit ? "Activate & bind" : "Enter a valid code"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── BOTTOM: History ── */}
        <HistoryList history={history} />
      </div>
    </div>
  );
}

function nowStamp() {
  const d = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const pad = (n) => String(n).padStart(2, "0");
  return `${months[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

Object.assign(window, { SampleActivationPage, VALID_CODES, formatCode });
