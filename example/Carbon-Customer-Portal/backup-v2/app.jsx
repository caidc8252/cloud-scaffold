/* global React, ReactDOM */
// ─────────────────────────────────────────────────────────────
// Carbon ISV Console — top-level app + routing
// ─────────────────────────────────────────────────────────────

const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA } = React;

// Tweakable defaults — host can rewrite these via __edit_mode_set_keys
const DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "density": "comfortable",
  "scenario": "active",
  "accent": "indigo"
}/*EDITMODE-END*/;

const ACCENT_PRESETS = {
  indigo: { p50: "oklch(97% 0.012 262)", p200: "oklch(86% 0.06 262)", p500: "oklch(40% 0.14 262)",
            p600: "oklch(32% 0.10 262)", p700: "oklch(24% 0.06 262)" },
  cyan:   { p50: "oklch(97% 0.02 220)",  p200: "oklch(86% 0.08 220)", p500: "oklch(56% 0.14 220)",
            p600: "oklch(42% 0.12 220)", p700: "oklch(30% 0.10 220)" },
  emerald:{ p50: "oklch(96% 0.03 160)",  p200: "oklch(86% 0.08 160)", p500: "oklch(54% 0.14 158)",
            p600: "oklch(42% 0.13 158)", p700: "oklch(30% 0.10 158)" },
  graphite:{p50: "oklch(96% 0.005 270)", p200: "oklch(82% 0.008 270)", p500: "oklch(36% 0.01 270)",
            p600: "oklch(28% 0.01 270)", p700: "oklch(22% 0.01 270)" },
};

function App() {
  const [t, setTweak] = window.useTweaks(DEFAULTS);
  const [route, setRoute] = useStateA({ screen: "apps" });
  const [apps, setApps] = useStateA(window.APPS);

  const [toast, setToast] = useStateA(null);

  // Apply accent preset
  useEffectA(() => {
    const p = ACCENT_PRESETS[t.accent] || ACCENT_PRESETS.indigo;
    const root = document.documentElement;
    root.style.setProperty("--color-primary-50",  p.p50);
    root.style.setProperty("--color-primary-200", p.p200);
    root.style.setProperty("--color-primary-500", p.p500);
    root.style.setProperty("--color-primary-600", p.p600);
    root.style.setProperty("--color-primary-700", p.p700);
  }, [t.accent]);

  useEffectA(() => {
    document.documentElement.setAttribute("data-theme", t.theme === "dark" ? "dark" : "light");
  }, [t.theme]);

  // Showing a toast
  const showToast = (message, tone = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  };

  // Find current app from route
  const currentApp = route.appId ? apps.find(a => a.id === route.appId) : null;
  const currentVersion = currentApp && route.versionId
    ? currentApp.versions.find(v => v.id === route.versionId) : null;

  // Navigation helpers
  const goApps      = () => setRoute({ screen: "apps" });
  const goAppDetail = (appId, tab = "overview") => setRoute({ screen: "appDetail", appId, tab });
  const openNewApp  = () => setRoute({ screen: "newApp" });
  const openEditApp = (a) => setRoute({ screen: "editApp", appId: a.id });
  const openPublishWizard = (a) => setRoute({ screen: "publishWizard", appId: a ? a.id : apps[0].id });

  // Density var
  const densityFontSize = t.density === "compact" ? 12.5 : t.density === "spacious" ? 14 : 13;

  return (
    <div className="carbon-root" style={{ fontSize: densityFontSize, display: "flex", flexDirection: "row" }}>
      <window.Sidebar route={route} navigate={setRoute} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <window.TopBar
          crumbs={makeCrumbs(route, currentApp, currentVersion, setRoute)}
          actions={null} />
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {route.screen === "apps" && (
            <window.AppsListScreen
              navigate={setRoute}
              openNewApp={openNewApp}
              openPublishWizard={openPublishWizard} />
          )}
          {route.screen === "appDetail" && currentApp && (
            <window.AppDetailScreen
              app={currentApp} route={route} navigate={setRoute}
              openPublishWizard={openPublishWizard}
              openEditApp={openEditApp} />
          )}
          {route.screen === "versionDetail" && currentApp && currentVersion && (
            <window.VersionDetailScreen
              app={currentApp} version={currentVersion}
              route={route} navigate={setRoute} />
          )}
          {route.screen === "newApp" && (
            <window.AppFormScreen mode="new" onClose={goApps}
              onSave={({ name, pkg, category, description, devices, iconId }) => {
                const newApp = {
                  id: pkg.replace(/\./g, "_"),
                  name, package: pkg, category, description,
                  devices: [...devices], iconId,
                  status: "draft", subscriberIds: [], versions: [],
                };
                setApps([newApp, ...apps]);
                showToast(`${name} created · upload an APK to start versioning`);
                goApps();
              }} />
          )}
          {route.screen === "editApp" && currentApp && (
            <window.AppFormScreen mode="edit" app={currentApp}
              onClose={() => goAppDetail(currentApp.id)}
              onSave={({ name, pkg, category, description, devices, iconId }) => {
                setApps(apps.map(a => a.id === currentApp.id
                  ? { ...a, name, package: pkg, category, description, devices: [...devices], iconId } : a));
                showToast(`${name} updated`);
                goAppDetail(currentApp.id);
              }} />
          )}
          {route.screen === "publishWizard" && currentApp && (
            <window.PublishWizardScreen app={currentApp}
              onClose={() => goAppDetail(currentApp.id, "versions")}
              onPublish={(payload) => {
                showToast(`Version ${payload.parsed?.version} published to ${Math.round(payload.reachCount * payload.rolloutPct / 100)} merchants`);
                goAppDetail(currentApp.id, "versions");
              }} />
          )}
          {(route.screen === "home"      || route.screen === "versions"
         || route.screen === "devices"   || route.screen === "merchants"
         || route.screen === "settings") && (
            <PlaceholderScreen route={route} />
          )}
        </div>
      </main>

      <window.Toast toast={toast} onClose={() => setToast(null)} />

      <window.TweaksPanel>
        <window.TweakSection label="Appearance" />
        <window.TweakRadio  label="Theme"   value={t.theme}   options={["light", "dark"]}
                            onChange={(v) => setTweak("theme", v)} />
        <window.TweakSelect label="Density" value={t.density} options={["compact", "comfortable", "spacious"]}
                            onChange={(v) => setTweak("density", v)} />
        <window.TweakSelect label="Accent"  value={t.accent}  options={["indigo", "cyan", "emerald", "graphite"]}
                            onChange={(v) => setTweak("accent", v)} />
        <window.TweakSection label="Demo data" />
        <window.TweakSelect label="Scenario" value={t.scenario}
                            options={["fresh", "active", "audit"]}
                            onChange={(v) => setTweak("scenario", v)} />
        <window.TweakSection label="Jump to" />
        <window.TweakButton onClick={() => setRoute({ screen: "apps" })}>Apps list</window.TweakButton>
        <window.TweakButton onClick={() => setRoute({ screen: "appDetail", appId: "pos", tab: "overview" })}>App detail · Acme POS Pro</window.TweakButton>
        <window.TweakButton onClick={() => setRoute({ screen: "appDetail", appId: "pos", tab: "versions" })}>Version history</window.TweakButton>
        <window.TweakButton onClick={() => setRoute({ screen: "versionDetail", appId: "loyalty", versionId: "v07" })}>Version detail · Loyalty+ rc1</window.TweakButton>
        <window.TweakButton onClick={() => { setRoute({ screen: "publishWizard", appId: "pos" }); }}>Open publish wizard</window.TweakButton>
        <window.TweakButton onClick={() => { setRoute({ screen: "newApp" }); }}>Open "new app" form</window.TweakButton>
      </window.TweaksPanel>
    </div>
  );
}

// ─── Breadcrumbs ──────────────────────────────────────────
function makeCrumbs(route, app, version, navigate) {
  const home = { label: "Apps", href: true, onClick: () => navigate({ screen: "apps" }) };
  if (route.screen === "apps")          return [home];
  if (route.screen === "home")          return [{ label: "Home" }];
  if (route.screen === "versions")      return [{ label: "Versions" }];
  if (route.screen === "devices")       return [{ label: "Device Models" }];
  if (route.screen === "merchants")     return [{ label: "Merchants" }];
  if (route.screen === "settings")      return [{ label: "Settings" }];
  if (route.screen === "newApp")        return [home, { label: "New app" }];
  if (route.screen === "editApp" && app)
    return [home,
      { label: app.name, href: true, onClick: () => navigate({ screen: "appDetail", appId: app.id, tab: "overview" }) },
      { label: "Edit details" }];
  if (route.screen === "publishWizard" && app)
    return [home,
      { label: app.name, href: true, onClick: () => navigate({ screen: "appDetail", appId: app.id, tab: "overview" }) },
      { label: "Versions", href: true, onClick: () => navigate({ screen: "appDetail", appId: app.id, tab: "versions" }) },
      { label: "Upload new version" }];
  if (route.screen === "appDetail" && app)
    return [home, { label: app.name, href: true, onClick: () => navigate({ screen: "appDetail", appId: app.id, tab: "overview" }) }];
  if (route.screen === "versionDetail" && app && version)
    return [
      home,
      { label: app.name, href: true, onClick: () => navigate({ screen: "appDetail", appId: app.id, tab: "overview" }) },
      { label: "Versions", href: true, onClick: () => navigate({ screen: "appDetail", appId: app.id, tab: "versions" }) },
      { label: version.name, mono: true },
    ];
  return [home];
}

// ─── Placeholder for unfocused sidebar routes ─────────────
function PlaceholderScreen({ route }) {
  const labels = {
    home: "Home",
    versions: "Versions",
    devices: "Device Models",
    merchants: "Merchants",
    settings: "Settings",
  };
  return (
    <div style={{ padding: 40, height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg-1)" }}>
      <window.Empty
        icon={route.screen === "devices" ? "device" : route.screen === "merchants" ? "store" : route.screen === "settings" ? "settings" : "doc"}
        title={`${labels[route.screen] || route.screen} — coming next`}
        body={`This area is part of the Carbon ISV console roadmap. The Apps experience is the focus of this preview.`} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
