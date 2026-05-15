import { MERCHANTS_SEED } from './seed'
import type { Merchant, MerchantTotals, Store, Terminal } from './types'

function hash(input: string): number {
  let h = 0
  for (const c of input) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff
  return h
}

function deriveMid(id: string): string {
  return 'M' + String(82_100_000 + (hash(id) % 89_999)).padStart(8, '0')
}

function deriveTid(key: string): string {
  return 'T' + String(101_0000 + (hash(key) % 8_999_99)).padStart(8, '0')
}

function normalize(seed: typeof MERCHANTS_SEED): Merchant[] {
  return seed.map((m) => {
    const created = m.createdAt || '—'
    return {
      id: m.id,
      name: m.name,
      country: m.country,
      tags: m.tags,
      notes: m.notes,
      mid: deriveMid(m.id),
      createdAt: created,
      updatedAt: created,
      stores: m.stores.map((s): Store => ({
        id: s.id,
        name: s.name,
        isHQ: s.isHQ,
        address: s.address,
        country: s.country,
        notes: s.notes,
        createdAt: s.createdAt ?? created,
        updatedAt: s.updatedAt ?? s.createdAt ?? created,
      })),
      terminals: m.terminals.map((t, i): Terminal => ({
        ...t,
        tid: t.tid ?? deriveTid(t.sn ?? `${m.id}:${i}`),
        createdAt: t.createdAt ?? created,
        updatedAt: t.updatedAt ?? t.createdAt ?? created,
      })),
    }
  })
}

export const MERCHANTS: Merchant[] = normalize(MERCHANTS_SEED)

export function findMerchant(id: string | undefined): Merchant | undefined {
  if (!id) return undefined
  return MERCHANTS.find((m) => m.id === id)
}

export function cloneMerchant(merchant: Merchant): Merchant {
  return {
    ...merchant,
    tags: [...merchant.tags],
    stores: merchant.stores.map((s) => ({ ...s })),
    terminals: merchant.terminals.map((t) => ({ ...t, cardSchemes: t.cardSchemes ? [...t.cardSchemes] : t.cardSchemes })),
  }
}

export function filterMerchants(list: Merchant[], query: string, country: string): Merchant[] {
  const needle = query.trim().toLowerCase()
  return list.filter((m) => {
    if (country !== 'any' && m.country !== country) return false
    if (!needle) return true
    if (m.name.toLowerCase().includes(needle)) return true
    if ((m.tags || []).some((t) => t.toLowerCase().includes(needle))) return true
    if ((m.stores || []).some((s) => s.name.toLowerCase().includes(needle))) return true
    return false
  })
}

export function merchantTotals(list: Merchant[]): MerchantTotals {
  return {
    merchants: list.length,
    stores: list.reduce((acc, m) => acc + m.stores.length, 0),
    terminals: list.reduce((acc, m) => acc + m.terminals.length, 0),
    installed: list.reduce((acc, m) => acc + m.terminals.filter((t) => t.state === 'active').length, 0),
  }
}

export function terminalsForStore(merchant: Merchant, storeId: string | undefined): Terminal[] {
  if (!storeId) return []
  return merchant.terminals.filter((t) => t.storeId === storeId)
}

export function uniqueCountries(list: Merchant[]): string[] {
  return Array.from(new Set(list.map((m) => m.country))).sort()
}
