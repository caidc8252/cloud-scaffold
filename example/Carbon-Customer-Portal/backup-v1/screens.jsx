/* global React */
// ─────────────────────────────────────────────────────────────
// Carbon — Screens: AppsList · AppDetail · VersionDetail
// ─────────────────────────────────────────────────────────────

const { useState: useStateS, useMemo: useMemoS } = React;

// ─── Reusable: device-model chip ──────────────────────────
function DeviceChip({ id, removable, onRemove }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 7px 2px 8px", borderRadius: 4,
      background: "var(--bg-sunken)",
      border: "1px solid var(--border-subtle)",
      fontSize: 11, fontFamily: "var(--font-mono)",
      color: "var(--fg-secondary)", letterSpacing: "0.01em",
    }}>
      {id}
      {removable && (
        <button onClick={onRemove} style={{ color: "var(--fg-quaternary)", padding: 0, marginLeft: 1 }}>
          <window.Ico name="x" size={10} />
        </button>
      )}
    </span>
  );
}

// ─── App row icon + name ───────────────────────────────────
function AppMeta({ app, size = 36, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <window.AppIcon id={app.iconId} size={size} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-primary)" }} className="tm-truncate">{app.name}</div>
        <div className="mono tm-truncate" style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>{sub || app.package}</div>
      </div>
    </div>
  );
}

// ─── Apps list screen ─────────────────────────────────────
function AppsListScreen({ navigate, openNewApp, openPublishWizard }) {
  const apps = window.APPS;
  const [q, setQ] = useStateS("");
  const [category, setCategory] = useStateS("all");
  const cats = useMemoS(() => ["all", ...new Set(apps.map(a => a.category))], [apps]);
  const filtered = apps.filter(a =>
    (category === "all" || a.category === category) &&
    (q === "" || a.name.toLowerCase().includes(q.toLowerCase()) || a.package.toLowerCase().includes(q.toLowerCase()))
  );

  const totals = {
    apps: apps.length,
    published: apps.filter(a => a.status === "published").length,
    pending: apps.filter(a => a.status === "pending").length,
    drafts: apps.filter(a => a.status === "draft").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Page header */}
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>Apps</h1>
            <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--fg-tertiary)" }}>
              Manage the applications you publish to TOMS terminals. Each app belongs to a unique package
              and may target one or more device models in the Carbon catalog.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <window.Button icon="upload" onClick={() => openPublishWizard(null)}>Upload version</window.Button>
            <window.Button primary icon="plus" onClick={openNewApp}>New app</window.Button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
          {[
            { label: "Total apps",        value: totals.apps,      sub: "in your catalog" },
            { label: "Published",         value: totals.published, sub: "live with subscribers", tone: "success" },
            { label: "Awaiting publish",  value: totals.pending,   sub: "in security review",   tone: "warning" },
            { label: "Drafts",            value: totals.drafts,    sub: "not yet uploaded" },
          ].map((k, i) => (
            <div key={i} style={{
              padding: "10px 14px", borderRadius: 8,
              background: "var(--bg-sunken)",
              border: "1px solid var(--border-subtle)",
            }}>
              <div style={{ fontSize: 11, color: "var(--fg-tertiary)", textTransform: "uppercase",
                letterSpacing: "0.05em", fontWeight: 500 }}>{k.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <span className="mono" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em",
                  color: k.tone === "success" ? "var(--success)" : k.tone === "warning" ? "var(--warning)" : "var(--fg-primary)" }}>
                  {k.value}
                </span>
                <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>{k.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 24px",
        borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
        <window.Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or package…"
          style={{ flex: 1, maxWidth: 360 }} />
        <div style={{ display: "flex", gap: 2, padding: 2,
          background: "var(--bg-sunken)", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: "3px 9px", fontSize: 11.5, borderRadius: 4,
              fontWeight: category === c ? 500 : 400,
              background: category === c ? "var(--bg-surface)" : "transparent",
              color: category === c ? "var(--fg-primary)" : "var(--fg-secondary)",
              boxShadow: category === c ? "var(--shadow-xs)" : "none",
              textTransform: "capitalize",
            }}>{c}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11.5, color: "var(--fg-tertiary)" }}>
            <span className="mono">{filtered.length}</span> of <span className="mono">{apps.length}</span>
          </span>
          <window.Button size="sm" icon="filter" ghost>Advanced</window.Button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 24px", background: "var(--bg-app)" }}>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "var(--bg-sunken)", textAlign: "left" }}>
                {["App", "Category", "Latest version", "Devices", "Subscribers", "Status", ""].map((h, i) => (
                  <th key={i} style={{
                    padding: "8px 12px", fontSize: 11, fontWeight: 500,
                    color: "var(--fg-tertiary)", textTransform: "uppercase",
                    letterSpacing: "0.05em", borderBottom: "1px solid var(--border-subtle)",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => {
                const latest = app.versions[0];
                const st = window.APP_STATUS[app.status];
                return (
                  <tr key={app.id}
                      onClick={() => navigate({ screen: "appDetail", appId: app.id, tab: "overview" })}
                      style={{ cursor: "pointer", borderBottom: "1px solid var(--border-subtle)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px" }}><AppMeta app={app} /></td>
                    <td style={{ padding: "12px", color: "var(--fg-secondary)" }}>{app.category}</td>
                    <td style={{ padding: "12px" }}>
                      <div className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{latest.name}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>{latest.publishedAt || latest.uploadedAt}</div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxWidth: 200 }}>
                        {app.devices.slice(0, 3).map(d => <DeviceChip key={d} id={d} />)}
                        {app.devices.length > 3 && (
                          <span style={{ fontSize: 11, color: "var(--fg-tertiary)", padding: "2px 4px" }}>
                            +{app.devices.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span className="mono" style={{ fontWeight: 500 }}>{app.subscriberIds.length}</span>
                      <span style={{ color: "var(--fg-tertiary)", marginLeft: 4 }}>
                        / {window.CUSTOMERS.length}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}><window.Pill tone={st.tone} dot>{st.label}</window.Pill></td>
                    <td style={{ padding: "12px", color: "var(--fg-quaternary)" }}>
                      <window.Ico name="chevr" size={14} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── App detail screen (tabs) ─────────────────────────────
function AppDetailScreen({ app, route, navigate, openPublishWizard, openEditApp }) {
  const tab = route.tab || "overview";
  const latest = app.versions.find(v => v.current) || app.versions[0];
  const st = window.APP_STATUS[app.status];

  const tabs = [
    { id: "overview",    label: "Overview" },
    { id: "versions",    label: "Versions",     count: app.versions.length },
    { id: "subscribers", label: "Subscribers",  count: app.subscriberIds.length },
    { id: "devices",     label: "Compatibility",count: app.devices.length },
    { id: "settings",    label: "Settings" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "flex-start", gap: 16 }}>
          <window.AppIcon id={app.iconId} size={56} radius={12} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>{app.name}</h1>
              <window.Pill tone={st.tone} dot size="lg">{st.label}</window.Pill>
              <span style={{ fontSize: 11.5, color: "var(--fg-tertiary)" }}>·</span>
              <span style={{ fontSize: 11.5, color: "var(--fg-tertiary)" }}>{app.category}</span>
            </div>
            <div className="mono" style={{ marginTop: 3, fontSize: 12, color: "var(--fg-secondary)" }}>
              {app.package}
              <button style={{ color: "var(--fg-quaternary)", padding: "0 4px", marginLeft: 4 }} title="Copy package name">
                <window.Ico name="copy" size={11} />
              </button>
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 14, fontSize: 11.5, color: "var(--fg-tertiary)" }}>
              <span>Latest <span className="mono" style={{ color: "var(--fg-secondary)", fontWeight: 500 }}>{latest.name}</span></span>
              <span>·</span>
              <span><span className="mono" style={{ color: "var(--fg-secondary)" }}>{app.subscriberIds.length}</span> subscribers</span>
              <span>·</span>
              <span><span className="mono" style={{ color: "var(--fg-secondary)" }}>{app.devices.length}</span> device models</span>
              <span>·</span>
              <span><span className="mono" style={{ color: "var(--fg-secondary)" }}>{app.versions.length}</span> versions</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, paddingTop: 4, flexShrink: 0 }}>
            <window.Button icon="edit" onClick={() => openEditApp(app)}>Edit details</window.Button>
            <window.Button primary icon="upload" onClick={() => openPublishWizard(app)}>Upload new version</window.Button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, padding: "16px 16px 0" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => navigate({ ...route, tab: t.id })} style={{
              padding: "7px 12px",
              fontSize: 12.5, fontWeight: tab === t.id ? 500 : 400,
              color: tab === t.id ? "var(--fg-primary)" : "var(--fg-secondary)",
              borderBottom: "2px solid",
              borderColor: tab === t.id ? "var(--fg-primary)" : "transparent",
              marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              {t.label}
              {t.count != null && (
                <span className="mono" style={{
                  fontSize: 10.5, padding: "1px 5px", borderRadius: 4,
                  background: "var(--bg-sunken)",
                  color: "var(--fg-tertiary)",
                  border: "1px solid var(--border-subtle)",
                }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px 28px", background: "var(--bg-app)" }}>
        {tab === "overview"    && <AppOverview app={app} navigate={navigate} />}
        {tab === "versions"    && <AppVersions app={app} navigate={navigate} openPublishWizard={openPublishWizard} />}
        {tab === "subscribers" && <AppSubscribers app={app} />}
        {tab === "devices"     && <AppDevices app={app} />}
        {tab === "settings"    && <AppSettings app={app} />}
      </div>
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────
function AppOverview({ app, navigate }) {
  const latest = app.versions.find(v => v.current) || app.versions[0];
  const findings = latest.scan ? window.SCAN_FINDINGS_TEMPLATES[latest.scan] : null;
  const counts = findings ? window.summariseFindings(findings) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, maxWidth: 1280 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <window.Card title="About this app">
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--fg-secondary)" }}>{app.description}</p>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <window.KV label="Package" value={<span className="mono">{app.package}</span>} />
            <window.KV label="Category" value={app.category} />
            <window.KV label="Publisher" value="Acme Software Inc." />
            <window.KV label="First published" value="Jan 14, 2025" />
            <window.KV label="Created" value="Dec 22, 2024" />
            <window.KV label="Last activity" value={latest.publishedAt || latest.uploadedAt} />
          </div>
        </window.Card>

        <window.Card title="Latest version"
          hint={<span className="mono">{latest.name}</span>}
          action={
            <window.Button size="sm" icon="arrowR" iconRight="arrowR"
              onClick={() => navigate({ screen: "versionDetail", appId: app.id, versionId: latest.id })}>
              View details
            </window.Button>
          }>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
            <Stat label="Version" value={latest.name} sub={`code ${latest.code}`} mono />
            <Stat label="Size" value={latest.size} />
            <Stat label="Rollout" value={`${latest.rolloutPct || 0}%`}
              sub={`${latest.reach || 0} merchants`} />
            <Stat label="Target SDK" value={`API ${latest.targetSdk}`}
              sub={`min ${latest.minSdk}`} />
          </div>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px dashed var(--border-subtle)",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--fg-tertiary)", textTransform: "uppercase",
                letterSpacing: "0.05em", fontWeight: 500, marginBottom: 6 }}>Release notes</div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "var(--fg-secondary)" }}>{latest.notes}</p>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--fg-tertiary)", textTransform: "uppercase",
                letterSpacing: "0.05em", fontWeight: 500, marginBottom: 6 }}>Vulnerability scan</div>
              {counts ? (
                <>
                  <window.SeverityBar counts={counts} height={6} />
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => (
                      <window.Pill key={k} tone={window.SEVERITY[k].tone}>
                        <span className="mono" style={{ marginRight: 3 }}>{v}</span> {window.SEVERITY[k].label}
                      </window.Pill>
                    ))}
                    {Object.values(counts).every(v => v === 0) && (
                      <window.Pill tone="success" dot>No findings</window.Pill>
                    )}
                  </div>
                </>
              ) : (
                <window.Pill tone="neutral">Not scanned yet</window.Pill>
              )}
            </div>
          </div>
        </window.Card>

        {/* Recent version list (mini) */}
        <window.Card title="Recent versions"
          action={<window.Button size="sm" ghost iconRight="arrowR"
            onClick={() => navigate({ screen: "appDetail", appId: app.id, tab: "versions" })}>All versions</window.Button>}
          padding={0}>
          {app.versions.slice(0, 4).map((v, i) => {
            const vst = window.APP_STATUS[v.status];
            return (
              <div key={v.id} onClick={() => navigate({ screen: "versionDetail", appId: app.id, versionId: v.id })}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "10px 14px",
                  borderBottom: i < 3 && i < app.versions.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <div className="mono" style={{ width: 70, fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 500 }}>{v.name}</div>
                <div style={{ width: 110, fontSize: 11.5, color: "var(--fg-tertiary)" }}>
                  {v.publishedAt || v.uploadedAt}
                </div>
                <div style={{ flex: 1, fontSize: 12, color: "var(--fg-secondary)" }} className="tm-truncate">{v.notes}</div>
                <window.Pill tone={vst.tone} dot>{vst.label}</window.Pill>
                <window.Ico name="chevr" size={13} style={{ color: "var(--fg-quaternary)" }} />
              </div>
            );
          })}
        </window.Card>
      </div>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <window.Card title="Compatibility">
          <div style={{ fontSize: 11.5, color: "var(--fg-tertiary)", marginBottom: 8 }}>
            Targets <span className="mono" style={{ color: "var(--fg-secondary)" }}>{app.devices.length}</span> of {window.DEVICE_MODELS.length} Carbon device models
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {window.DEVICE_MODELS.map(d => {
              const supported = app.devices.includes(d.id);
              return (
                <span key={d.id} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: 4,
                  fontSize: 11, fontFamily: "var(--font-mono)",
                  background: supported ? "var(--bg-sunken)" : "transparent",
                  color: supported ? "var(--fg-primary)" : "var(--fg-quaternary)",
                  border: "1px solid",
                  borderColor: supported ? "var(--border-default)" : "var(--border-subtle)",
                  textDecoration: supported ? "none" : "line-through",
                }}>{d.id}</span>
              );
            })}
          </div>
        </window.Card>

        <window.Card title="Subscribers"
          action={<window.Button size="sm" ghost iconRight="arrowR"
            onClick={() => navigate({ screen: "appDetail", appId: app.id, tab: "subscribers" })}>All</window.Button>}
          padding={0}>
          {app.subscriberIds.slice(0, 6).map(cid => {
            const c = window.CUSTOMERS.find(x => x.id === cid);
            return (
              <div key={cid} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 14px",
                borderBottom: "1px solid var(--border-subtle)",
              }}>
                <div style={{ width: 22, height: 22, borderRadius: 5,
                  background: "var(--accent-50)", color: "var(--accent-700)",
                  display: "grid", placeItems: "center",
                  fontSize: 10.5, fontWeight: 600 }}>
                  {c.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }} className="tm-truncate">{c.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--fg-tertiary)" }}>{c.region}</div>
                </div>
                <span className="mono" style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>{c.terminals}</span>
              </div>
            );
          })}
        </window.Card>

        <window.Card title="Activity" padding={0}>
          {[
            { icon: "upload", t: "Version 4.3.2 uploaded", time: "May 09", user: "M. Hassan" },
            { icon: "shieldCheck", t: "Scan completed · 4 findings", time: "May 09" },
            { icon: "bolt",   t: "Published to 11 merchants",   time: "May 10" },
            { icon: "edit",   t: "Compatibility updated · +N750P", time: "May 02" },
          ].map((a, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px",
              borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none",
            }}>
              <window.Ico name={a.icon} size={13} style={{ color: "var(--fg-tertiary)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12 }} className="tm-truncate">{a.t}</div>
                {a.user && <div style={{ fontSize: 10.5, color: "var(--fg-tertiary)" }}>{a.user}</div>}
              </div>
              <span style={{ fontSize: 10.5, color: "var(--fg-quaternary)" }} className="mono">{a.time}</span>
            </div>
          ))}
        </window.Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, mono }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--fg-tertiary)", textTransform: "uppercase",
        letterSpacing: "0.05em", fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em",
        fontFamily: mono ? "var(--font-mono)" : "inherit" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--fg-tertiary)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Versions tab ────────────────────────────────────────
function AppVersions({ app, navigate, openPublishWizard }) {
  return (
    <div style={{ maxWidth: 1280 }}>
      <window.Card title="Version history" hint={`${app.versions.length} versions`}
        action={<window.Button size="sm" primary icon="upload" onClick={() => openPublishWizard(app)}>Upload version</window.Button>}
        padding={0}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              {["Version", "Code", "Size", "Uploaded", "Published", "Reach", "Scan", "Status", ""].map((h, i) => (
                <th key={i} style={{
                  padding: "8px 12px", fontSize: 11, fontWeight: 500,
                  color: "var(--fg-tertiary)", textTransform: "uppercase",
                  letterSpacing: "0.05em", borderBottom: "1px solid var(--border-subtle)",
                  whiteSpace: "nowrap", background: "var(--bg-sunken)",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {app.versions.map(v => {
              const vst = window.APP_STATUS[v.status];
              const findings = v.scan ? window.SCAN_FINDINGS_TEMPLATES[v.scan] : null;
              const counts = findings ? window.summariseFindings(findings) : null;
              return (
                <tr key={v.id}
                  onClick={() => navigate({ screen: "versionDetail", appId: app.id, versionId: v.id })}
                  style={{ cursor: "pointer", borderBottom: "1px solid var(--border-subtle)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 500 }}>{v.name}</span>
                      {v.current && <window.Pill tone="accent" size="sm">Current</window.Pill>}
                    </div>
                  </td>
                  <td style={{ padding: "12px", fontFamily: "var(--font-mono)", color: "var(--fg-tertiary)" }}>{v.code}</td>
                  <td style={{ padding: "12px", color: "var(--fg-secondary)" }}>{v.size}</td>
                  <td style={{ padding: "12px", color: "var(--fg-secondary)" }}>{v.uploadedAt}</td>
                  <td style={{ padding: "12px", color: "var(--fg-secondary)" }}>{v.publishedAt || <span style={{ color: "var(--fg-quaternary)" }}>—</span>}</td>
                  <td style={{ padding: "12px" }}>
                    <span className="mono" style={{ fontWeight: 500 }}>{v.reach || 0}</span>
                    <span style={{ color: "var(--fg-tertiary)" }}> · {v.rolloutPct || 0}%</span>
                  </td>
                  <td style={{ padding: "12px", minWidth: 140 }}>
                    {counts ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 60 }}><window.SeverityBar counts={counts} height={5} /></div>
                        <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>
                          {counts.critical + counts.high > 0 && (
                            <span style={{ color: "var(--danger)", fontWeight: 500 }}>{counts.critical + counts.high} high+ </span>
                          )}
                          <span className="mono">{Object.values(counts).reduce((a, b) => a + b, 0)}</span> total
                        </span>
                      </div>
                    ) : <span style={{ color: "var(--fg-quaternary)", fontSize: 11 }}>—</span>}
                  </td>
                  <td style={{ padding: "12px" }}><window.Pill tone={vst.tone} dot>{vst.label}</window.Pill></td>
                  <td style={{ padding: "12px", color: "var(--fg-quaternary)" }}><window.Ico name="chevr" size={14} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </window.Card>
    </div>
  );
}

// ─── Subscribers tab ──────────────────────────────────────
function AppSubscribers({ app }) {
  const subs = app.subscriberIds.map(id => window.CUSTOMERS.find(c => c.id === id));
  const totalTerminals = subs.reduce((s, c) => s + c.terminals, 0);

  return (
    <div style={{ maxWidth: 1280, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Subscribed merchants", value: subs.length, sub: `of ${window.CUSTOMERS.length} on Carbon` },
          { label: "Total terminals", value: totalTerminals.toLocaleString(), sub: "live installations" },
          { label: "On latest version", value: subs.length, sub: "100% rollout", tone: "success" },
        ].map((k, i) => (
          <div key={i} style={{
            padding: "12px 16px", borderRadius: 8,
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          }}>
            <div style={{ fontSize: 11, color: "var(--fg-tertiary)", textTransform: "uppercase",
              letterSpacing: "0.05em", fontWeight: 500 }}>{k.label}</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 500, marginTop: 4,
              color: k.tone === "success" ? "var(--success)" : "var(--fg-primary)" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <window.Card title="Subscribed merchants" hint={`${subs.length} customers`} padding={0}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr>
              {["Merchant", "Region", "Tier", "Terminals", "Subscribed since", "On latest"].map((h, i) => (
                <th key={i} style={{
                  padding: "8px 12px", fontSize: 11, fontWeight: 500,
                  color: "var(--fg-tertiary)", textTransform: "uppercase",
                  letterSpacing: "0.05em", borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--bg-sunken)", textAlign: "left",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subs.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < subs.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5,
                      background: "var(--accent-50)", color: "var(--accent-700)",
                      display: "grid", placeItems: "center",
                      fontSize: 10.5, fontWeight: 600 }}>
                      {c.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", color: "var(--fg-secondary)" }}>{c.region}</td>
                <td style={{ padding: "10px 12px" }}>
                  <window.Pill tone={c.tier === "Enterprise" ? "accent" : c.tier === "Standard" ? "neutral" : "neutral"} size="sm">{c.tier}</window.Pill>
                </td>
                <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)" }}>{c.terminals}</td>
                <td style={{ padding: "10px 12px", color: "var(--fg-secondary)" }}>Jan 2025</td>
                <td style={{ padding: "10px 12px" }}>
                  <window.Pill tone="success" dot size="sm">Up to date</window.Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </window.Card>
    </div>
  );
}

// ─── Devices/compatibility tab ────────────────────────────
function AppDevices({ app }) {
  const [selected, setSelected] = useStateS(new Set(app.devices));
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  return (
    <div style={{ maxWidth: 1280, display: "flex", flexDirection: "column", gap: 16 }}>
      <window.Card title="Compatible device models"
        hint="Choose which Carbon devices this app supports. Subscribers can only install on supported models.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {window.DEVICE_MODELS.map(d => {
            const on = selected.has(d.id);
            return (
              <button key={d.id} onClick={() => toggle(d.id)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px",
                background: on ? "var(--accent-50)" : "var(--bg-surface)",
                border: "1px solid",
                borderColor: on ? "var(--accent-500)" : "var(--border-default)",
                borderRadius: 8, textAlign: "left",
                boxShadow: on ? "0 0 0 3px oklch(58% 0.22 270 / 0.08)" : "none",
                transition: "all .12s",
              }}>
                <div style={{
                  width: 38, height: 50, borderRadius: 4,
                  background: on ? "var(--accent-gradient)" : "var(--bg-sunken)",
                  border: "1px solid",
                  borderColor: on ? "transparent" : "var(--border-default)",
                  display: "grid", placeItems: "center",
                  color: on ? "var(--fg-on-accent)" : "var(--fg-tertiary)",
                }}>
                  <window.Ico name="device" size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-primary)" }}>{d.id}</div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-tertiary)", marginTop: 1 }}>{d.blurb}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: on ? "var(--accent-600)" : "var(--bg-surface)",
                  border: "1px solid",
                  borderColor: on ? "var(--accent-600)" : "var(--border-default)",
                  display: "grid", placeItems: "center",
                  color: "white", flexShrink: 0,
                }}>
                  {on && <window.Ico name="check" size={11} stroke={2.5} />}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--border-subtle)",
          display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--fg-tertiary)" }}>
          <window.Ico name="info" size={13} />
          <span><span className="mono" style={{ color: "var(--fg-primary)", fontWeight: 500 }}>{selected.size}</span> of {window.DEVICE_MODELS.length} models selected.
            Existing subscribers on unsupported models will keep the previous version.</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <window.Button size="sm" ghost onClick={() => setSelected(new Set(app.devices))}>Revert</window.Button>
            <window.Button size="sm" primary>Save changes</window.Button>
          </div>
        </div>
      </window.Card>
    </div>
  );
}

// ─── Settings tab ─────────────────────────────────────────
function AppSettings({ app }) {
  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
      <window.Card title="Basic information">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <window.Field label="App name" required>
            <window.Input value={app.name} />
          </window.Field>
          <window.Field label="Package name"
            hint={<span>Globally unique. Cannot be changed once an app has been published.</span>}>
            <window.Input value={app.package} mono disabled />
          </window.Field>
          <window.Field label="Category">
            <window.Input value={app.category} />
          </window.Field>
          <window.Field label="Description">
            <window.Textarea value={app.description} rows={4} />
          </window.Field>
        </div>
      </window.Card>

      <window.Card title="Danger zone">
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Archive this app</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-tertiary)" }}>
              Existing installations keep working. New subscriptions are disabled.
            </div>
          </div>
          <window.Button danger>Archive</window.Button>
        </div>
      </window.Card>
    </div>
  );
}

// ─── Version detail screen ────────────────────────────────
function VersionDetailScreen({ app, version, navigate, route }) {
  const findings = version.scan ? window.SCAN_FINDINGS_TEMPLATES[version.scan] : null;
  const counts = findings ? window.summariseFindings(findings) : null;
  const totalFindings = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const vst = window.APP_STATUS[version.status];
  const subs = app.subscriberIds.slice(0, version.reach || 0).map(id => window.CUSTOMERS.find(c => c.id === id));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)",
        padding: "14px 24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate({ screen: "appDetail", appId: app.id, tab: "versions" })}
            style={{ color: "var(--fg-tertiary)" }}>
            <window.Ico name="chevl" size={16} />
          </button>
          <window.AppIcon id={app.iconId} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12.5, color: "var(--fg-secondary)" }}>{app.name}</span>
              <window.Ico name="chevr" size={11} style={{ color: "var(--fg-quaternary)" }} />
              <h1 className="mono" style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.005em" }}>{version.name}</h1>
              <span className="mono" style={{ fontSize: 11.5, color: "var(--fg-tertiary)" }}>· code {version.code}</span>
              <window.Pill tone={vst.tone} dot size="lg">{vst.label}</window.Pill>
              {version.current && <window.Pill tone="accent" size="lg">Current</window.Pill>}
            </div>
            <div className="mono" style={{ marginTop: 3, fontSize: 11.5, color: "var(--fg-tertiary)" }}>{app.package}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <window.Button icon="download">Download APK</window.Button>
            {version.status === "pending" && <window.Button primary icon="bolt">Publish now</window.Button>}
            {version.status === "published" && <window.Button danger icon="alert">Roll back</window.Button>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px 28px", background: "var(--bg-app)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, maxWidth: 1280 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Metadata */}
            <window.Card title="Build metadata">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                <window.KV label="Version name"  value={<span className="mono">{version.name}</span>} />
                <window.KV label="Version code"  value={<span className="mono">{version.code}</span>} />
                <window.KV label="APK size"      value={version.size} />
                <window.KV label="Min SDK"       value={`API ${version.minSdk} (Android 7.0)`} />
                <window.KV label="Target SDK"    value={`API ${version.targetSdk} (Android 14)`} />
                <window.KV label="Permissions"   value={`${version.perms} declared`} />
                <window.KV label="Uploaded"      value={`${version.uploadedAt} · by M. Hassan`} />
                <window.KV label="Published"     value={version.publishedAt || <span style={{ color: "var(--fg-tertiary)" }}>—</span>} />
                <window.KV label="Signing cert"  value={<span className="mono" style={{ fontSize: 11 }}>{version.signer || "Acme Software Inc. · SHA-256 d4:e2:8a:…"}</span>} mono copy />
              </div>
            </window.Card>

            {/* Vulnerability scan */}
            <window.Card title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <window.Ico name="shieldCheck" size={14} /> Vulnerability scan
              </span>
            }
              hint={counts ? `Last run · ${version.uploadedAt}` : "Scheduled"}
              action={<window.Button size="sm" ghost icon="refresh">Re-scan</window.Button>}>
              {!counts ? (
                <window.Empty icon="shield" title="Scan in progress" body="Findings will appear here once the asynchronous scan completes (typically 2–4 minutes)." />
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 14 }}>
                    {Object.entries(counts).map(([k, v]) => (
                      <div key={k} style={{
                        padding: "10px 12px", borderRadius: 7,
                        background: v > 0 ? "var(--bg-surface)" : "var(--bg-sunken)",
                        border: "1px solid",
                        borderColor: v > 0 && (k === "critical" || k === "high") ? "var(--danger)" : "var(--border-subtle)",
                        borderLeftWidth: 3,
                        borderLeftColor: window.SEVERITY[k].color,
                      }}>
                        <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em",
                          fontWeight: 500, color: "var(--fg-tertiary)" }}>{window.SEVERITY[k].label}</div>
                        <div className="mono" style={{ fontSize: 22, fontWeight: 500, marginTop: 2,
                          color: v > 0 ? window.SEVERITY[k].color : "var(--fg-quaternary)" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <window.SeverityBar counts={counts} height={6} />
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    {findings.map((f, i) => (
                      <FindingRow key={i} f={f} />
                    ))}
                  </div>
                </>
              )}
            </window.Card>

            {/* Release notes */}
            <window.Card title="Release notes">
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "var(--fg-secondary)" }}>{version.notes}</p>
            </window.Card>

            {/* Subscribers reached */}
            <window.Card title={`Subscribers reached · ${subs.length}`}
              hint={`${version.rolloutPct || 0}% rollout`}
              padding={0}>
              {subs.length === 0 ? (
                <div style={{ padding: 16 }}>
                  <window.Empty icon="users" title="Not yet distributed"
                    body="This version is held for review. Once published, subscribed customers will appear here." />
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      {["Merchant", "Tier", "Terminals", "Installed", "Status"].map((h, i) => (
                        <th key={i} style={{
                          padding: "8px 12px", fontSize: 11, fontWeight: 500,
                          color: "var(--fg-tertiary)", textTransform: "uppercase",
                          letterSpacing: "0.05em", borderBottom: "1px solid var(--border-subtle)",
                          background: "var(--bg-sunken)", textAlign: "left",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((c, i) => (
                      <tr key={c.id} style={{ borderBottom: i < subs.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 22, height: 22, borderRadius: 5,
                              background: "var(--accent-50)", color: "var(--accent-700)",
                              display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 600 }}>
                              {c.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                            </div>
                            <span style={{ fontSize: 12.5, fontWeight: 500 }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <window.Pill tone={c.tier === "Enterprise" ? "accent" : "neutral"} size="sm">{c.tier}</window.Pill>
                        </td>
                        <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)" }}>{c.terminals}</td>
                        <td style={{ padding: "10px 12px", color: "var(--fg-secondary)" }}>
                          <span className="mono">{Math.round(c.terminals * 0.96)}</span>
                          <span style={{ color: "var(--fg-tertiary)" }}> / {c.terminals}</span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <window.Pill tone="success" dot size="sm">Installed</window.Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </window.Card>
          </div>

          {/* Right rail */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <window.Card title="Rollout">
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="mono" style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }}>{version.rolloutPct || 0}</span>
                <span style={{ fontSize: 13, color: "var(--fg-tertiary)" }}>%</span>
              </div>
              <div style={{ marginTop: 6, height: 6, borderRadius: 999, background: "var(--bg-sunken)", overflow: "hidden" }}>
                <div style={{ width: `${version.rolloutPct || 0}%`, height: "100%", background: "var(--accent-gradient)" }} />
              </div>
              <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--fg-tertiary)", display: "flex", flexDirection: "column", gap: 4 }}>
                <div>Reach: <span style={{ color: "var(--fg-primary)", fontWeight: 500 }}><span className="mono">{version.reach || 0}</span> merchants</span></div>
                <div>Scope: <span style={{ color: "var(--fg-primary)" }}>All subscribers</span></div>
                <div>Strategy: <span style={{ color: "var(--fg-primary)" }}>Immediate</span></div>
              </div>
            </window.Card>

            <window.Card title="Compatibility">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {app.devices.map(d => <DeviceChip key={d} id={d} />)}
              </div>
            </window.Card>

            <window.Card title="Timeline" padding={0}>
              {[
                { icon: "upload",      t: "APK uploaded",        time: version.uploadedAt, user: "M. Hassan" },
                { icon: "shieldCheck", t: counts ? `Scan completed · ${totalFindings} findings` : "Scan in progress", time: version.uploadedAt },
                version.publishedAt && { icon: "bolt",     t: `Published to ${version.reach} merchants`, time: version.publishedAt },
                version.publishedAt && { icon: "check",    t: `${Math.round((version.reach || 0) * 0.93)} merchants on this version`, time: "today" },
              ].filter(Boolean).map((a, i, arr) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 14px",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none",
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5,
                    background: "var(--bg-sunken)", color: "var(--fg-secondary)",
                    display: "grid", placeItems: "center", flexShrink: 0,
                    border: "1px solid var(--border-subtle)" }}>
                    <window.Ico name={a.icon} size={11} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 450 }}>{a.t}</div>
                    <div style={{ fontSize: 10.5, color: "var(--fg-tertiary)", marginTop: 1 }}>
                      <span className="mono">{a.time}</span>{a.user && <span> · {a.user}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </window.Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function FindingRow({ f }) {
  const [open, setOpen] = useStateS(false);
  const sev = window.SEVERITY[f.sev];
  return (
    <div style={{
      border: "1px solid var(--border-subtle)",
      borderRadius: 7,
      borderLeft: "3px solid", borderLeftColor: sev.color,
      background: "var(--bg-surface)",
      overflow: "hidden",
    }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", width: "100%", textAlign: "left",
      }}>
        <window.Pill tone={sev.tone} size="sm">{sev.label}</window.Pill>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{f.title}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-tertiary)", marginTop: 1 }}>
            {f.cve ? <span>{f.cve} · </span> : null}{f.pkg}
          </div>
        </div>
        <window.Ico name={open ? "chevu" : "chevd"} size={13} style={{ color: "var(--fg-tertiary)" }} />
      </button>
      {open && (
        <div style={{
          padding: "10px 14px 12px 14px",
          background: "var(--bg-sunken)",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: 12, color: "var(--fg-secondary)", lineHeight: 1.55,
        }}>
          <div style={{ marginBottom: 8 }}>{f.desc}</div>
          <div style={{ display: "flex", gap: 18, fontSize: 11.5 }}>
            <div><span style={{ color: "var(--fg-tertiary)" }}>Detected in:</span> <span className="mono">{f.version}</span></div>
            <div><span style={{ color: "var(--fg-tertiary)" }}>Recommendation:</span> <span className="mono">{f.fix}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  AppsListScreen, AppDetailScreen, VersionDetailScreen, AppMeta, DeviceChip,
});
