/* global React */
// ─────────────────────────────────────────────────────────────
// Carbon — New / Edit App drawer
// ─────────────────────────────────────────────────────────────

const { useState: useStateN, useEffect: useEffectN, useMemo: useMemoN } = React;

function AppFormScreen({ mode, app, onClose, onSave }) {
  const isEdit = mode === "edit" && !!app;
  const [name, setName] = useStateN("");
  const [pkg, setPkg] = useStateN("");
  const [category, setCategory] = useStateN("Payments");
  const [description, setDescription] = useStateN("");
  const [devices, setDevices] = useStateN(new Set());
  const [iconId, setIconId] = useStateN("pos");
  const [pkgState, setPkgState] = useStateN(""); // empty | checking | ok | taken | invalid

  useEffectN(() => {
    if (isEdit && app) {
      setName(app.name);
      setPkg(app.package);
      setCategory(app.category);
      setDescription(app.description);
      setDevices(new Set(app.devices));
      setIconId(app.iconId);
      setPkgState("ok");
    } else {
      setName("");
      setPkg("");
      setCategory("Payments");
      setDescription("");
      setDevices(new Set());
      setIconId("pos");
      setPkgState("");
    }
  }, [isEdit, app?.id]);

  // Simulated async package-name validation
  useEffectN(() => {
    if (isEdit) return;
    if (!pkg) { setPkgState(""); return; }
    if (!/^([a-z][a-z0-9_]*)(\.[a-z][a-z0-9_]*){2,}$/i.test(pkg)) {
      setPkgState("invalid"); return;
    }
    setPkgState("checking");
    const t = setTimeout(() => {
      const taken = window.APPS.some(a => a.package === pkg);
      setPkgState(taken ? "taken" : "ok");
    }, 450);
    return () => clearTimeout(t);
  }, [pkg, isEdit]);

  const canSave = name.trim().length > 1 && pkgState === "ok" && devices.size > 0;

  const toggleDevice = (id) => {
    const next = new Set(devices);
    if (next.has(id)) next.delete(id); else next.add(id);
    setDevices(next);
  };

  const iconOptions = ["pos", "inventory", "loyalty", "reporting", "catalog", "delivery", "timeclock", "giftcard"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        background: "var(--color-bg-2)",
        borderBottom: "1px solid var(--color-border-subtle)",
        padding: "14px 24px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={onClose} style={{ color: "var(--color-text-tertiary)", padding: 2 }} title="Back">
          <window.Ico name="chevl" size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
            {isEdit ? `Edit ${app?.name}` : "New app"}
          </h1>
          <div style={{ marginTop: 2, fontSize: 12, color: "var(--color-text-tertiary)" }}>
            {isEdit ? "Update display metadata. The package name is fixed once published."
                    : "Create a new app entry. You'll be able to upload an APK once basic info is filled in."}
          </div>
        </div>
        <window.Button onClick={onClose}>Cancel</window.Button>
        <window.Button primary disabled={!canSave} icon={isEdit ? "check" : "plus"}
          onClick={() => { onSave && onSave({ name, pkg, category, description, devices, iconId }); onClose(); }}>
          {isEdit ? "Save changes" : "Create app"}
        </window.Button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", background: "var(--color-bg-1)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 24px 32px",
          display: "flex", flexDirection: "column", gap: 16 }}>

          <window.Card title="Identity">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <window.Field label="App icon">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <window.AppIcon id={iconId} size={56} radius={12} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, flex: 1 }}>
                    {iconOptions.map(o => (
                      <button key={o} onClick={() => setIconId(o)} style={{
                        padding: 0, borderRadius: 6,
                        border: "2px solid",
                        borderColor: iconId === o ? "var(--color-primary-500)" : "transparent",
                        background: "transparent",
                      }}>
                        <window.AppIcon id={o} size={32} radius={5} />
                      </button>
                    ))}
                  </div>
                </div>
              </window.Field>

              <window.Field label="App name" required>
                <window.Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme POS Pro" />
              </window.Field>

              <window.Field label="Package name" required
                hint={isEdit ? "Cannot be changed once an app has been published" : "Reverse-domain notation. Must be globally unique across the Carbon catalog."}
                error={pkgState === "invalid" ? "Invalid format — use reverse-domain notation, e.g. com.company.app"
                      : pkgState === "taken" ? "This package name is already taken by another publisher." : null}>
                <window.Input value={pkg} onChange={(e) => setPkg(e.target.value)}
                  placeholder="com.acme.curbside" mono disabled={isEdit}
                  suffix={
                    pkgState === "checking" ? <Spinner size={11} /> :
                    pkgState === "ok"       ? <window.Ico name="check" size={13} style={{ color: "var(--color-success-500)" }} stroke={2.5} /> :
                    pkgState === "taken"    ? <window.Ico name="x"     size={13} style={{ color: "var(--color-error-500)"  }} stroke={2.5} /> :
                    pkgState === "invalid"  ? <window.Ico name="alert" size={13} style={{ color: "var(--color-error-500)"  }} /> : null
                  } />
                {pkgState === "ok" && !isEdit && (
                  <div style={{ marginTop: 5, fontSize: 11, color: "var(--color-success-500)", display: "flex", alignItems: "center", gap: 5 }}>
                    <window.Ico name="check" size={11} stroke={2.5} /> Available
                  </div>
                )}
              </window.Field>

              <window.Field label="Category" required>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Payments", "Operations", "Customer", "Analytics", "Utility"].map(c => (
                    <button key={c} onClick={() => setCategory(c)} style={{
                      padding: "5px 11px", borderRadius: 999, fontSize: 12,
                      background: category === c ? "var(--color-primary-50)" : "var(--color-bg-2)",
                      border: "1px solid",
                      borderColor: category === c ? "var(--color-primary-500)" : "var(--color-border-default)",
                      color: category === c ? "var(--color-primary-700)" : "var(--color-text-secondary)",
                      fontWeight: category === c ? 500 : 400,
                    }}>{c}</button>
                  ))}
                </div>
              </window.Field>

              <window.Field label="Description"
                hint="Up to 500 characters · Shown to merchants in the install prompt">
                <window.Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={4} placeholder="Describe what this app does and who it's for." />
              </window.Field>
            </div>
          </window.Card>

          <window.Card title="Device compatibility"
            hint={`${devices.size} of ${window.DEVICE_MODELS.length} models selected · Subscribers can only install on supported models.`}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
              {window.DEVICE_MODELS.map(d => {
                const on = devices.has(d.id);
                return (
                  <button key={d.id} onClick={() => toggleDevice(d.id)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 11px",
                    background: on ? "var(--color-primary-50)" : "var(--color-bg-2)",
                    border: "1px solid",
                    borderColor: on ? "var(--color-primary-500)" : "var(--color-border-default)",
                    borderRadius: 7, textAlign: "left",
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      background: on ? "var(--color-primary-600)" : "transparent",
                      border: "1px solid",
                      borderColor: on ? "var(--color-primary-600)" : "var(--color-border-default)",
                      display: "grid", placeItems: "center",
                      color: "white", flexShrink: 0,
                    }}>
                      {on && <window.Ico name="check" size={10} stroke={2.5} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{d.id}</div>
                      <div style={{ fontSize: 10.5, color: "var(--color-text-tertiary)" }} className="truncate">{d.blurb}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </window.Card>
        </div>
      </div>

      {/* Sticky footer */}
      <footer style={{
        padding: "12px 24px",
        borderTop: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-2)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ flex: 1, fontSize: 11.5, color: "var(--color-text-tertiary)" }}>
          {isEdit ? "Changes will be saved to this app's metadata."
                  : <>To start versioning, upload an APK after the app is created.</>}
        </div>
        <window.Button onClick={onClose}>Cancel</window.Button>
        <window.Button primary disabled={!canSave} icon={isEdit ? "check" : "plus"}
          onClick={() => { onSave && onSave({ name, pkg, category, description, devices, iconId }); onClose(); }}>
          {isEdit ? "Save changes" : "Create app"}
        </window.Button>
      </footer>
    </div>
  );
}

function Spinner({ size = 12 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: "1.5px solid var(--color-bg-3)",
      borderTopColor: "var(--color-primary-600)",
      animation: "carbonSpin .8s linear infinite",
    }} />
  );
}

window.AppFormScreen = AppFormScreen;
