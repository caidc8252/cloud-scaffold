/* global React */
// ─────────────────────────────────────────────────────────────
// Carbon — Upload & Publish wizard (drawer)
// ─────────────────────────────────────────────────────────────

const { useState: useStateW, useEffect: useEffectW, useMemo: useMemoW } = React;

function PublishWizardScreen({ app, onClose, onPublish, toast }) {
  const [step, setStep] = useStateW(0);

  // Step 1: APK upload (simulated)
  const [uploadState, setUploadState] = useStateW("idle"); // idle | uploading | parsed
  const [uploadPct, setUploadPct] = useStateW(0);
  const [parsed, setParsed] = useStateW(null);

  // Step 2: scan
  const [scanState, setScanState] = useStateW("queued"); // queued | scanning | done
  const [scanPct, setScanPct] = useStateW(0);
  const scanTemplate = "cleanish"; // The scan finds 4 minor issues

  // Step 3: app info
  const [versionNotes, setVersionNotes] = useStateW("");
  const [screenshots, setScreenshots] = useStateW([1, 2, 3]); // placeholder

  // Step 4: scope
  const [scopeMode, setScopeMode] = useStateW("all"); // all | whitelist | blacklist
  const [whitelist, setWhitelist] = useStateW(new Set());
  const [blacklist, setBlacklist] = useStateW(new Set());
  const [rolloutPct, setRolloutPct] = useStateW(100);

  const baseSubscribers = app ? app.subscriberIds : window.APPS[0].subscriberIds;
  const reachCount = useMemoW(() => {
    if (scopeMode === "all") return baseSubscribers.length;
    if (scopeMode === "whitelist") return whitelist.size;
    return baseSubscribers.filter(id => !blacklist.has(id)).length;
  }, [scopeMode, whitelist, blacklist, baseSubscribers]);

  // Reset on mount
  useEffectW(() => {
    setStep(0);
    setUploadState("idle");
    setUploadPct(0);
    setParsed(null);
    setScanState("queued");
    setScanPct(0);
    setVersionNotes("");
    setScopeMode("all");
    setWhitelist(new Set());
    setBlacklist(new Set());
    setRolloutPct(100);
  }, [app?.id]);

  // Simulate upload
  useEffectW(() => {
    if (uploadState !== "uploading") return;
    const t = setInterval(() => {
      setUploadPct(p => {
        if (p >= 100) {
          clearInterval(t);
          setTimeout(() => {
            setParsed({
              filename: "acme-pos-pro_4.3.3.apk",
              size: "28.4 MB",
              version: "4.3.3",
              code: 1433,
              package: app ? app.package : "com.acme.pos.pro",
              minSdk: 24,
              targetSdk: 34,
              perms: 18,
              signer: "Acme Software Inc.",
              fingerprint: "SHA-256 d4:e2:8a:91:c2:bb:7f:00:1a:…",
            });
            setUploadState("parsed");
          }, 200);
          return 100;
        }
        return Math.min(100, p + 6 + Math.random() * 12);
      });
    }, 90);
    return () => clearInterval(t);
  }, [uploadState]);

  // Simulate scan when stepping into Step 2
  useEffectW(() => {
    if (step !== 1 || scanState !== "queued") return;
    setScanState("scanning");
    setScanPct(0);
    const t = setInterval(() => {
      setScanPct(p => {
        if (p >= 100) {
          clearInterval(t);
          setTimeout(() => setScanState("done"), 200);
          return 100;
        }
        return Math.min(100, p + 3 + Math.random() * 6);
      });
    }, 90);
    return () => clearInterval(t);
  }, [step, scanState]);

  const steps = [
    { id: "upload",  label: "Upload APK" },
    { id: "info",    label: "Version info" },
    { id: "scope",   label: "Distribution" },
    { id: "review",  label: "Review & publish" },
  ];

  const canNext = (() => {
    if (step === 0) return uploadState === "parsed";
    if (step === 1) return versionNotes.trim().length > 5;
    if (step === 2) return scopeMode !== "whitelist" || whitelist.size > 0;
    return true;
  })();

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const findings = window.SCAN_FINDINGS_TEMPLATES[scanTemplate];
  const scanCounts = window.summariseFindings(findings);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Page header */}
      <div style={{
        background: "var(--color-bg-2)",
        borderBottom: "1px solid var(--color-border-subtle)",
        padding: "14px 24px 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onClose} style={{ color: "var(--color-text-tertiary)", padding: 2 }} title="Back">
            <window.Ico name="chevl" size={16} />
          </button>
          {app && <window.AppIcon id={app.iconId} size={36} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
              {app ? `Upload new version · ${app.name}` : "Upload a new version"}
            </h1>
            {app && (
              <div className="mono" style={{ marginTop: 2, fontSize: 11.5, color: "var(--color-text-tertiary)" }}>
                {app.package}
              </div>
            )}
          </div>
          <window.Button onClick={onClose}>Cancel</window.Button>
        </div>

        {/* Stepper */}
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {steps.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.id} style={{
                flex: 1, padding: "0 0 12px",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    display: "grid", placeItems: "center",
                    background: done ? "var(--color-primary-700)" : active ? "var(--color-bg-2)" : "transparent",
                    border: "1px solid", borderColor: active ? "var(--color-primary-500)" : done ? "transparent" : "var(--color-border-default)",
                    color: done ? "var(--color-text-on-primary)" : active ? "var(--color-primary-600)" : "var(--color-text-tertiary)",
                    fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-family-mono)",
                  }}>
                    {done ? <window.Ico name="check" size={10} stroke={2.5} /> : i + 1}
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: active ? 500 : 400,
                    color: active ? "var(--color-text-primary)" : done ? "var(--color-text-secondary)" : "var(--color-text-tertiary)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{s.label}</span>
                </div>
                <div style={{
                  height: 2, borderRadius: 1,
                  background: done ? "var(--color-primary-700)" : active ? "var(--color-primary-200)" : "var(--color-border-subtle)",
                }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", background: "var(--color-bg-1)" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 24px 32px" }}>
          {step === 0 && <StepUpload app={app} state={uploadState} pct={uploadPct} parsed={parsed}
            onStart={() => setUploadState("uploading")} />}
          {step === 1 && <StepInfo notes={versionNotes} setNotes={setVersionNotes} screenshots={screenshots} setScreenshots={setScreenshots} />}
          {step === 2 && <StepScope subscriberIds={baseSubscribers}
            scopeMode={scopeMode} setScopeMode={setScopeMode}
            whitelist={whitelist} setWhitelist={setWhitelist}
            blacklist={blacklist} setBlacklist={setBlacklist}
            rolloutPct={rolloutPct} setRolloutPct={setRolloutPct}
            reachCount={reachCount} />}
          {step === 3 && <StepReview app={app} parsed={parsed}
            notes={versionNotes} scopeMode={scopeMode} reachCount={reachCount}
            rolloutPct={rolloutPct} subscriberIds={baseSubscribers}
            whitelist={whitelist} blacklist={blacklist} />}
        </div>
      </div>

      {/* Sticky footer */}
      <footer style={{
        padding: "12px 24px",
        borderTop: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-2)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {step > 0 && <window.Button onClick={prev} icon="chevl">Back</window.Button>}
        <div style={{ flex: 1, fontSize: 11.5, color: "var(--color-text-tertiary)" }}>
          Step <span className="mono" style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{step + 1}</span> of {steps.length}
          {" · "}<span>{steps[step].label}</span>
        </div>
        <window.Button onClick={onClose} ghost>Save as draft</window.Button>
        {step < steps.length - 1 ? (
          <window.Button primary disabled={!canNext} onClick={next} iconRight="chevr">Continue</window.Button>
        ) : (
          <window.Button primary icon="bolt" onClick={() => {
            onPublish && onPublish({ app, parsed, scanTemplate, versionNotes, scopeMode, whitelist, blacklist, rolloutPct, reachCount });
            onClose();
          }}>Publish now</window.Button>
        )}
      </footer>
    </div>
  );
}

// ─── Step 1: Upload APK ────────────────────────────────────
function StepUpload({ app, state, pct, parsed, onStart }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHead title="Upload APK"
        body="Drag the signed APK file here, or click to browse. Carbon will parse the manifest, verify the signature, and detect the package name automatically." />

      {state === "idle" && (
        <button onClick={onStart} style={{
          padding: "44px 24px",
          border: "1.5px dashed var(--color-border-default)",
          borderRadius: 12,
          background: "var(--color-bg-3)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          width: "100%", cursor: "pointer",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-primary-500)"; e.currentTarget.style.background = "var(--color-primary-50)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-default)"; e.currentTarget.style.background = "var(--color-bg-3)"; }}>
          <div style={{ width: 44, height: 44, borderRadius: 10,
            background: "var(--color-bg-2)", border: "1px solid var(--color-border-default)",
            color: "var(--color-text-secondary)", display: "grid", placeItems: "center" }}>
            <window.Ico name="upload" size={20} />
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Drag your APK here, or click to browse</div>
          <div style={{ fontSize: 11.5, color: "var(--color-text-tertiary)" }}>
            Signed APK · up to 200&nbsp;MB · packages: <span className="mono">com.acme.*</span>
          </div>
        </button>
      )}

      {state === "uploading" && (
        <div style={{ padding: "24px", background: "var(--color-bg-2)",
          border: "1px solid var(--color-border-default)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8,
              background: "var(--color-primary-50)", color: "var(--color-primary-700)",
              display: "grid", placeItems: "center" }}>
              <window.Ico name="upload" size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 12.5, fontWeight: 500 }}>acme-pos-pro_4.3.3.apk</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Uploading… <span className="mono">{Math.round(pct)}%</span></div>
            </div>
            <span className="mono" style={{ fontSize: 11.5, color: "var(--color-text-tertiary)" }}>28.4&nbsp;MB</span>
          </div>
          <div style={{ marginTop: 14, height: 4, borderRadius: 999, background: "var(--color-bg-3)", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-primary-700)", transition: "width .1s" }} />
          </div>
        </div>
      )}

      {state === "parsed" && parsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: "12px 16px",
            background: "var(--color-success-50)", borderRadius: 8,
            border: "1px solid", borderColor: "color-mix(in oklab, var(--color-success-500) 25%, transparent)",
            display: "flex", alignItems: "center", gap: 10 }}>
            <window.Ico name="check" size={14} style={{ color: "var(--color-success-500)" }} stroke={2.5} />
            <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: "var(--color-success-500)" }}>
              Upload complete · Signature verified · Manifest parsed
            </div>
            <window.Button size="sm" ghost icon="refresh">Re-upload</window.Button>
          </div>

          <div style={{ padding: "10px 14px",
            background: "var(--color-info-50)", borderRadius: 8,
            border: "1px solid", borderColor: "color-mix(in oklab, var(--color-info-500) 22%, transparent)",
            display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--color-info-700)" }}>
            <Spinner size={14} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 500 }}>Security scan started in the background</span>
              <span style={{ color: "var(--color-text-tertiary)" }}> · You can continue. Results will appear on the version detail page when the scan completes (typically 2–4 min).</span>
            </div>
          </div>

          <window.Card title="Detected package information">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              <window.KV label="File"          value={<span className="mono">{parsed.filename}</span>} />
              <window.KV label="Size"          value={parsed.size} />
              <window.KV label="Package"       value={<span className="mono">{parsed.package}</span>} copy />
              <window.KV label="Version name"  value={<span className="mono">{parsed.version}</span>} />
              <window.KV label="Version code"  value={<span className="mono">{parsed.code}</span>} />
              <window.KV label="Min / Target SDK" value={<span className="mono">{parsed.minSdk} / {parsed.targetSdk}</span>} />
              <window.KV label="Permissions"   value={`${parsed.perms} declared`} />
              <window.KV label="Signer"        value={parsed.signer} />
              <window.KV label="Fingerprint"   value={<span className="mono" style={{ fontSize: 11 }}>{parsed.fingerprint}</span>} copy />
            </div>
          </window.Card>

          {app && parsed.package !== app.package && (
            <div style={{ padding: 12, background: "var(--color-error-50)", borderRadius: 8,
              border: "1px solid var(--color-error-500)", color: "var(--color-error-500)", fontSize: 12.5 }}>
              Package name mismatch. Expected <span className="mono">{app.package}</span>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Vulnerability scan ───────────────────────────
function StepScan({ state, pct, counts, findings }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHead title="Security & vulnerability scan"
        body="Carbon runs a static analysis on your APK — dependency CVEs, manifest issues, embedded secrets, and bundled native libraries. The scan runs asynchronously and typically finishes in 2–4 minutes." />

      {state !== "done" ? (
        <div style={{ padding: "28px",
          background: "var(--color-bg-2)", borderRadius: 10,
          border: "1px solid var(--color-border-default)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Spinner />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Scanning dependencies & manifest…</div>
              <div style={{ fontSize: 11.5, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                {pct < 30 ? "Decompiling bytecode" : pct < 60 ? "Matching CVE database" : pct < 90 ? "Inspecting permissions" : "Finalising report"}
                {" · "}<span className="mono">{Math.round(pct)}%</span>
              </div>
            </div>
            <window.Pill tone="info" dot>In progress</window.Pill>
          </div>
          <div style={{ marginTop: 14, height: 4, borderRadius: 999, background: "var(--color-bg-3)", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-primary-700)", transition: "width .1s" }} />
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: 14, background: "var(--color-bg-2)",
            borderRadius: 10, border: "1px solid var(--color-border-default)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <window.Pill tone="success" dot size="lg">Scan complete</window.Pill>
              <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Finished in 2m 41s · 4 findings, none blocking</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {Object.entries(counts).map(([k, v]) => (
                <div key={k} style={{
                  padding: "8px 10px", borderRadius: 6,
                  background: v > 0 ? "var(--color-bg-3)" : "transparent",
                  borderLeft: `3px solid ${window.SEVERITY[k].color}`,
                }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em",
                    fontWeight: 500, color: "var(--color-text-tertiary)" }}>{window.SEVERITY[k].label}</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 500,
                    color: v > 0 ? window.SEVERITY[k].color : "var(--color-text-tertiary)" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}><window.SeverityBar counts={counts} height={6} /></div>
          </div>

          <window.Card title="Findings"
            hint="Recommended fixes are not blocking — you can publish and address them in a future version.">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {findings.map((f, i) => (
                <ScanFindingRow key={i} f={f} />
              ))}
            </div>
          </window.Card>
        </>
      )}
    </div>
  );
}

function ScanFindingRow({ f }) {
  const sev = window.SEVERITY[f.sev];
  return (
    <div style={{
      padding: "9px 12px",
      border: "1px solid var(--color-border-subtle)",
      borderLeft: "3px solid", borderLeftColor: sev.color,
      borderRadius: 6,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <window.Pill tone={sev.tone} size="sm">{sev.label}</window.Pill>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{f.title}</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          {f.cve ? <span>{f.cve} · </span> : null}{f.pkg}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Version info ─────────────────────────────────
function StepInfo({ notes, setNotes, screenshots, setScreenshots }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHead title="Version info"
        body="Tell your subscribers what changed. Release notes are shown in the merchant install prompt; screenshots and the changelog feed into the public store entry." />

      <window.Field label="Release notes" required
        hint={<span><span className="mono">{notes.length}</span> / 500 characters · Markdown supported</span>}>
        <window.Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5}
          placeholder={"e.g.\n• Fixes EMV fallback bug on N750P\n• Adds tip suggestion presets\n• Offline queue retry now uses exponential backoff"} />
      </window.Field>

      <window.Field label="Screenshots"
        hint="Up to 8 images · PNG or JPG · recommended 1080×1920">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {screenshots.map((s, i) => (
            <div key={i} style={{
              position: "relative",
              width: 80, height: 142, borderRadius: 6,
              background: `linear-gradient(135deg, oklch(58% 0.22 ${260 + i * 30}), oklch(48% 0.20 ${280 + i * 30}))`,
              border: "1px solid var(--color-border-default)",
              display: "grid", placeItems: "center",
              color: "white", fontSize: 22, fontWeight: 600,
              fontFamily: "var(--font-family-mono)",
            }}>
              {i + 1}
              <button onClick={() => setScreenshots(screenshots.filter((_, j) => j !== i))} style={{
                position: "absolute", top: 4, right: 4,
                width: 18, height: 18, borderRadius: "50%",
                background: "oklch(0% 0 0 / 0.5)", color: "white",
                display: "grid", placeItems: "center",
              }}>
                <window.Ico name="x" size={10} stroke={2.5} />
              </button>
            </div>
          ))}
          {screenshots.length < 8 && (
            <button onClick={() => setScreenshots([...screenshots, screenshots.length + 1])} style={{
              width: 80, height: 142, borderRadius: 6,
              border: "1.5px dashed var(--color-border-default)", background: "var(--color-bg-3)",
              color: "var(--color-text-tertiary)", display: "grid", placeItems: "center",
            }}>
              <window.Ico name="plus" size={18} />
            </button>
          )}
        </div>
      </window.Field>

      <window.Field label="Tags" hint="Optional · helps merchants find the update in their inbox">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {["bugfix", "security", "ui-polish", "feature"].map(t => (
            <span key={t} style={{
              padding: "3px 9px", borderRadius: 4,
              background: "var(--color-bg-3)", border: "1px solid var(--color-border-default)",
              fontSize: 11, fontFamily: "var(--font-family-mono)",
              color: "var(--color-text-secondary)", cursor: "pointer",
            }}>+ {t}</span>
          ))}
        </div>
      </window.Field>
    </div>
  );
}

// ─── Step 4: Distribution scope ───────────────────────────
function StepScope({ subscriberIds, scopeMode, setScopeMode, whitelist, setWhitelist,
                    blacklist, setBlacklist, rolloutPct, setRolloutPct, reachCount }) {
  const subs = subscriberIds.map(id => window.CUSTOMERS.find(c => c.id === id));
  const [q, setQ] = useStateW("");
  const filteredSubs = subs.filter(s => q === "" || s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHead title="Distribution scope"
        body="Choose who gets this release. By default, all subscribed merchants receive it. Use a whitelist for canary rollouts, or a blacklist to exclude specific tenants." />

      <div style={{ padding: "10px 14px",
        background: "var(--color-bg-3)", borderRadius: 8,
        border: "1px solid var(--color-border-subtle)",
        display: "flex", alignItems: "center", gap: 12 }}>
        <window.Ico name="users" size={15} style={{ color: "var(--color-text-tertiary)" }} />
        <div style={{ fontSize: 12.5 }}>
          <span className="mono" style={{ fontWeight: 600 }}>{subs.length}</span>{" "}
          <span style={{ color: "var(--color-text-secondary)" }}>merchants are subscribed to this app</span>
          <span style={{ color: "var(--color-text-tertiary)" }}> · <span className="mono">{subs.reduce((s, c) => s + c.terminals, 0)}</span> terminals total</span>
        </div>
      </div>

      {/* Scope mode radio cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { id: "all", icon: "users", label: "All subscribers", body: "Push to every merchant subscribed to this app." },
          { id: "whitelist", icon: "shieldCheck", label: "Whitelist", body: "Only the merchants you choose receive this version." },
          { id: "blacklist", icon: "shield", label: "Blacklist", body: "All subscribers except merchants you exclude." },
        ].map(opt => (
          <button key={opt.id} onClick={() => setScopeMode(opt.id)} style={{
            padding: 14, textAlign: "left",
            background: scopeMode === opt.id ? "var(--color-primary-50)" : "var(--color-bg-2)",
            border: "1px solid",
            borderColor: scopeMode === opt.id ? "var(--color-primary-500)" : "var(--color-border-default)",
            borderRadius: 8,
            boxShadow: scopeMode === opt.id ? "0 0 0 3px oklch(40% 0.14 262 / 0.08)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                border: "1.5px solid",
                borderColor: scopeMode === opt.id ? "var(--color-primary-600)" : "var(--color-border-strong)",
                display: "grid", placeItems: "center",
              }}>
                {scopeMode === opt.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary-600)" }} />}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--color-text-tertiary)", lineHeight: 1.45 }}>{opt.body}</div>
          </button>
        ))}
      </div>

      {/* Picker for whitelist / blacklist */}
      {(scopeMode === "whitelist" || scopeMode === "blacklist") && (
        <window.Card padding={0} title={scopeMode === "whitelist" ? "Choose merchants to include" : "Choose merchants to exclude"}
          action={
            <span style={{ fontSize: 11.5, color: "var(--color-text-tertiary)" }}>
              <span className="mono" style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                {scopeMode === "whitelist" ? whitelist.size : blacklist.size}
              </span> selected
            </span>
          }>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border-subtle)" }}>
            <window.Input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${subs.length} subscribers…`} />
          </div>
          <div style={{ maxHeight: 280, overflow: "auto" }}>
            {filteredSubs.map((c, i) => {
              const set = scopeMode === "whitelist" ? whitelist : blacklist;
              const setter = scopeMode === "whitelist" ? setWhitelist : setBlacklist;
              const on = set.has(c.id);
              return (
                <button key={c.id} onClick={() => {
                  const next = new Set(set);
                  if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                  setter(next);
                }} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 14px", width: "100%", textAlign: "left",
                  borderBottom: i < filteredSubs.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                  background: on ? (scopeMode === "whitelist" ? "var(--color-success-50)" : "var(--color-error-50)") : "transparent",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5,
                    background: on ? (scopeMode === "whitelist" ? "var(--color-success-500)" : "var(--color-error-500)") : "var(--color-bg-2)",
                    border: "1px solid",
                    borderColor: on ? "transparent" : "var(--color-border-default)",
                    display: "grid", placeItems: "center",
                    color: "white", flexShrink: 0,
                  }}>
                    {on && <window.Ico name="check" size={11} stroke={2.5} />}
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 5,
                    background: "var(--color-primary-50)", color: "var(--color-primary-700)",
                    display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 600 }}>
                    {c.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{c.region} · <span className="mono">{c.terminals}</span> terminals</div>
                  </div>
                  <window.Pill size="sm" tone={c.tier === "Enterprise" ? "accent" : "neutral"}>{c.tier}</window.Pill>
                </button>
              );
            })}
          </div>
        </window.Card>
      )}

      {/* Rollout strategy */}
      <window.Card title="Rollout strategy">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Initial rollout percentage</div>
            <div style={{ fontSize: 11.5, color: "var(--color-text-tertiary)", marginTop: 2 }}>
              Stagger the rollout to catch regressions early. You can ramp later from this version's detail page.
            </div>
          </div>
          <input type="range" min="10" max="100" step="10" value={rolloutPct}
            onChange={(e) => setRolloutPct(+e.target.value)}
            style={{ width: 220, accentColor: "var(--color-primary-600)" }} />
          <div className="mono" style={{
            width: 60, padding: "4px 8px", borderRadius: 5,
            background: "var(--color-bg-3)", border: "1px solid var(--color-border-subtle)",
            textAlign: "center", fontSize: 13, fontWeight: 500,
          }}>{rolloutPct}%</div>
        </div>
      </window.Card>

      {/* Live reach */}
      <div style={{
        padding: "12px 16px", borderRadius: 8,
        background: "linear-gradient(95deg, var(--color-primary-50) 0%, var(--color-accent-50) 100%)",
        border: "1px solid var(--color-border-subtle)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <window.Ico name="bolt" size={16} style={{ color: "var(--color-primary-700)" }} />
        <div style={{ flex: 1, fontSize: 12.5 }}>
          This release will reach{" "}
          <span className="mono" style={{ fontWeight: 600, fontSize: 14, color: "var(--color-primary-700)" }}>{Math.round(reachCount * rolloutPct / 100)}</span>{" "}
          of <span className="mono">{subscriberIds.length}</span> subscribed merchants in the first wave
          {rolloutPct < 100 && <span style={{ color: "var(--color-text-tertiary)" }}> ({rolloutPct}% of {reachCount} scoped)</span>}.
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Review ───────────────────────────────────────
function StepReview({ app, parsed, notes, scopeMode, reachCount, rolloutPct, subscriberIds, whitelist, blacklist }) {
  const finalReach = Math.round(reachCount * rolloutPct / 100);
  const scopeLabel = scopeMode === "all" ? "All subscribers"
                  : scopeMode === "whitelist" ? `Whitelist · ${whitelist.size} merchants`
                  : `Blacklist · excluding ${blacklist.size}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHead title="Review & publish"
        body="One last check. After you confirm, this version becomes the new current build for the scoped merchants. You can re-scope or roll back from the version detail page." />

      <window.Card title="Summary">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          <window.KV label="App"             value={app ? app.name : "—"} />
          <window.KV label="Package"         value={<span className="mono">{parsed?.package || app?.package}</span>} />
          <window.KV label="Version"         value={<span className="mono">{parsed?.version}</span>} />
          <window.KV label="Version code"    value={<span className="mono">{parsed?.code}</span>} />
          <window.KV label="APK size"        value={parsed?.size} />
          <window.KV label="Security scan"   value={<span style={{ color: "var(--color-info-700)", display: "inline-flex", alignItems: "center", gap: 6 }}><Spinner size={11} /> Running in background — results will appear on the version detail page</span>} />
          <window.KV label="Distribution"    value={scopeLabel} />
          <window.KV label="Rollout"         value={`${rolloutPct}% · reaches ${finalReach} of ${subscriberIds.length}`} />
        </div>
      </window.Card>

      <window.Card title="Release notes">
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text-secondary)", whiteSpace: "pre-wrap" }}>{notes || <span style={{ color: "var(--color-text-tertiary)" }}>No release notes provided.</span>}</p>
      </window.Card>

      <div style={{
        padding: "12px 14px",
        background: "var(--color-warning-50)",
        borderRadius: 8,
        border: "1px solid", borderColor: "color-mix(in oklab, var(--color-warning-500) 30%, transparent)",
        display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "var(--color-warning-500)",
      }}>
        <window.Ico name="alert" size={14} style={{ marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 500 }}>Publishing is immediate</div>
          <div style={{ marginTop: 3 }}>Terminals will start downloading on next check-in (15 min poll interval). Cellular-metered devices delay until WiFi is available.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────
function SectionHead({ title, body }) {
  return (
    <div>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{title}</h3>
      {body && <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "var(--color-text-tertiary)", maxWidth: 640, lineHeight: 1.55 }}>{body}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      border: "3px solid var(--color-bg-3)",
      borderTopColor: "var(--color-primary-600)",
      animation: "carbonSpin .8s linear infinite",
    }}>
      <style>{`@keyframes carbonSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

window.PublishWizardScreen = PublishWizardScreen;
