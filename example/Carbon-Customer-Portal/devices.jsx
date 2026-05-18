/* global React */
// ─────────────────────────────────────────────────────────────
// Carbon — Devices (production fleet) — ISO-only
// Each device is a physical terminal an ISO has activated and now operates.
// Scope per the product spec:
//   1. Basic identity     — SN, model, OS/firmware, activated/created, last seen
//   2. Hardware posture   — root, dev-mode, security warnings
//   3. Network            — SIM, ethernet, Wi-Fi (SSID)
//   4. Pre-installed apps — name, version, installed-at, system flag, logo
//   5. System settings    — timezone, language, auto-sync flags
// We keep this read-mostly: an ISO inspects a device, occasionally re-binds
// or reboots; we don't replicate the device's own settings UI in here.
// ─────────────────────────────────────────────────────────────

const { useState: useStateD, useMemo: useMemoD, useEffect: useEffectD } = React;

// ─── Seed data ──────────────────────────────────────────────
// Six representative devices spanning each Carbon model and most flag
// combinations (root, dev-mode, security alerts) so the detail page shows
// realistic variation.
const DEVICES_SEED = [
  {
    sn: "N950-0014-9281", model: "N950",
    os: "Android 14", firmware: "TOMS 8.2.1-r127", buildNumber: "8.2.1.127.prod",
    activatedAt: "Feb 14, 2025",   createdAt: "Feb 10, 2025",   lastSeenAt: "5 min ago",
    state: "active", merchantId: "m-coffee", storeId: "s-coffee-hq",
    imei: "354782109876541", macAddress: "C8:E0:EB:14:9A:28",
    storage: { total: 32, used: 11.4 },        // GB
    battery: { level: 87, health: "good" },
    hardware: { root: false, devMode: false,  securityWarnings: [] },
    network:  { sim: { enabled: true,  carrier: "Bell" },
                ethernet: { enabled: false },
                wifi: { enabled: true,  ssid: "Riverside-POS" } },
    settings: { timezone: "America/Toronto", language: "en-CA",
                autoTimezone: true, autoTime: true },
    apps: [
      { id: "pos",      name: "Acme POS Pro",  version: "4.3.2",   installedAt: "May 10, 2025", system: false },
      { id: "loyalty",  name: "Loyalty+",      version: "1.3.4",   installedAt: "Apr 20, 2025", system: false },
      { id: "toms-mdm", name: "TOMS MDM",      version: "5.1.0",   installedAt: "Feb 14, 2025", system: true  },
      { id: "toms-pay", name: "TOMS PayCore",  version: "3.8.2",   installedAt: "Feb 14, 2025", system: true  },
      { id: "android",  name: "Android System", version: "14",     installedAt: "Feb 14, 2025", system: true  },
    ],
  },
  {
    sn: "N950-0014-3322", model: "N950",
    os: "Android 14", firmware: "TOMS 8.2.1-r127", buildNumber: "8.2.1.127.prod",
    activatedAt: "Nov 04, 2024", createdAt: "Oct 28, 2024", lastSeenAt: "just now",
    state: "active", merchantId: "m-bistro", storeId: "s-bistro-hq",
    imei: "354782109876702", macAddress: "C8:E0:EB:14:33:22",
    storage: { total: 32, used: 14.8 },
    battery: { level: 64, health: "good" },
    hardware: { root: false, devMode: false, securityWarnings: [] },
    network: { sim: { enabled: true, carrier: "Telus" },
               ethernet: { enabled: false },
               wifi: { enabled: true, ssid: "CascadeBistro-Guest" } },
    settings: { timezone: "America/Vancouver", language: "en-CA",
                autoTimezone: true, autoTime: true },
    apps: [
      { id: "pos",      name: "Acme POS Pro",  version: "4.3.2",  installedAt: "May 11, 2025", system: false },
      { id: "loyalty",  name: "Loyalty+",      version: "1.3.4",  installedAt: "Apr 22, 2025", system: false },
      { id: "toms-mdm", name: "TOMS MDM",      version: "5.1.0",  installedAt: "Nov 04, 2024", system: true  },
      { id: "toms-pay", name: "TOMS PayCore",  version: "3.8.2",  installedAt: "Nov 04, 2024", system: true  },
    ],
  },
  {
    sn: "S60-0488-0021", model: "S60",
    os: "Android 13", firmware: "TOMS 7.4.3-r88", buildNumber: "7.4.3.88.prod",
    activatedAt: "Sep 12, 2024", createdAt: "Aug 30, 2024", lastSeenAt: "3 days ago",
    state: "inactive", merchantId: "m-coffee", storeId: "s-coffee-pln",
    imei: "354782108821091", macAddress: "A0:B8:6E:04:88:21",
    storage: { total: 16, used: 5.2 },
    battery: { level: 12, health: "fair" },
    hardware: { root: false, devMode: true, securityWarnings: ["Developer options enabled"] },
    network: { sim: { enabled: false },
               ethernet: { enabled: false },
               wifi: { enabled: true, ssid: "Plateau-Back-2G" } },
    settings: { timezone: "America/Toronto", language: "fr-CA",
                autoTimezone: true, autoTime: false },
    apps: [
      { id: "pos",      name: "Acme POS Pro",  version: "4.2.5",  installedAt: "Mar 12, 2025", system: false },
      { id: "toms-mdm", name: "TOMS MDM",      version: "5.0.4",  installedAt: "Sep 12, 2024", system: true  },
      { id: "toms-pay", name: "TOMS PayCore",  version: "3.7.1",  installedAt: "Sep 12, 2024", system: true  },
    ],
  },
  {
    sn: "X800-0099-1422", model: "X800",
    os: "Android 14", firmware: "TOMS 8.2.0-r119", buildNumber: "8.2.0.119.prod",
    activatedAt: "Jan 20, 2025", createdAt: "Jan 15, 2025", lastSeenAt: "2 min ago",
    state: "active", merchantId: "m-glacier", storeId: "s-glacier-bby",
    imei: null, macAddress: "0C:8B:FD:99:14:22",
    storage: { total: 64, used: 24.0 },
    battery: null, // kiosk — line-powered
    hardware: { root: false, devMode: false, securityWarnings: [] },
    network: { sim: { enabled: false },
               ethernet: { enabled: true },
               wifi: { enabled: false } },
    settings: { timezone: "America/Vancouver", language: "en-CA",
                autoTimezone: true, autoTime: true },
    apps: [
      { id: "catalog",  name: "Catalog Sync", version: "1.0.9",  installedAt: "Apr 30, 2025", system: false },
      { id: "pos",      name: "Acme POS Pro", version: "4.3.2",  installedAt: "May 10, 2025", system: false },
      { id: "toms-mdm", name: "TOMS MDM",     version: "5.1.0",  installedAt: "Jan 20, 2025", system: true  },
      { id: "android",  name: "Android System", version: "14",   installedAt: "Jan 20, 2025", system: true  },
    ],
  },
  {
    sn: "N750-0099-0040", model: "N750",
    os: "Android 13", firmware: "TOMS 7.4.0-r71", buildNumber: "7.4.0.71.prod",
    activatedAt: "Jul 02, 2024", createdAt: "Jun 28, 2024", lastSeenAt: "11 hours ago",
    state: "active", merchantId: "m-coffee", storeId: "s-coffee-old",
    imei: "354782107770040", macAddress: "B4:CE:F6:09:00:40",
    storage: { total: 16, used: 7.1 },
    battery: { level: 45, health: "good" },
    hardware: { root: true, devMode: false,
                securityWarnings: ["Device appears to be rooted", "Bootloader unlock detected"] },
    network: { sim: { enabled: true, carrier: "Rogers" },
               ethernet: { enabled: false },
               wifi: { enabled: false } },
    settings: { timezone: "America/Toronto", language: "en-CA",
                autoTimezone: false, autoTime: false },
    apps: [
      { id: "pos",      name: "Acme POS Pro",  version: "4.3.1",  installedAt: "Apr 25, 2025", system: false },
      { id: "toms-mdm", name: "TOMS MDM",      version: "5.0.4",  installedAt: "Jul 02, 2024", system: true  },
    ],
  },
  {
    sn: "S90-0822-2007", model: "S90",
    os: "Android 14", firmware: "TOMS 8.2.1-r127", buildNumber: "8.2.1.127.prod",
    activatedAt: null, createdAt: "May 10, 2026", lastSeenAt: "never",
    state: "pending", merchantId: "m-bistro", storeId: "s-bistro-hq",
    imei: "354782108220007", macAddress: "C8:E0:EB:82:20:07",
    storage: { total: 32, used: 1.2 },
    battery: { level: 100, health: "new" },
    hardware: { root: false, devMode: false, securityWarnings: [] },
    network: { sim: { enabled: false },
               ethernet: { enabled: false },
               wifi: { enabled: false } },
    settings: { timezone: "America/Vancouver", language: "en-CA",
                autoTimezone: true, autoTime: true },
    apps: [
      { id: "toms-mdm", name: "TOMS MDM",      version: "5.1.0",  installedAt: "May 10, 2026", system: true },
    ],
  },
];

window.PROD_DEVICES = window.PROD_DEVICES || DEVICES_SEED.map(d => ({ ...d }));

function findDeviceBySn(sn) {
  return (window.PROD_DEVICES || []).find(d => d.sn === sn) || null;
}

// ─── State pill tone map ───────────────────────────────────
const DEVICE_STATE = {
  active:   { label: "Active",   tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  pending:  { label: "Pending",  tone: "info"    },
};

// ─── Latest firmware per model (target the fleet should be on) ──
// In a real system this is what the OEM publishes; here we hard-code so
// the Apps & Firmware tab can show an update-available state for some
// devices and "up-to-date" for others.
const TARGET_FIRMWARE = {
  N950: { version: "TOMS 8.2.2-r131", releasedAt: "May 08, 2026", notes: "Wi-Fi 6E driver fix, EMV kernel 1.4.7" },
  N750: { version: "TOMS 7.5.0-r92",  releasedAt: "Apr 22, 2026", notes: "Battery calibration, security patch level 2026-04" },
  S60:  { version: "TOMS 7.4.3-r88",  releasedAt: "Mar 11, 2026", notes: "Printer driver, security patch level 2026-03" },
  S90:  { version: "TOMS 8.2.2-r131", releasedAt: "May 08, 2026", notes: "Wi-Fi 6E driver fix, EMV kernel 1.4.7" },
  X800: { version: "TOMS 8.2.0-r119", releasedAt: "Jan 14, 2026", notes: "Kiosk auto-lock improvements" },
};

// ─── Required apps (what every device should have) ────────
// In a real system this is configured per fleet/template. Hardcoded here so
// we can compare against `device.apps` and produce missing/outdated lists.
const REQUIRED_APPS_DEFAULT = [
  { id: "toms-mdm", name: "TOMS MDM",     version: "5.1.0", category: "system" },
  { id: "toms-pay", name: "TOMS PayCore", version: "3.8.2", category: "system" },
  { id: "pos",      name: "Acme POS Pro", version: "4.3.2", category: "business" },
];
function requiredAppsFor(device) {
  const merchant = window.findMerchantById?.(device.merchantId);
  const out = [...REQUIRED_APPS_DEFAULT];
  // F&B merchants need Loyalty+ on every terminal.
  if ((merchant?.tags || []).includes("F&B")) {
    out.push({ id: "loyalty", name: "Loyalty+", version: "1.3.4", category: "business" });
  }
  return out;
}
function compareVer(a, b) {
  const pa = String(a).split(/[.-]/).map(x => parseInt(x, 10) || 0);
  const pb = String(b).split(/[.-]/).map(x => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}
function appDeltaFor(device) {
  const required = requiredAppsFor(device);
  const installed = device.apps || [];
  const missing = required.filter(r => !installed.some(i => i.id === r.id));
  const outdated = required
    .filter(r => {
      const inst = installed.find(i => i.id === r.id);
      return inst && compareVer(inst.version, r.version) < 0;
    })
    .map(r => ({ ...r, installedVersion: installed.find(i => i.id === r.id).version }));
  return { required, missing, outdated };
}
function firmwareDeltaFor(device) {
  const target = TARGET_FIRMWARE[device.model];
  if (!target || !device.firmware) return null;
  if (device.firmware === target.version) return { current: device.firmware, target, behind: false };
  const buildOf = (s) => parseInt((s.match(/r(\d+)/i) || [])[1] || "0", 10);
  return {
    current: device.firmware,
    target,
    behind: true,
    behindBy: Math.max(0, buildOf(target.version) - buildOf(device.firmware)),
  };
}

// ─── Push history (operations sent to the device) ─────────
// Each entry: { kind, target, queuedAt, status, completedAt, by, error? }
function pushHistoryFor(device) {
  const base = [
    { kind: "app-install", target: "Acme POS Pro 4.3.2",  queuedAt: "May 10, 2026 14:02", status: "completed", completedAt: "May 10, 2026 14:11", by: "M. Hassan" },
    { kind: "firmware",    target: TARGET_FIRMWARE[device.model]?.version || "—", queuedAt: "Apr 29, 2026 09:30", status: "completed", completedAt: "Apr 29, 2026 09:47", by: "Auto-scheduler" },
    { kind: "app-update",  target: "Loyalty+ 1.3.4",      queuedAt: "Apr 22, 2026 11:14", status: "completed", completedAt: "Apr 22, 2026 11:23", by: "M. Hassan" },
  ];
  if (device.state === "active") {
    base.unshift({ kind: "app-install", target: "Catalog Sync 1.0.9", queuedAt: "May 11, 2026 16:40", status: "pending", completedAt: null, by: "M. Hassan" });
  }
  if (device.state !== "active") {
    base.unshift({ kind: "app-install", target: "Acme POS Pro 4.3.2", queuedAt: "May 12, 2026 10:00", status: "failed", completedAt: "May 12, 2026 10:15", by: "M. Hassan", error: "Device offline — will retry on next check-in" });
  }
  return base;
}

// ─── Runtime snapshot (what the device last reported) ─────
function runtimeFor(device) {
  const seed = device.sn.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0x7fffffff, 0);
  const cpu = 15 + (seed % 50);
  const memTotal = device.model === "X800" ? 6 : 4;
  const memUsed = parseFloat((memTotal * (0.4 + ((seed % 40) / 100))).toFixed(1));
  const diskTotal = device.storage?.total || 32;
  const diskUsed = device.storage?.used ?? diskTotal * 0.35;
  const sampledAt = device.state === "active"  ? (device.lastSeenAt || "5 min ago")
                  : device.state === "pending" ? "—"
                                              : "3 days ago";
  return {
    cpu, memUsed, memTotal,
    diskUsed: parseFloat(diskUsed.toFixed ? diskUsed.toFixed(1) : diskUsed),
    diskTotal,
    networkMode: device.network.ethernet.enabled ? "Ethernet"
              : device.network.wifi.enabled ? "Wi-Fi"
              : device.network.sim.enabled ? "Cellular"
              : "Offline",
    root: device.hardware.root,
    devMode: device.hardware.devMode,
    sampledAt,
    isOnline: device.state === "active",
  };
}

// ─── Device events (boot / install / network) ─────────────
function eventsFor(device) {
  return [
    { kind: "boot",          at: "May 12, 2026 08:02", detail: "Device powered on" },
    { kind: "net-change",    at: "May 12, 2026 08:03",
      detail: device.network.wifi.enabled ? `Joined Wi-Fi · ${device.network.wifi.ssid}`
            : device.network.ethernet.enabled ? "Ethernet link up"
            : device.network.sim.enabled ? `Cellular attached · ${device.network.sim.carrier}`
            : "Offline" },
    { kind: "app-install",   at: "May 11, 2026 16:44", detail: "Catalog Sync 1.0.9 installed" },
    { kind: "app-update",    at: "May 10, 2026 14:11", detail: "Acme POS Pro 4.3.1 → 4.3.2" },
    { kind: "boot",          at: "May 09, 2026 06:30", detail: "Device powered on" },
    { kind: "net-change",    at: "May 08, 2026 22:10", detail: "Wi-Fi disconnected" },
    { kind: "app-uninstall", at: "May 04, 2026 11:00", detail: "Trial Counter 0.9.1 removed" },
    { kind: "boot",          at: "May 02, 2026 07:45", detail: "Device powered on after firmware update" },
  ];
}

// ─── Live memory snapshot (returned by the "Fetch" probe) ──
// Just static data — the wow factor is the loading state.
function liveMemoryFor(device) {
  return [
    { name: "Acme POS Pro",       pid: 1248, memMB: 142 },
    { name: "TOMS PayCore",       pid:  892, memMB:  88 },
    { name: "TOMS MDM",           pid:  712, memMB:  64 },
    { name: "Loyalty+",           pid: 1502, memMB:  51 },
    { name: "System UI",          pid:  220, memMB:  98 },
    { name: "android.system",     pid:   42, memMB: 312 },
    { name: "webview",            pid: 1830, memMB:  72 },
  ];
}

// ─── Pre-warning policies (configured elsewhere; chosen here) ──
const PREWARNING_POLICIES = {
  traffic: [
    { id: "t-strict",  name: "Strict cellular cap (500 MB)",   thresholdMb: 500,  alertAt: "80%" },
    { id: "t-default", name: "Standard 2 GB cap",              thresholdMb: 2048, alertAt: "90%" },
    { id: "t-loose",   name: "Loose 5 GB cap",                 thresholdMb: 5120, alertAt: "95%" },
  ],
  geofence: [
    { id: "g-store-radius",   name: "Within 500 m of store",  detail: "Alert when device exits radius for > 5 min" },
    { id: "g-store-flexible", name: "Within 2 km of store",   detail: "Alert when device exits radius for > 10 min" },
    { id: "g-region-only",    name: "Province / state only",  detail: "Alert when device leaves the registered province" },
  ],
  disk: [
    { id: "d-tight",   name: "Tight — alert below 10 % free", thresholdPct: 10 },
    { id: "d-default", name: "Standard — alert below 20 % free", thresholdPct: 20 },
  ],
};
function prewarningFor(device) {
  return {
    traffic:  { enabled: device.network.sim.enabled, policyId: "t-default" },
    geofence: { enabled: device.state === "active",  policyId: "g-store-radius" },
    disk:     { enabled: true,                       policyId: "d-default" },
  };
}
function prewarningEventsFor(device) {
  if (device.state === "pending") return [];
  return [
    { policy: "Standard 2 GB cap",   kind: "traffic",  at: "May 11, 2026 22:14", level: "warning",
      detail: "Hit 90% of monthly cellular data quota (1.82 GB / 2 GB)" },
    { policy: "Within 500 m of store", kind: "geofence", at: "Apr 27, 2026 18:42", level: "info",
      detail: "Device left geofence — returned 18:51 (9 min)" },
    { policy: "Standard 2 GB cap",   kind: "traffic",  at: "Apr 18, 2026 12:01", level: "info",
      detail: "Hit 75% of monthly cellular data quota (1.50 GB / 2 GB)" },
    ...(device.state === "inactive" ? [{
      policy: "Standard 2 GB cap",   kind: "traffic",  at: "Apr 16, 2026 09:20", level: "critical",
      detail: "Exceeded data quota (2.10 GB / 2 GB) — SIM throttled by carrier",
    }] : []),
  ];
}

// ─── List ───────────────────────────────────────────────────
function DevicesListScreen({ navigate }) {
  const all = window.PROD_DEVICES || [];
  const [q, setQ] = useStateD("");
  const [modelFilter, setModelFilter] = useStateD("any");
  const [stateFilter, setStateFilter] = useStateD("any");

  const filtered = useMemoD(() => all.filter(d => {
    if (modelFilter !== "any" && d.model !== modelFilter) return false;
    if (stateFilter !== "any" && d.state !== stateFilter) return false;
    if (q) {
      const n = q.toLowerCase();
      if (!`${d.sn} ${d.model} ${d.merchantId} ${d.imei || ""}`.toLowerCase().includes(n)) return false;
    }
    return true;
  }), [all, q, modelFilter, stateFilter]);

  const totals = useMemoD(() => ({
    total: all.length,
    active: all.filter(d => d.state === "active").length,
    flagged: all.filter(d => d.hardware?.root || d.hardware?.devMode
                            || (d.hardware?.securityWarnings || []).length > 0).length,
    pending: all.filter(d => d.state === "pending").length,
  }), [all]);

  const models = useMemoD(() => [...new Set(all.map(d => d.model))], [all]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <window.PageHeader
        title="Devices"
        subtitle="Production fleet — every Carbon terminal you've activated, with its hardware posture, network, and installed apps." />

      <div style={{ flex: 1, overflow: "auto", background: "var(--color-bg-1)" }}>
        <div style={{ padding: "var(--space-5) var(--space-6) var(--space-3)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { label: "Total devices",   value: totals.total,   sub: "in your fleet" },
              { label: "Active",          value: totals.active,  sub: "checked in recently", tone: "success" },
              { label: "Pending activation", value: totals.pending, sub: "awaiting first contact", tone: totals.pending > 0 ? "info" : undefined },
              { label: "Security flagged", value: totals.flagged, sub: "root / dev-mode / warnings", tone: totals.flagged > 0 ? "warning" : undefined },
            ].map(k => (
              <div key={k.label} style={{
                padding: "12px 16px", borderRadius: "var(--radius-lg)",
                background: "var(--bg2)",
                border: "1px solid var(--border-1)",
                boxShadow: "var(--shadow-1)",
              }}>
                <div className="overline" style={{ fontSize: 10.5 }}>{k.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                  <span className="mono num" style={{
                    fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em",
                    color: k.tone === "success" ? "var(--success)"
                        : k.tone === "warning" ? "var(--warning)"
                        : k.tone === "info"    ? "var(--info)"
                        : "var(--fg1)",
                  }}>{k.value}</span>
                  <span style={{ fontSize: 11, color: "var(--fg3)" }}>{k.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "var(--space-3) var(--space-6)", flexWrap: "wrap" }}>
          <window.Input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search SN, model, IMEI, merchant…"
            prefix={<window.Ico name="search" size={12} />}
            style={{ flex: 1, minWidth: 240, maxWidth: 380 }} />
          <select value={modelFilter} onChange={(e) => setModelFilter(e.target.value)} style={selectStyle}>
            <option value="any">All models</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={selectStyle}>
            <option value="any">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <div style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--fg3)" }}>
            {filtered.length} of {all.length} devices
          </div>
        </div>

        <div style={{ padding: "var(--space-3) var(--space-6) var(--space-6)" }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border-2)",
            borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-1)" }}>
            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--bg3)", textAlign: "left" }}>
                    {["Serial number", "Model", "OS / Firmware", "Bound merchant", "Last seen", "Posture", "Status", ""].map((h, i) => (
                      <th key={i} className="overline" style={{
                        padding: "10px 14px", fontSize: 10.5,
                        borderBottom: "1px solid var(--border-1)",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--fg3)" }}>
                      No devices match those filters.
                    </td></tr>
                  )}
                  {filtered.map(d => {
                    const merchant = window.findMerchantById?.(d.merchantId);
                    const st = DEVICE_STATE[d.state] || DEVICE_STATE.inactive;
                    const flagged = d.hardware?.root || d.hardware?.devMode
                                  || (d.hardware?.securityWarnings || []).length > 0;
                    return (
                      <tr key={d.sn}
                        onClick={() => navigate({ screen: "deviceDetail", deviceSn: d.sn })}
                        style={{ cursor: "pointer", borderBottom: "1px solid var(--border-1)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "12px 14px" }}>
                          <span className="mono" style={{ fontSize: 12.5, fontWeight: 500 }}>{d.sn}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span className="mono" style={{ fontSize: 12, color: "var(--fg2)" }}>{d.model}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontSize: 12.5 }}>{d.os}</div>
                          <div className="mono" style={{ fontSize: 10.5, color: "var(--fg3)" }}>{d.firmware}</div>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--fg2)" }}>
                          {merchant?.name || "—"}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 11.5, color: "var(--fg2)" }}>
                          <span className="mono">{d.lastSeenAt}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {flagged ? (
                            <window.Pill tone="warning" dot size="sm">
                              {d.hardware?.root ? "Rooted"
                              : d.hardware?.devMode ? "Dev mode"
                              : `${d.hardware.securityWarnings.length} warning${d.hardware.securityWarnings.length === 1 ? "" : "s"}`}
                            </window.Pill>
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--fg3)" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <window.Pill tone={st.tone} dot size="sm">{st.label}</window.Pill>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <window.Ico name="chevr" size={14} style={{ color: "var(--fg3)" }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail (tabbed) ───────────────────────────────────────
function DeviceDetailScreen({ device, route, navigate }) {
  const tab = route.tab || "basic";
  const st = DEVICE_STATE[device.state] || DEVICE_STATE.inactive;
  const merchant = window.findMerchantById?.(device.merchantId);
  const store = merchant?.stores?.find(s => s.id === device.storeId);
  const flagged = device.hardware?.root || device.hardware?.devMode
                || (device.hardware?.securityWarnings || []).length > 0;

  const delta = useMemoD(() => appDeltaFor(device), [device]);
  const firmware = useMemoD(() => firmwareDeltaFor(device), [device]);
  const driftCount = delta.missing.length + delta.outdated.length + (firmware?.behind ? 1 : 0);
  const criticalAlerts = useMemoD(
    () => prewarningEventsFor(device).filter(e => e.level === "critical").length,
    [device]);

  // Tab list. Show a numeric badge on Apps & Firmware when there's drift,
  // and on Pre-warning when there are critical alerts — that's how the
  // operator decides where to look first.
  const tabs = [
    { id: "basic",      label: "Basic information" },
    { id: "apps",       label: "Apps & Firmware", count: driftCount || null,
      countTone: driftCount > 0 ? "warning" : null },
    { id: "monitoring", label: "Monitoring" },
    { id: "prewarning", label: "Pre-warning",     count: criticalAlerts || null,
      countTone: criticalAlerts > 0 ? "danger" : null },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "var(--color-bg-2)", borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button onClick={() => navigate({ screen: "devices" })}
            style={{ color: "var(--fg3)", padding: 4 }} title="Back">
            <window.Ico name="chevl" size={16} />
          </button>
          <div style={{
            width: 44, height: 56, borderRadius: 6,
            background: "var(--bg3)", border: "1px solid var(--border-2)",
            color: "var(--fg2)", display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <window.Ico name="device" size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 className="mono" style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
                {device.sn}
              </h1>
              <window.Pill tone={st.tone} dot size="lg">{st.label}</window.Pill>
              {flagged && (
                <window.Pill tone="warning" dot size="lg">Security attention</window.Pill>
              )}
              <span style={{ fontSize: 11.5, color: "var(--fg3)" }}>·</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--fg2)" }}>{device.model}</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: "var(--fg3)" }}>
              {merchant ? (
                <>Bound to{" "}
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate({ screen: "merchantDetail", merchantId: merchant.id, tab: "terminals" }); }}
                    style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 2 }}>
                    {merchant.name}
                  </a>
                  {store && <> · {store.name}{store.isHQ ? " (HQ)" : ""}</>}
                </>
              ) : "Unbound"}
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div style={{ display: "flex", gap: 2, padding: "16px 16px 0" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => navigate({ ...route, tab: t.id })} style={{
              padding: "7px 12px",
              fontSize: 12.5, fontWeight: tab === t.id ? 500 : 400,
              color: tab === t.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              borderBottom: "2px solid",
              borderColor: tab === t.id ? "var(--color-text-primary)" : "transparent",
              marginBottom: -1,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <span>{t.label}</span>
              {t.count != null && (
                <span className="mono num" style={{
                  fontSize: 10, padding: "1px 6px", borderRadius: 999, fontWeight: 600,
                  background: t.countTone === "danger" ? "var(--color-error-50, var(--error-bg))"
                            : t.countTone === "warning" ? "var(--warning-bg)"
                            : "var(--bg3)",
                  color: t.countTone === "danger" ? "var(--color-error-700)"
                       : t.countTone === "warning" ? "var(--color-warning-700)"
                       : "var(--fg3)",
                  border: "1px solid",
                  borderColor: t.countTone === "danger" ? "color-mix(in oklab, var(--color-error-500) 25%, transparent)"
                             : t.countTone === "warning" ? "color-mix(in oklab, var(--color-warning-500) 25%, transparent)"
                             : "var(--border-1)",
                }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px 28px", background: "var(--color-bg-1)" }}>
        {tab === "basic"      && <DeviceBasicTab device={device} flagged={flagged} />}
        {tab === "apps"       && <DeviceAppsTab  device={device} delta={delta} firmware={firmware} />}
        {tab === "monitoring" && <DeviceMonitoringTab device={device} />}
        {tab === "prewarning" && <DevicePrewarningTab device={device} />}
      </div>
    </div>
  );
}

// ─── Tab 1: Basic information ─────────────────────────────
function DeviceBasicTab({ device, flagged }) {
  return (
    <div className="page-content" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 16 }}>
      {/* LEFT */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        {flagged && <SecurityBanner hardware={device.hardware} />}

        <window.Card title="Device information">
          <KvGrid rows={[
            ["Serial number",    <span className="mono">{device.sn}</span>],
            ["Model",            <span className="mono">{device.model}</span>],
            ["Operating system", <>{device.os} · <span className="mono" style={{ color: "var(--fg3)" }}>{device.firmware}</span></>],
            ["Build number",     <span className="mono">{device.buildNumber}</span>],
            ["IMEI",             device.imei ? <span className="mono">{device.imei}</span> : <Dash />],
            ["MAC address",      device.macAddress ? <span className="mono">{device.macAddress}</span> : <Dash />],
            ["Activated",        device.activatedAt
                ? <span className="mono">{device.activatedAt}</span>
                : <span style={{ color: "var(--color-warning-700)" }}>Pending — not yet activated</span>],
            ["Created",          <span className="mono">{device.createdAt}</span>],
            ["Last seen",        <span className="mono">{device.lastSeenAt}</span>],
            device.storage && ["Storage",
              <>
                <span className="mono">{device.storage.used.toFixed(1)} / {device.storage.total} GB</span>
                <span style={{ marginLeft: 8, color: "var(--fg3)" }}>used</span>
              </>],
            device.battery && ["Battery",
              <>
                <span className="mono">{device.battery.level}%</span>
                <span style={{ marginLeft: 8, color: "var(--fg3)" }}>· {device.battery.health}</span>
              </>],
          ].filter(Boolean)} />
        </window.Card>

        <window.Card title="Hardware status">
          <KvGrid rows={[
            ["Root status",
              <Flag positive={!device.hardware.root}
                positiveLabel="Not rooted"
                negativeLabel="Rooted — device integrity compromised" />],
            ["Developer mode",
              <Flag positive={!device.hardware.devMode}
                positiveLabel="Disabled"
                negativeLabel="Enabled — production devices should keep this off"
                tone="warning" />],
            ["Security warnings",
              <SecurityList warnings={device.hardware.securityWarnings || []} />],
          ]} />
        </window.Card>
      </div>

      {/* RIGHT rail */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <window.Card title="Network">
          <NetRow label="SIM" enabled={device.network.sim.enabled}
            detail={device.network.sim.enabled
              ? <>Carrier <span className="mono">{device.network.sim.carrier}</span></>
              : "Not in use"} />
          <NetRow label="Ethernet" enabled={device.network.ethernet.enabled}
            detail={device.network.ethernet.enabled ? "Connected" : "Not in use"} />
          <NetRow label="Wi-Fi" enabled={device.network.wifi.enabled}
            detail={device.network.wifi.enabled
              ? <><span style={{ color: "var(--fg3)" }}>SSID</span>{" "}<span className="mono" style={{ fontWeight: 500 }}>{device.network.wifi.ssid}</span></>
              : "Disabled"} />
        </window.Card>

        <window.Card title="System settings">
          <KvGrid compact rows={[
            ["Timezone",      <span className="mono">{device.settings.timezone}</span>],
            ["Auto timezone", <YesNo on={device.settings.autoTimezone} />],
            ["Auto time",     <YesNo on={device.settings.autoTime}
                                warnWhenOff="Manual clocks drift — PCI logs may reject" />],
            ["Language",      <span className="mono">{device.settings.language}</span>],
          ]} />
        </window.Card>
      </div>
    </div>
  );
}

// ─── Tab 2: Apps & Firmware ───────────────────────────────
function DeviceAppsTab({ device, delta, firmware }) {
  const pushHistory = useMemoD(() => pushHistoryFor(device), [device]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Firmware status card */}
      <window.Card title="Firmware"
        action={firmware?.behind && (
          <window.Button primary size="sm" icon="upload"
            onClick={() => window.showToast?.(`Firmware push queued · ${firmware.target.version}`, "success")}>
            Push update
          </window.Button>
        )}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 32px 1fr", alignItems: "center", gap: 8,
        }}>
          {/* Current */}
          <div style={{
            padding: "12px 14px",
            background: firmware?.behind ? "var(--bg2)" : "oklch(96% 0.03 152)",
            border: "1px solid",
            borderColor: firmware?.behind ? "var(--border-2)"
                                          : "color-mix(in oklab, var(--color-success-500) 28%, transparent)",
            borderRadius: "var(--radius-md)",
          }}>
            <div className="overline" style={{ fontSize: 10, marginBottom: 4 }}>Current</div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 600,
              color: firmware?.behind ? "var(--fg1)" : "var(--color-success-700)" }}>
              {device.firmware}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--fg3)", marginTop: 4 }}>
              Build {device.buildNumber}
            </div>
          </div>
          <div style={{ display: "grid", placeItems: "center" }}>
            <window.Ico name="arrowR" size={18} style={{ color: firmware?.behind ? "var(--warning)" : "var(--fg3)" }} />
          </div>
          {/* Target */}
          <div style={{
            padding: "12px 14px",
            background: firmware?.behind ? "var(--warning-bg)" : "var(--bg2)",
            border: "1px solid",
            borderColor: firmware?.behind ? "color-mix(in oklab, var(--color-warning-500) 28%, transparent)"
                                          : "var(--border-2)",
            borderRadius: "var(--radius-md)",
          }}>
            <div className="overline" style={{ fontSize: 10, marginBottom: 4,
              color: firmware?.behind ? "var(--color-warning-700)" : undefined }}>
              {firmware?.behind ? "Update available" : "Latest"}
            </div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 600,
              color: firmware?.behind ? "var(--color-warning-700)" : "var(--fg2)" }}>
              {firmware?.target.version || "—"}
            </div>
            <div style={{ fontSize: 11, color: firmware?.behind ? "var(--color-warning-700)" : "var(--fg3)", marginTop: 4 }}>
              Released <span className="mono">{firmware?.target.releasedAt}</span>
              {firmware?.behind && firmware.behindBy > 0 && (
                <> · <b>{firmware.behindBy}</b> build{firmware.behindBy === 1 ? "" : "s"} behind</>
              )}
            </div>
          </div>
        </div>
        {firmware?.target.notes && (
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--fg3)", lineHeight: 1.55 }}>
            <b style={{ color: "var(--fg2)" }}>Release notes:</b> {firmware.target.notes}
          </div>
        )}
      </window.Card>

      {/* Apps coverage KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Required",  value: delta.required.length, sub: "in fleet template" },
          { label: "Installed", value: device.apps.length,    sub: "currently on device", tone: "success" },
          { label: "Missing",   value: delta.missing.length,  sub: "to be pushed",       tone: delta.missing.length > 0 ? "warning" : null },
          { label: "Outdated",  value: delta.outdated.length, sub: "below required version", tone: delta.outdated.length > 0 ? "warning" : null },
        ].map(k => (
          <div key={k.label} style={{
            padding: "12px 14px", borderRadius: "var(--radius-md)",
            background: "var(--bg2)", border: "1px solid var(--border-1)",
          }}>
            <div className="overline" style={{ fontSize: 10.5 }}>{k.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <span className="mono num" style={{
                fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em",
                color: k.tone === "success" ? "var(--success)"
                    : k.tone === "warning" ? "var(--warning)"
                    : "var(--fg1)",
              }}>{k.value}</span>
              <span style={{ fontSize: 11, color: "var(--fg3)" }}>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Missing apps */}
      {delta.missing.length > 0 && (
        <window.Card title={`Missing apps · ${delta.missing.length}`}
          hint="These apps are required by the fleet template but haven't been installed on this device yet."
          action={
            <window.Button primary size="sm" icon="download"
              onClick={() => window.showToast?.(`Push install queued · ${delta.missing.length} app${delta.missing.length === 1 ? "" : "s"}`, "success")}>
              Push install
            </window.Button>
          }>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {delta.missing.map(a => (
              <li key={a.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px",
                background: "var(--warning-bg)",
                border: "1px solid color-mix(in oklab, var(--color-warning-500) 22%, transparent)",
                borderLeft: "3px solid var(--color-warning-500)",
                borderRadius: "var(--radius-md)",
              }}>
                <AppLogo seed={a.id} name={a.name} />
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{a.name}</span>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--color-warning-700)" }}>{a.version}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-warning-700)" }}>Not installed</span>
              </li>
            ))}
          </ul>
        </window.Card>
      )}

      {/* Outdated apps */}
      {delta.outdated.length > 0 && (
        <window.Card title={`Outdated apps · ${delta.outdated.length}`}
          hint="These apps are installed but on an older version than the fleet template requires."
          action={
            <window.Button primary size="sm" icon="upload"
              onClick={() => window.showToast?.(`Push update queued · ${delta.outdated.length} app${delta.outdated.length === 1 ? "" : "s"}`, "success")}>
              Push update
            </window.Button>
          }>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {delta.outdated.map(a => (
              <li key={a.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px",
                background: "var(--bg2)",
                border: "1px solid var(--border-2)",
                borderRadius: "var(--radius-md)",
              }}>
                <AppLogo seed={a.id} name={a.name} />
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{a.name}</span>
                <span style={{ fontSize: 11.5, color: "var(--fg3)" }}>installed</span>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--fg2)" }}>{a.installedVersion}</span>
                <window.Ico name="arrowR" size={11} style={{ color: "var(--fg3)" }} />
                <span className="mono" style={{ fontSize: 11.5, color: "var(--color-warning-700)", fontWeight: 500 }}>{a.version}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-warning-700)" }}>Needs update</span>
              </li>
            ))}
          </ul>
        </window.Card>
      )}

      {/* All installed apps */}
      <window.Card title={`Installed apps · ${device.apps.length}`}
        hint="Apps currently provisioned on this device. System apps come bundled in the TOMS firmware."
        action={
          <window.Button size="sm" ghost icon="download"
            onClick={() => window.showToast?.("Push an ad-hoc app — picker coming in Phase 3.5", "info")}>
            Push an app…
          </window.Button>
        }>
        <div className="table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                {["App", "Version", "Installed", "Source"].map((h, i) => (
                  <th key={i} style={{
                    padding: "8px 12px", fontSize: 11, fontWeight: 500,
                    color: "var(--fg3)", textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--color-border-subtle)",
                    background: "var(--bg3)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {device.apps.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < device.apps.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <AppLogo seed={a.id} name={a.name} system={a.system} />
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>{a.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span className="mono" style={{ fontSize: 12 }}>{a.version}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 11.5, color: "var(--fg2)" }}>
                    <span className="mono">{a.installedAt}</span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {a.system
                      ? <span style={{
                          fontSize: 9.5, padding: "1px 6px", borderRadius: 3,
                          background: "var(--color-primary-50)", color: "var(--color-primary-700)",
                          fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.04em",
                        }}>SYSTEM</span>
                      : <span style={{ fontSize: 11, color: "var(--fg3)" }}>App pool</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </window.Card>

      {/* Push history */}
      <window.Card title={`Push history · ${pushHistory.length}`}
        hint="Every install / update / firmware command issued to this device, with the outcome.">
        <div className="table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                {["Kind", "Target", "Queued", "Status", "Completed", "By"].map((h, i) => (
                  <th key={i} style={{
                    padding: "8px 12px", fontSize: 11, fontWeight: 500,
                    color: "var(--fg3)", textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--color-border-subtle)",
                    background: "var(--bg3)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pushHistory.map((h, i) => {
                const statusMeta = h.status === "completed" ? { tone: "success", label: "Completed" }
                                : h.status === "pending"   ? { tone: "info",    label: "Pending" }
                                : h.status === "failed"    ? { tone: "danger",  label: "Failed"  }
                                : { tone: "neutral", label: h.status };
                const kindIcon = h.kind === "firmware"       ? "package"
                              : h.kind === "app-install"     ? "download"
                              : h.kind === "app-update"      ? "upload"
                              : h.kind === "app-uninstall"   ? "trash"
                                                             : "doc";
                return (
                  <tr key={i} style={{ borderBottom: i < pushHistory.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: 11.5, color: "var(--fg2)", textTransform: "capitalize" }}>
                        <window.Ico name={kindIcon} size={11} stroke={1.8} />
                        {h.kind.replace("-", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span className="mono" style={{ fontSize: 12 }}>{h.target}</span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 11.5, color: "var(--fg2)" }}>
                      <span className="mono">{h.queuedAt}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <window.Pill tone={statusMeta.tone} dot size="sm">{statusMeta.label}</window.Pill>
                      {h.error && (
                        <div style={{ marginTop: 2, fontSize: 10.5, color: "var(--color-error-700)" }}>{h.error}</div>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 11.5, color: "var(--fg2)" }}>
                      <span className="mono">{h.completedAt || "—"}</span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 11.5, color: "var(--fg2)" }}>{h.by}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </window.Card>
    </div>
  );
}

// ─── Tab 3: Monitoring ─────────────────────────────────────
function DeviceMonitoringTab({ device }) {
  const runtime = useMemoD(() => runtimeFor(device), [device]);
  const events  = useMemoD(() => eventsFor(device),  [device]);

  // Memory probe: requires the device to be online. The "Fetch" button
  // simulates a request with a brief loading state, then reveals the
  // process list. Cached in memory so flipping tabs doesn't lose it.
  const [memState, setMemState] = useStateD("idle"); // idle | loading | done | error
  const [memData, setMemData] = useStateD(null);
  const fetchMemory = () => {
    if (!runtime.isOnline) {
      setMemState("error");
      return;
    }
    setMemState("loading");
    setTimeout(() => {
      setMemData(liveMemoryFor(device));
      setMemState("done");
    }, 900);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Runtime snapshot */}
      <window.Card title="Runtime snapshot"
        hint={<>Last reported state of the device. Stale data means the device hasn't checked in recently.</>}
        action={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--fg3)" }}>
            <window.Ico name="clock" size={11} stroke={1.8} />
            Sampled <span className="mono" style={{ color: runtime.isOnline ? "var(--fg2)" : "var(--color-warning-700)" }}>{runtime.sampledAt}</span>
          </span>
        }>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <Meter label="CPU usage"
            value={runtime.cpu} max={100} unit="%"
            tone={runtime.cpu > 80 ? "danger" : runtime.cpu > 60 ? "warning" : "default"} />
          <Meter label="Memory"
            value={runtime.memUsed} max={runtime.memTotal} unit="GB"
            subValue={`of ${runtime.memTotal} GB`}
            tone={runtime.memUsed / runtime.memTotal > 0.9 ? "danger"
                : runtime.memUsed / runtime.memTotal > 0.75 ? "warning"
                : "default"} />
          <Meter label="Storage"
            value={runtime.diskUsed} max={runtime.diskTotal} unit="GB"
            subValue={`of ${runtime.diskTotal} GB`}
            tone={runtime.diskUsed / runtime.diskTotal > 0.9 ? "danger"
                : runtime.diskUsed / runtime.diskTotal > 0.75 ? "warning"
                : "default"} />
        </div>
        <div style={{
          marginTop: 14, paddingTop: 12,
          borderTop: "1px dashed var(--color-border-subtle)",
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
        }}>
          <KvCompact label="Network" value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: runtime.networkMode === "Offline" ? "var(--color-error-500)" : "var(--success)",
              }} />
              {runtime.networkMode}
            </span>} />
          <KvCompact label="Root state" value={
            <Flag positive={!runtime.root}
              positiveLabel="Not rooted"
              negativeLabel="Rooted" />} />
          <KvCompact label="Developer mode" value={
            <Flag positive={!runtime.devMode}
              positiveLabel="Off"
              negativeLabel="On"
              tone="warning" />} />
        </div>
      </window.Card>

      {/* Memory probe */}
      <window.Card title="Live memory probe"
        hint="Requests the device's current per-process memory. The device must be online; the data is fetched on demand."
        action={
          <window.Button size="sm" primary icon="refresh"
            disabled={memState === "loading"}
            onClick={fetchMemory}>
            {memState === "done" ? "Re-fetch" : memState === "loading" ? "Fetching…" : "Fetch live memory"}
          </window.Button>
        }>
        {memState === "idle" && (
          <div style={{
            padding: "20px 14px", textAlign: "center",
            background: "var(--bg2)",
            border: "1px dashed var(--color-border-subtle)",
            borderRadius: "var(--radius-md)",
            fontSize: 12.5, color: "var(--fg3)",
          }}>
            Press <b>Fetch live memory</b> to request a snapshot from this device.
          </div>
        )}
        {memState === "loading" && (
          <div style={{
            padding: "20px 14px", textAlign: "center",
            background: "var(--bg2)",
            border: "1px solid var(--border-1)",
            borderRadius: "var(--radius-md)",
            fontSize: 12.5, color: "var(--fg2)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <Spinner size={14} /> Asking the device…
          </div>
        )}
        {memState === "error" && (
          <div style={{
            padding: "12px 14px",
            background: "var(--error-bg)",
            border: "1px solid color-mix(in oklab, var(--color-error-500) 22%, transparent)",
            borderRadius: "var(--radius-md)",
            fontSize: 12.5, color: "var(--color-error-700)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <window.Ico name="alert" size={14} />
            Device is offline — live memory can't be probed right now. Try again after the device checks in.
          </div>
        )}
        {memState === "done" && memData && (
          <div className="table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  {["Process", "PID", "Memory"].map((h, i) => (
                    <th key={i} style={{
                      padding: "8px 12px", fontSize: 11, fontWeight: 500,
                      color: "var(--fg3)", textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid var(--color-border-subtle)",
                      background: "var(--bg3)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...memData].sort((a, b) => b.memMB - a.memMB).map((p, i) => (
                  <tr key={p.pid} style={{ borderBottom: i < memData.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                    <td style={{ padding: "9px 12px", fontSize: 12.5 }}>{p.name}</td>
                    <td style={{ padding: "9px 12px" }}><span className="mono" style={{ fontSize: 11.5, color: "var(--fg2)" }}>{p.pid}</span></td>
                    <td style={{ padding: "9px 12px" }}><span className="mono" style={{ fontWeight: 500 }}>{p.memMB}</span> <span style={{ color: "var(--fg3)" }}>MB</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </window.Card>

      {/* Event log */}
      <window.Card title={`Event log · ${events.length}`}
        hint="Device-side events the agent has uploaded. Boots, app installs, network changes — newest first.">
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 0 }}>
          {events.map((e, i) => {
            const meta = EVENT_KIND[e.kind] || EVENT_KIND["app-install"];
            return (
              <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start",
                paddingBottom: i < events.length - 1 ? 12 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: meta.bg, color: meta.color,
                    display: "grid", placeItems: "center",
                    border: `1px solid ${meta.border}`,
                  }}><window.Ico name={meta.icon} size={11} stroke={1.8} /></span>
                  {i < events.length - 1 && (
                    <span style={{ width: 1, flex: 1, marginTop: 2,
                      background: "var(--color-border-subtle)", minHeight: 16 }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fg1)" }}>{meta.label}</span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--fg3)" }}>{e.at}</span>
                  </div>
                  <div style={{ marginTop: 2, fontSize: 12, color: "var(--fg3)", lineHeight: 1.55 }}>
                    {e.detail}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </window.Card>
    </div>
  );
}

const EVENT_KIND = {
  boot:            { label: "Boot",            icon: "refresh",  color: "var(--color-info-700)",    bg: "var(--color-info-50)",    border: "color-mix(in oklab, var(--color-info-500) 22%, transparent)" },
  "app-install":   { label: "App installed",   icon: "download", color: "var(--color-success-700)", bg: "oklch(96% 0.03 152)",     border: "color-mix(in oklab, var(--color-success-500) 22%, transparent)" },
  "app-update":    { label: "App updated",     icon: "upload",   color: "var(--color-success-700)", bg: "oklch(96% 0.03 152)",     border: "color-mix(in oklab, var(--color-success-500) 22%, transparent)" },
  "app-uninstall": { label: "App uninstalled", icon: "trash",    color: "var(--color-warning-700)", bg: "var(--warning-bg)",        border: "color-mix(in oklab, var(--color-warning-500) 22%, transparent)" },
  "net-change":    { label: "Network change",  icon: "link",     color: "var(--fg2)",                bg: "var(--color-bg-3)",        border: "var(--color-border-subtle)" },
};

// ─── Tab 4: Pre-warning ───────────────────────────────────
function DevicePrewarningTab({ device }) {
  const initial = useMemoD(() => prewarningFor(device), [device]);
  const [policies, setPolicies] = useStateD(initial);
  useEffectD(() => { setPolicies(initial); }, [device.sn]); // reset when navigating
  const events = useMemoD(() => prewarningEventsFor(device), [device]);

  const updatePolicy = (kind, patch) => {
    setPolicies(prev => ({ ...prev, [kind]: { ...prev[kind], ...patch } }));
    window.showToast?.(`Pre-warning · ${PREWARNING_KIND_LABEL[kind]} updated`, "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Policy cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <PolicyCard kind="traffic"
          label="Cellular data"
          icon="bolt"
          description="Alert when monthly cellular usage crosses a threshold. Helps catch runaway costs."
          assignment={policies.traffic}
          options={PREWARNING_POLICIES.traffic}
          onChange={(p) => updatePolicy("traffic", p)} />
        <PolicyCard kind="geofence"
          label="Geofence"
          icon="shield"
          description="Alert when the device moves outside an allowed area. Useful for catching theft or unauthorized relocation."
          assignment={policies.geofence}
          options={PREWARNING_POLICIES.geofence}
          onChange={(p) => updatePolicy("geofence", p)} />
        <PolicyCard kind="disk"
          label="Disk space"
          icon="box"
          description="Alert when free disk space drops below a threshold. Prevents app installs failing on full devices."
          assignment={policies.disk}
          options={PREWARNING_POLICIES.disk}
          onChange={(p) => updatePolicy("disk", p)} />
      </div>

      {/* Triggered events */}
      <window.Card title={`Triggered alerts · ${events.length}`}
        hint="Pre-warning policies that fired for this device. New alerts also surface in the global Alerts feed.">
        {events.length === 0 ? (
          <div style={{
            padding: "20px 14px", textAlign: "center",
            fontSize: 12.5, color: "var(--fg3)",
            background: "var(--bg2)",
            border: "1px dashed var(--color-border-subtle)",
            borderRadius: "var(--radius-md)",
          }}>
            No alerts triggered for this device.
          </div>
        ) : (
          <div className="table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  {["Kind", "Policy", "Triggered", "Severity", "Detail"].map((h, i) => (
                    <th key={i} style={{
                      padding: "8px 12px", fontSize: 11, fontWeight: 500,
                      color: "var(--fg3)", textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid var(--color-border-subtle)",
                      background: "var(--bg3)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => {
                  const levelMeta = e.level === "critical" ? { tone: "danger",  label: "Critical" }
                                  : e.level === "warning"  ? { tone: "warning", label: "Warning"  }
                                                            : { tone: "info",    label: "Info"     };
                  const kindIcon = e.kind === "traffic"  ? "bolt"
                                 : e.kind === "geofence" ? "shield"
                                 : e.kind === "disk"     ? "box" : "bell";
                  return (
                    <tr key={i} style={{ borderBottom: i < events.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                      <td style={{ padding: "10px 12px", textTransform: "capitalize", color: "var(--fg2)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <window.Ico name={kindIcon} size={11} stroke={1.8} />{e.kind}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12.5, fontWeight: 500 }}>{e.policy}</td>
                      <td style={{ padding: "10px 12px", color: "var(--fg2)" }}>
                        <span className="mono" style={{ fontSize: 11.5 }}>{e.at}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <window.Pill tone={levelMeta.tone} dot size="sm">{levelMeta.label}</window.Pill>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--fg2)" }}>{e.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </window.Card>
    </div>
  );
}

const PREWARNING_KIND_LABEL = {
  traffic: "Cellular data", geofence: "Geofence", disk: "Disk space",
};

function PolicyCard({ kind, label, icon, description, assignment, options, onChange }) {
  const current = options.find(o => o.id === assignment.policyId) || options[0];
  return (
    <div style={{
      padding: "14px 16px",
      background: "var(--bg2)",
      border: "1px solid var(--border-1)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-1)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: assignment.enabled ? "var(--color-primary-50)" : "var(--bg3)",
          color: assignment.enabled ? "var(--color-primary-700)" : "var(--fg3)",
          display: "grid", placeItems: "center", flexShrink: 0,
          border: "1px solid",
          borderColor: assignment.enabled ? "color-mix(in oklab, var(--color-primary-500) 25%, transparent)" : "var(--border-1)",
        }}>
          <window.Ico name={icon} size={14} stroke={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        </div>
        {/* Enabled toggle */}
        <button onClick={() => onChange({ enabled: !assignment.enabled })} style={{
          width: 34, height: 18, borderRadius: 999, padding: 0,
          background: assignment.enabled ? "var(--color-primary-600)" : "var(--color-bg-3)",
          border: "1px solid",
          borderColor: assignment.enabled ? "var(--color-primary-600)" : "var(--color-border-default)",
          position: "relative", cursor: "pointer",
          flexShrink: 0,
        }} aria-label={assignment.enabled ? "Disable" : "Enable"}>
          <span style={{
            position: "absolute", top: 1, left: assignment.enabled ? 17 : 1,
            width: 14, height: 14, borderRadius: "50%",
            background: "white",
            transition: "left .15s ease",
          }} />
        </button>
      </div>

      {/* Description */}
      <div style={{ fontSize: 11.5, color: "var(--fg3)", lineHeight: 1.55 }}>{description}</div>

      {/* Policy select */}
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="overline" style={{ fontSize: 9.5 }}>Active policy</span>
        <select value={assignment.policyId}
          onChange={(e) => onChange({ policyId: e.target.value })}
          disabled={!assignment.enabled}
          style={{
            ...selectStyle, opacity: assignment.enabled ? 1 : 0.5,
            cursor: assignment.enabled ? "pointer" : "not-allowed",
          }}>
          {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </label>

      {/* Active policy detail */}
      {assignment.enabled && current && (
        <div style={{
          marginTop: 2, padding: "8px 10px",
          background: "var(--color-bg-3)",
          border: "1px dashed var(--color-border-subtle)",
          borderRadius: "var(--radius-sm)",
          fontSize: 11.5, color: "var(--fg2)", lineHeight: 1.55,
        }}>
          {current.thresholdMb ? <>Cap <span className="mono">{(current.thresholdMb / 1024).toFixed(1)} GB</span> · alert at <span className="mono">{current.alertAt}</span></>
          : current.thresholdPct ? <>Alert when free disk drops below <span className="mono">{current.thresholdPct} %</span></>
          : current.detail ? current.detail
          : null}
        </div>
      )}

      {/* Manage policies link */}
      <button onClick={() => window.showToast?.("Manage policies — coming in Phase 3.6", "info")}
        style={{
          marginTop: 2, fontSize: 11, color: "var(--color-text-tertiary)",
          textDecoration: "underline", textUnderlineOffset: 2,
          textDecorationStyle: "dotted", alignSelf: "flex-start",
        }}>
        Manage {PREWARNING_KIND_LABEL[kind].toLowerCase()} policies →
      </button>
    </div>
  );
}

// ─── Reusable bits ─────────────────────────────────────────
function Meter({ label, value, max, unit, subValue, tone = "default" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = tone === "danger"  ? "var(--color-error-500)"
                 : tone === "warning" ? "var(--color-warning-500)"
                 :                       "var(--color-primary-500)";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
        <span className="overline" style={{ fontSize: 10.5 }}>{label}</span>
        <span className="mono num" style={{ fontSize: 11.5, color: "var(--fg3)" }}>{pct}%</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
        <span className="mono num" style={{ fontSize: 20, fontWeight: 500,
          color: tone === "danger" ? "var(--color-error-700)"
              : tone === "warning" ? "var(--color-warning-700)"
              : "var(--fg1)" }}>{value}</span>
        <span style={{ fontSize: 11, color: "var(--fg3)" }}>{unit}{subValue ? ` · ${subValue}` : ""}</span>
      </div>
      <div style={{ marginTop: 6, height: 5, borderRadius: 999, background: "var(--color-bg-3)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: barColor, transition: "width .2s ease" }} />
      </div>
    </div>
  );
}

function KvCompact({ label, value }) {
  return (
    <div>
      <div className="overline" style={{ fontSize: 10.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: "var(--fg1)", display: "inline-flex", alignItems: "center", gap: 6 }}>{value}</div>
    </div>
  );
}

function Spinner({ size = 14 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%",
      border: `${Math.max(1.5, Math.round(size / 9))}px solid var(--color-bg-3)`,
      borderTopColor: "var(--color-primary-600)",
      animation: "spin .8s linear infinite",
      display: "inline-block",
    }} />
  );
}

// ─── Sub-bits ──────────────────────────────────────────────
const selectStyle = {
  padding: "7px 10px", borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border-default)", fontSize: 12,
  fontFamily: "inherit",
  background: "var(--bg2)", color: "var(--fg1)",
};

function KvGrid({ rows, compact }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: compact ? "1fr 1fr" : "160px minmax(0, 1fr)",
      rowGap: compact ? 8 : 10, columnGap: 16,
    }}>
      {rows.map(([k, v], i) => (
        <React.Fragment key={i}>
          <span className="overline" style={{ fontSize: 10, paddingTop: 2 }}>{k}</span>
          <span style={{ fontSize: 13, color: "var(--color-text-primary)", minWidth: 0,
            display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 4 }}>{v}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function Dash() { return <span style={{ color: "var(--fg3)" }}>—</span>; }

function Flag({ positive, positiveLabel, negativeLabel, tone }) {
  if (positive) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--color-success-700)" }}>
        <window.Ico name="check" size={12} stroke={2.5} />{positiveLabel}
      </span>
    );
  }
  const color = tone === "warning" ? "var(--color-warning-700)" : "var(--color-error-700)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color, fontWeight: 500 }}>
      <window.Ico name="alert" size={12} />{negativeLabel}
    </span>
  );
}

function SecurityList({ warnings }) {
  if (!warnings || warnings.length === 0) {
    return <Flag positive positiveLabel="None reported" />;
  }
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
      {warnings.map((w, i) => (
        <li key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12.5, color: "var(--color-warning-700)" }}>
          <window.Ico name="alert" size={12} stroke={2} />{w}
        </li>
      ))}
    </ul>
  );
}

function SecurityBanner({ hardware }) {
  const warnings = [
    ...(hardware.root ? ["Device appears to be rooted"] : []),
    ...(hardware.devMode ? ["Developer options are enabled"] : []),
    ...(hardware.securityWarnings || []),
  ];
  // Dedupe — root warning may also be in the securityWarnings list.
  const unique = [...new Set(warnings)];
  if (unique.length === 0) return null;
  return (
    <div style={{
      padding: "12px 14px",
      background: "var(--warning-bg)",
      border: "1px solid color-mix(in oklab, var(--color-warning-500) 30%, transparent)",
      borderRadius: "var(--radius-lg)",
      display: "flex", alignItems: "flex-start", gap: 10,
    }}>
      <window.Ico name="alert" size={16} style={{ color: "var(--color-warning-700)", marginTop: 1, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-warning-700)" }}>
          Hardware integrity flagged
        </div>
        <ul style={{ margin: "4px 0 0", paddingLeft: 16, fontSize: 12, color: "var(--color-warning-700)", lineHeight: 1.55 }}>
          {unique.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      </div>
    </div>
  );
}

function NetRow({ label, enabled, detail }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 0",
      borderBottom: "1px dashed var(--color-border-subtle)",
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: enabled ? "var(--success)" : "var(--color-border-strong)",
      }} />
      <span style={{ fontSize: 12.5, fontWeight: 500, minWidth: 70 }}>{label}</span>
      <span style={{ fontSize: 12, color: enabled ? "var(--fg2)" : "var(--fg3)", flex: 1, textAlign: "right" }}>
        {detail}
      </span>
    </div>
  );
}

function YesNo({ on, warnWhenOff }) {
  if (on) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--color-success-700)" }}>
        <window.Ico name="check" size={11} stroke={2.5} /> Auto
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5,
      color: warnWhenOff ? "var(--color-warning-700)" : "var(--fg2)" }}>
      Manual
      {warnWhenOff && (
        <span title={warnWhenOff} style={{ color: "var(--color-warning-700)" }}>
          <window.Ico name="alert" size={11} />
        </span>
      )}
    </span>
  );
}

function AppLogo({ seed, name, system }) {
  // Deterministic gradient like the AppIcon shared helper, but smaller.
  let h = 0; for (const c of (seed || name)) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  const hue = h % 360;
  const initials = (name || "").split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 5, flexShrink: 0,
      background: system
        ? "var(--color-bg-3)"
        : `linear-gradient(135deg, oklch(58% 0.18 ${hue}), oklch(48% 0.20 ${(hue + 28) % 360}))`,
      color: system ? "var(--color-text-secondary)" : "#fff",
      border: system ? "1px solid var(--color-border-subtle)" : "none",
      display: "grid", placeItems: "center",
      fontSize: 9.5, fontWeight: 600,
      fontFamily: "Geist, system-ui, sans-serif",
      letterSpacing: "-0.02em",
    }}>{initials || "?"}</div>
  );
}

Object.assign(window, {
  DevicesListScreen, DeviceDetailScreen, findDeviceBySn,
});
