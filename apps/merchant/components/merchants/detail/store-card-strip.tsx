'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react'
import { Button } from '@cloud/ui'
import type { Merchant, Store } from '../data/types'

interface StoreCardStripProps {
  merchant: Merchant
  selectedStoreId: string | undefined
  onSelectStore: (id: string) => void
  onAddStore: () => void
}

export function StoreCardStrip({ merchant, selectedStoreId, onSelectStore, onAddStore }: StoreCardStripProps) {
  const stores = merchant.stores
  const [query, setQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canL, setCanL] = useState(false)
  const [canR, setCanR] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return stores
    return stores.filter((s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q))
  }, [stores, query])

  const updateOverflow = () => {
    const el = scrollRef.current
    if (!el) return
    setCanL(el.scrollLeft > 4)
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateOverflow()
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => updateOverflow()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateOverflow)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateOverflow)
    }
  }, [filtered.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !selectedStoreId) return
    const node = el.querySelector<HTMLElement>(`[data-store-id="${selectedStoreId}"]`)
    if (!node) return
    const elRect = el.getBoundingClientRect()
    const nodeRect = node.getBoundingClientRect()
    if (nodeRect.left < elRect.left || nodeRect.right > elRect.right) {
      el.scrollTo({
        left: node.offsetLeft - el.clientWidth / 2 + node.offsetWidth / 2,
        behavior: 'smooth',
      })
    }
  }, [selectedStoreId])

  const showTools = stores.length > 6
  const nudge = (dir: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.7, 240), behavior: 'smooth' })
  }

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs uppercase tracking-wider text-content-tertiary font-medium">Stores</span>
        <span className="font-mono text-xs text-content-secondary">{stores.length}</span>
      </div>

      {showTools && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface-2 border border-line-default flex-1 max-w-[320px] min-w-[200px]">
            <Search size={13} className="text-content-tertiary shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name or address…"
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[12.5px] text-content-primary placeholder:text-content-tertiary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="cursor-pointer text-content-tertiary hover:text-content-primary"
                aria-label="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex-1" />
          <span className="text-[11px] text-content-tertiary whitespace-nowrap">
            <span className="font-mono font-medium text-content-secondary">{filtered.length}</span> of{' '}
            <span className="font-mono">{stores.length}</span>
          </span>
          <div className="inline-flex gap-1">
            <ScrollButton enabled={canL} label="Scroll left" onClick={() => nudge(-1)}>
              <ChevronLeft size={14} />
            </ScrollButton>
            <ScrollButton enabled={canR} label="Scroll right" onClick={() => nudge(1)}>
              <ChevronRight size={14} />
            </ScrollButton>
          </div>
          <Button size="sm" iconLeft={<Plus size={12} />} onClick={onAddStore}>
            Add store
          </Button>
        </div>
      )}

      <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto py-1 px-0.5">
        {filtered.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-content-tertiary border border-dashed border-line-default rounded-md">
            No stores match &quot;{query}&quot;.
            <button
              type="button"
              onClick={() => setQuery('')}
              className="cursor-pointer text-primary-700 underline bg-transparent"
            >
              Clear filter
            </button>
          </div>
        ) : (
          filtered.map((s) => (
            <StoreCard
              key={s.id}
              store={s}
              terminalCount={merchant.terminals.filter((t) => t.storeId === s.id).length}
              selected={selectedStoreId === s.id}
              onSelect={() => onSelectStore(s.id)}
            />
          ))
        )}
        {!showTools && <AddStoreCard onClick={onAddStore} />}
      </div>
    </div>
  )
}

interface StoreCardProps {
  store: Store
  terminalCount: number
  selected: boolean
  onSelect: () => void
}

function StoreCard({ store, terminalCount, selected, onSelect }: StoreCardProps) {
  return (
    <button
      type="button"
      data-store-id={store.id}
      onClick={onSelect}
      className={`shrink-0 min-w-[180px] max-w-[220px] px-3.5 py-3 text-left rounded-lg border cursor-pointer transition-all duration-fast flex flex-col gap-1 ${
        selected
          ? 'bg-primary-50 border-primary-500 ring-[3px] ring-primary-500/10'
          : 'bg-surface-2 border-line-default shadow-1 hover:bg-surface-hover'
      }`}
    >
      <div className="flex items-start gap-1.5">
        <span
          title={store.name}
          className={`text-[13px] font-medium leading-tight line-clamp-2 break-words ${
            selected ? 'text-primary-700' : 'text-content-primary'
          }`}
        >
          {store.name}
        </span>
        {store.isHQ && (
          <span
            className={`shrink-0 mt-0.5 px-1.5 py-px text-[9.5px] font-mono font-medium tracking-wider rounded text-primary-700 ${
              selected ? 'bg-surface-2' : 'bg-primary-50'
            }`}
          >
            HQ
          </span>
        )}
      </div>
      <div className={`text-[11px] ${selected ? 'text-primary-700' : 'text-content-tertiary'}`}>
        <span className="font-mono font-medium">{terminalCount}</span> terminal{terminalCount === 1 ? '' : 's'}
      </div>
    </button>
  )
}

function AddStoreCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 min-w-[140px] px-3.5 py-3 text-center rounded-lg cursor-pointer bg-surface-2 border-[1.5px] border-dashed border-line-default text-content-secondary hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors flex flex-col items-center gap-1.5"
    >
      <Plus size={16} strokeWidth={1.8} />
      <span className="text-xs font-medium">Add store</span>
    </button>
  )
}

function ScrollButton({
  enabled,
  label,
  onClick,
  children,
}: {
  enabled: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-7 h-7 inline-flex items-center justify-center rounded-sm bg-surface-2 border border-line-default transition-colors ${
        enabled ? 'text-content-primary hover:bg-surface-hover cursor-pointer' : 'text-content-disabled cursor-not-allowed opacity-50'
      }`}
    >
      {children}
    </button>
  )
}
