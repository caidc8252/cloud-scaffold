/* global React */
// ─────────────────────────────────────────────────────────────
// Carbon — Seed data for the ISV console
// ─────────────────────────────────────────────────────────────

const DEVICE_MODELS = [
  { id: "N950",  family: "N950",  label: "TOMS N950",  blurb: "Flagship Android POS · 6.5\" · 5G" },
  { id: "S30",   family: "S",     label: "TOMS S30",   blurb: "Smart MPOS · 5.5\" · 4G/WiFi" },
  { id: "S60",   family: "S",     label: "TOMS S60",   blurb: "Compact countertop · 5.7\"" },
  { id: "S90",   family: "S",     label: "TOMS S90",   blurb: "Premium SmartPOS · 6.0\" · printer" },
  { id: "X800",  family: "X",     label: "TOMS X800",  blurb: "Self-service kiosk · 10\" tablet" },
  { id: "N750",  family: "N750",  label: "TOMS N750",  blurb: "Handheld Android · 5.5\" · 4G" },
  { id: "N750K", family: "N750",  label: "TOMS N750K", blurb: "N750 + physical keypad · PCI v6" },
  { id: "N750P", family: "N750",  label: "TOMS N750P", blurb: "N750 + integrated printer · 58mm" },
];

const APP_STATUS = {
  draft:     { label: "Draft",      tone: "neutral" },
  scanning:  { label: "Scanning",   tone: "info"    },
  pending:   { label: "Awaiting Publish", tone: "warning" },
  published: { label: "Published",  tone: "success" },
  rejected:  { label: "Rejected",   tone: "danger"  },
  rollback:  { label: "Rolled Back",tone: "danger"  },
  archived:  { label: "Archived",   tone: "neutral" },
};

const SEVERITY = {
  critical: { label: "Critical", tone: "danger",  color: "var(--danger)"  },
  high:     { label: "High",     tone: "danger",  color: "oklch(64% 0.18 30)" },
  medium:   { label: "Medium",   tone: "warning", color: "var(--warning)" },
  low:      { label: "Low",      tone: "info",    color: "var(--info)"    },
  info:     { label: "Info",     tone: "neutral", color: "var(--fg-tertiary)" },
};

// ─── Customers (merchants subscribed to the ISV's apps) ─────
const CUSTOMERS = [
  { id: "c01", name: "Acme Coffee",         region: "Quebec, CA",   terminals: 142, tier: "Enterprise" },
  { id: "c02", name: "Metro Foods Group",   region: "Ontario, CA",  terminals:  98, tier: "Enterprise" },
  { id: "c03", name: "Boulevard Books",     region: "BC, CA",       terminals:  24, tier: "Standard"   },
  { id: "c04", name: "Riverside Pharmacy",  region: "Alberta, CA",  terminals:  46, tier: "Standard"   },
  { id: "c05", name: "Sunset Diner Co.",    region: "Quebec, CA",   terminals:  62, tier: "Enterprise" },
  { id: "c06", name: "Northstar Logistics", region: "Ontario, CA",  terminals: 117, tier: "Enterprise" },
  { id: "c07", name: "Lighthouse Retail",   region: "Nova Scotia",  terminals:  18, tier: "Standard"   },
  { id: "c08", name: "Pinecrest Grocers",   region: "BC, CA",       terminals:  31, tier: "Standard"   },
  { id: "c09", name: "Cascade Outdoors",    region: "Alberta, CA",  terminals:  22, tier: "Standard"   },
  { id: "c10", name: "Atlas Convenience",   region: "Ontario, CA",  terminals:  84, tier: "Enterprise" },
  { id: "c11", name: "Velvet Cafe Chain",   region: "Quebec, CA",   terminals:  39, tier: "Standard"   },
  { id: "c12", name: "Harbor Hardware",     region: "Nova Scotia",  terminals:  12, tier: "Starter"    },
  { id: "c13", name: "Aurora Beauty",       region: "Ontario, CA",  terminals:  28, tier: "Standard"   },
  { id: "c14", name: "Ironwood Liquor",     region: "BC, CA",       terminals:  19, tier: "Starter"    },
  { id: "c15", name: "Trailhead Sports",    region: "Alberta, CA",  terminals:  33, tier: "Standard"   },
  { id: "c16", name: "Maple & Vine",        region: "Quebec, CA",   terminals:  14, tier: "Starter"    },
];

// ─── App icons (procedural SVGs so we don't need real assets) ──
function AppIcon({ id, size = 36, radius }) {
  const colors = {
    pos:        ["#5562F5", "#7d8aff"],
    inventory:  ["#10b981", "#34d399"],
    loyalty:    ["#f43f5e", "#fb7185"],
    reporting:  ["#0ea5e9", "#38bdf8"],
    catalog:    ["#f59e0b", "#fbbf24"],
    delivery:   ["#8b5cf6", "#a78bfa"],
    timeclock:  ["#0891b2", "#22d3ee"],
    giftcard:   ["#ec4899", "#f472b6"],
    queue:      ["#ef4444", "#f87171"],
    kds:        ["#475569", "#64748b"],
  };
  const [c1, c2] = colors[id] || ["#533fdf", "#5562F5"];
  const gid = `g-${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx={radius != null ? radius : 8} fill={`url(#${gid})`} />
      <text x="18" y="23.5" textAnchor="middle" fontFamily="Geist, sans-serif"
            fontWeight="700" fontSize="16" fill="white" letterSpacing="-0.02em">
        {(id || "?").slice(0, 1).toUpperCase()}
      </text>
    </svg>
  );
}

// ─── Vulnerability scan templates ───────────────────────────
const SCAN_FINDINGS_TEMPLATES = {
  cleanish: [
    { sev: "medium", title: "Outdated OkHttp library",     cve: "CVE-2023-3635",  pkg: "com.squareup.okhttp3:okhttp",       version: "4.9.3",  fix: "4.12.0",  desc: "Improper certificate validation can cause MitM susceptibility on TLS 1.0 handshakes." },
    { sev: "low",    title: "Cleartext network policy permitted", cve: null,      pkg: "AndroidManifest.xml",                version: "—",      fix: "Set usesCleartextTraffic=false", desc: "App allows clear-text HTTP traffic in network security config." },
    { sev: "info",   title: "Embedded debug symbols",      cve: null,             pkg: "lib/arm64-v8a/libpaycore.so",        version: "—",      fix: "Strip with R8 / ProGuard",       desc: "Native library ships with debug symbols, increasing APK size." },
    { sev: "info",   title: "Verbose logging in release",  cve: null,             pkg: "com.acme.pos.util.Logger",           version: "—",      fix: "Gate logs behind BuildConfig.DEBUG", desc: "Sensitive amounts may be written to logcat in release builds." },
  ],
  dirty: [
    { sev: "critical", title: "Hardcoded API secret in DEX", cve: null,            pkg: "com.acme.pos.net.ApiClient",         version: "—",      fix: "Move to keystore / runtime config", desc: "A production payment-gateway secret is embedded as a string literal in the compiled bytecode." },
    { sev: "high",     title: "Insecure deserialization",     cve: "CVE-2024-5188", pkg: "com.fasterxml.jackson.core:jackson-databind", version: "2.13.2", fix: "2.16.1", desc: "Polymorphic type handling permits arbitrary class loading from JSON payloads." },
    { sev: "high",     title: "Permissive WebView JS bridge", cve: null,            pkg: "com.acme.pos.web.PortalView",        version: "—",      fix: "Restrict @JavascriptInterface", desc: "WebView exposes Java methods to all origins; remote scripts can invoke pay() callbacks." },
    { sev: "medium",   title: "Outdated OkHttp library",      cve: "CVE-2023-3635", pkg: "com.squareup.okhttp3:okhttp",        version: "4.9.3",  fix: "4.12.0",  desc: "Improper certificate validation can cause MitM susceptibility on TLS 1.0 handshakes." },
    { sev: "medium",   title: "Exported activity without permission", cve: null,    pkg: "com.acme.pos.RefundActivity",        version: "—",      fix: "Add android:exported=false or permission",  desc: "Refund flow is launchable by third-party apps via implicit intent." },
    { sev: "low",      title: "Cleartext traffic permitted",  cve: null,            pkg: "AndroidManifest.xml",                version: "—",      fix: "Set usesCleartextTraffic=false", desc: "App allows clear-text HTTP traffic in network security config." },
    { sev: "info",     title: "Embedded debug symbols",       cve: null,            pkg: "lib/arm64-v8a/libpaycore.so",        version: "—",      fix: "Strip with R8 / ProGuard",       desc: "Native library ships with debug symbols, increasing APK size." },
  ],
  clean: [
    { sev: "info", title: "Embedded debug symbols", cve: null, pkg: "lib/arm64-v8a/libpaycore.so", version: "—", fix: "Strip with R8 / ProGuard", desc: "Native library ships with debug symbols, increasing APK size." },
  ],
};

function summariseFindings(findings) {
  const out = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  (findings || []).forEach(f => { out[f.sev] = (out[f.sev] || 0) + 1; });
  return out;
}

// ─── Apps & version histories ───────────────────────────────
function pickCustomerIds(count) {
  return CUSTOMERS.slice(0, count).map(c => c.id);
}

const APPS = [
  {
    id: "pos",
    name: "Acme POS Pro",
    package: "com.acme.pos.pro",
    iconId: "pos",
    category: "Payments",
    description: "Full-featured point of sale with split tender, refunds, and offline queueing. Includes the Acme Pay SDK and built-in receipt printer support.",
    devices: ["N950", "S90", "S60", "N750P"],
    status: "published",
    subscriberIds: pickCustomerIds(11),
    versions: [
      { id: "v32", code: 1432, name: "4.3.2", size: "28.4 MB", uploadedAt: "May 09, 2026", publishedAt: "May 10, 2026", status: "published", scan: "cleanish", current: true,
        notes: "Fixes EMV fallback bug on N750P. Adds tip suggestion presets configurable per merchant. Improves offline queue retry backoff (now exponential, max 30 min).",
        signer: "Acme Software Inc. · SHA-256 d4:e2:8a:…",
        minSdk: 24, targetSdk: 34, perms: 18,
        rolloutPct: 100, reach: 11, },
      { id: "v31", code: 1431, name: "4.3.1", size: "28.1 MB", uploadedAt: "Apr 22, 2026", publishedAt: "Apr 23, 2026", status: "published", scan: "cleanish",
        notes: "Patch release: timeout handling on Bluetooth pinpad pairing.", rolloutPct: 100, reach: 11, perms: 18, minSdk: 24, targetSdk: 34 },
      { id: "v30", code: 1430, name: "4.3.0", size: "27.9 MB", uploadedAt: "Apr 04, 2026", publishedAt: "Apr 07, 2026", status: "published", scan: "cleanish",
        notes: "Adds split-tender and partial refund flows. New analytics export endpoint.", rolloutPct: 100, reach: 11, perms: 18, minSdk: 24, targetSdk: 34 },
      { id: "v29", code: 1429, name: "4.2.5", size: "27.6 MB", uploadedAt: "Mar 11, 2026", publishedAt: "Mar 12, 2026", status: "published", scan: "cleanish",
        notes: "Localization fixes for fr-CA. PCI re-cert paperwork.", rolloutPct: 100, reach: 11, perms: 17, minSdk: 24, targetSdk: 33 },
      { id: "v28", code: 1428, name: "4.2.4", size: "27.6 MB", uploadedAt: "Feb 18, 2026", publishedAt: "Feb 19, 2026", status: "rollback",
        notes: "Rolled back after crash in tip prompt on S60. Replaced by 4.2.5 within 27h.", rolloutPct: 100, reach: 6, perms: 17, minSdk: 24, targetSdk: 33, scan: "cleanish" },
    ],
  },
  {
    id: "inventory",
    name: "Stockroom",
    package: "com.acme.stockroom",
    iconId: "inventory",
    category: "Operations",
    description: "Inventory counts, receiving, and barcode-based stock transfers. Pairs with the POS for real-time on-hand updates.",
    devices: ["N950", "S90", "X800", "N750", "N750K"],
    status: "published",
    subscriberIds: pickCustomerIds(7),
    versions: [
      { id: "v12", code: 212, name: "2.1.2", size: "14.2 MB", uploadedAt: "May 02, 2026", publishedAt: "May 05, 2026", status: "published", scan: "cleanish", current: true,
        notes: "Adds bulk transfer mode. Cycle-count tasks now sync incrementally.", rolloutPct: 100, reach: 7, perms: 11, minSdk: 24, targetSdk: 34, signer: "Acme Software Inc. · SHA-256 d4:e2:8a:…" },
      { id: "v11", code: 211, name: "2.1.1", size: "14.0 MB", uploadedAt: "Apr 03, 2026", publishedAt: "Apr 05, 2026", status: "published", scan: "clean",
        notes: "Bug fixes for receiving workflow.", rolloutPct: 100, reach: 7, perms: 11, minSdk: 24, targetSdk: 34 },
      { id: "v10", code: 210, name: "2.1.0", size: "13.9 MB", uploadedAt: "Mar 02, 2026", publishedAt: "Mar 04, 2026", status: "published", scan: "clean",
        notes: "Initial 2.1 — cycle counts.", rolloutPct: 100, reach: 6, perms: 10, minSdk: 24, targetSdk: 33 },
    ],
  },
  {
    id: "loyalty",
    name: "Loyalty+",
    package: "com.acme.loyalty",
    iconId: "loyalty",
    category: "Customer",
    description: "Punch-card and points-based loyalty programs. Customers enroll by phone number; rewards redeem at the POS.",
    devices: ["N950", "S90", "S60", "S30"],
    status: "pending",
    subscriberIds: pickCustomerIds(9),
    versions: [
      { id: "v07", code: 107, name: "1.4.0-rc1", size: "9.8 MB", uploadedAt: "May 12, 2026", status: "pending", scan: "dirty", current: true,
        notes: "RC for 1.4.0 — adds tiered rewards and SMS push. Held for security review.",
        signer: "Acme Software Inc. · SHA-256 d4:e2:8a:…",
        rolloutPct: 0, reach: 9, perms: 14, minSdk: 24, targetSdk: 34 },
      { id: "v06", code: 106, name: "1.3.4", size: "9.5 MB", uploadedAt: "Apr 18, 2026", publishedAt: "Apr 20, 2026", status: "published", scan: "cleanish",
        notes: "Hotfix: enrollment screen race condition.", rolloutPct: 100, reach: 9, perms: 12, minSdk: 24, targetSdk: 34 },
      { id: "v05", code: 105, name: "1.3.3", size: "9.4 MB", uploadedAt: "Mar 27, 2026", publishedAt: "Mar 29, 2026", status: "published", scan: "cleanish",
        notes: "Performance improvements.", rolloutPct: 100, reach: 8, perms: 12, minSdk: 24, targetSdk: 34 },
    ],
  },
  {
    id: "reporting",
    name: "Insights",
    package: "com.acme.insights",
    iconId: "reporting",
    category: "Analytics",
    description: "Daily sales summaries, hourly heatmaps, and tip-out reporting. Works alongside the POS.",
    devices: ["N950", "X800", "S90"],
    status: "published",
    subscriberIds: pickCustomerIds(6),
    versions: [
      { id: "v04", code: 4, name: "1.2.0", size: "11.1 MB", uploadedAt: "Apr 11, 2026", publishedAt: "Apr 12, 2026", status: "published", scan: "cleanish", current: true,
        notes: "Hourly heatmap, exportable as CSV.", rolloutPct: 100, reach: 6, perms: 8, minSdk: 24, targetSdk: 34 },
      { id: "v03", code: 3, name: "1.1.2", size: "10.8 MB", uploadedAt: "Mar 14, 2026", publishedAt: "Mar 15, 2026", status: "published", scan: "clean",
        notes: "Reliability fixes.", rolloutPct: 100, reach: 6, perms: 8, minSdk: 24, targetSdk: 33 },
    ],
  },
  {
    id: "catalog",
    name: "Catalog Sync",
    package: "com.acme.catalog",
    iconId: "catalog",
    category: "Operations",
    description: "Two-way item & price sync between merchant ERP and terminal. Drag-and-drop CSV import, schedulable jobs.",
    devices: ["N950", "X800", "S90", "N750P"],
    status: "published",
    subscriberIds: pickCustomerIds(8),
    versions: [
      { id: "v09", code: 109, name: "1.0.9", size: "7.4 MB", uploadedAt: "Apr 28, 2026", publishedAt: "Apr 30, 2026", status: "published", scan: "cleanish", current: true,
        notes: "Adds price-rule conflict detection.", rolloutPct: 100, reach: 8, perms: 9, minSdk: 24, targetSdk: 34 },
      { id: "v08", code: 108, name: "1.0.8", size: "7.2 MB", uploadedAt: "Apr 02, 2026", publishedAt: "Apr 03, 2026", status: "published", scan: "clean",
        notes: "Minor improvements.", rolloutPct: 100, reach: 8, perms: 9, minSdk: 24, targetSdk: 34 },
    ],
  },
  {
    id: "delivery",
    name: "Curbside",
    package: "com.acme.curbside",
    iconId: "delivery",
    category: "Customer",
    description: "Order ahead and curbside pickup workflow, with arrival notifications by SMS.",
    devices: ["N950", "S90"],
    status: "draft",
    subscriberIds: pickCustomerIds(3),
    versions: [
      { id: "v02", code: 2, name: "0.9.0-beta", size: "6.6 MB", uploadedAt: "May 11, 2026", status: "draft", scan: null, current: true,
        notes: "Initial beta. Open invite — not yet published.", rolloutPct: 0, reach: 3, perms: 7, minSdk: 24, targetSdk: 34 },
    ],
  },
  {
    id: "timeclock",
    name: "Timeclock",
    package: "com.acme.timeclock",
    iconId: "timeclock",
    category: "Operations",
    description: "Employee clock-in / clock-out with PIN or NFC badge. Exports approved hours to payroll.",
    devices: ["N950", "S90", "S60", "S30", "N750"],
    status: "published",
    subscriberIds: pickCustomerIds(10),
    versions: [
      { id: "v15", code: 215, name: "2.0.5", size: "5.9 MB", uploadedAt: "Apr 19, 2026", publishedAt: "Apr 21, 2026", status: "published", scan: "cleanish", current: true,
        notes: "Adds NFC badge support on N950.", rolloutPct: 100, reach: 10, perms: 6, minSdk: 24, targetSdk: 34 },
      { id: "v14", code: 214, name: "2.0.4", size: "5.8 MB", uploadedAt: "Mar 24, 2026", publishedAt: "Mar 25, 2026", status: "published", scan: "clean",
        notes: "i18n: zh-CN.", rolloutPct: 100, reach: 10, perms: 6, minSdk: 24, targetSdk: 33 },
    ],
  },
  {
    id: "giftcard",
    name: "Giftcards",
    package: "com.acme.giftcard",
    iconId: "giftcard",
    category: "Payments",
    description: "Issue, redeem, and reload prepaid giftcards. Includes plastic-card BIN provisioning.",
    devices: ["N950", "S90", "N750P"],
    status: "published",
    subscriberIds: pickCustomerIds(5),
    versions: [
      { id: "v06", code: 16, name: "1.6.0", size: "4.3 MB", uploadedAt: "May 04, 2026", publishedAt: "May 06, 2026", status: "published", scan: "cleanish", current: true,
        notes: "Reload via QR.", rolloutPct: 100, reach: 5, perms: 5, minSdk: 24, targetSdk: 34 },
    ],
  },
];

Object.assign(window, {
  DEVICE_MODELS, APP_STATUS, SEVERITY, CUSTOMERS, APPS,
  AppIcon, SCAN_FINDINGS_TEMPLATES, summariseFindings,
});
