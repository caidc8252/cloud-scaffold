import type { MerchantTotals } from '../data/types'

interface MerchantKpiStripProps {
  totals: MerchantTotals
}

interface Tile {
  label: string
  value: number
  sub: string
  tone?: 'success'
}

export function MerchantKpiStrip({ totals }: MerchantKpiStripProps) {
  const tiles: Tile[] = [
    { label: 'Merchants', value: totals.merchants, sub: 'registered' },
    { label: 'Stores', value: totals.stores, sub: 'across all merchants' },
    { label: 'Terminals', value: totals.terminals, sub: 'bound to a store' },
    { label: 'Installed terminals', value: totals.installed, sub: 'installation completed', tone: 'success' },
  ]
  return (
    <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      {tiles.map((t) => (
        <div
          key={t.label}
          className="px-4 py-3 rounded-lg bg-surface-2 border border-line-default shadow-1"
        >
          <div className="text-[10.5px] uppercase tracking-wider text-content-tertiary font-medium">{t.label}</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span
              className={`font-mono text-2xl font-medium tracking-tight ${t.tone === 'success' ? 'text-success-strong' : 'text-content-primary'}`}
            >
              {t.value}
            </span>
            <span className="text-[11px] text-content-tertiary">{t.sub}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
