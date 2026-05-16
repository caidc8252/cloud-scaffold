'use client'

import { useState } from 'react'
import { Copy, Info, Pencil, Store as StoreIcon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@cloud/ui'
import type { Store } from '../data/types'
import { StoreDetailsModal } from './store-details-modal'

interface SelectedStoreHeaderProps {
  store: Store
  onEdit: () => void
  onDelete: () => void
}

export function SelectedStoreHeader({ store, onEdit, onDelete }: SelectedStoreHeaderProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  const copyAddress = async () => {
    const text = `${store.address}${store.country ? `, ${store.country}` : ''}`
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Address copied to clipboard')
    } catch {
      toast.warning("Couldn't copy — check browser permissions")
    }
  }

  return (
    <>
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-surface-2 border border-line-default mb-3">
        <StoreIcon size={13} className="text-content-tertiary shrink-0" />
        <span
          title={store.address || undefined}
          className="text-[12.5px] text-content-secondary min-w-0 truncate"
        >
          {store.address || <span className="text-content-tertiary">No address on file</span>}
        </span>
        {store.address && (
          <button
            type="button"
            onClick={copyAddress}
            title="Copy address"
            aria-label="Copy address"
            className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-sm cursor-pointer text-content-tertiary hover:bg-surface-hover hover:text-content-primary transition-colors shrink-0"
          >
            <Copy size={12} />
          </button>
        )}
        <span className="text-[11.5px] text-content-tertiary whitespace-nowrap">· {store.country}</span>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" iconLeft={<Info size={13} />} onClick={() => setDetailsOpen(true)}>
          Details
        </Button>
        <Button size="sm" variant="ghost" iconLeft={<Pencil size={13} />} onClick={onEdit}>
          Edit
        </Button>
        {!store.isHQ && (
          <Button size="icon-sm" variant="ghost" aria-label="Delete store" onClick={onDelete}>
            <Trash2 size={13} />
          </Button>
        )}
      </div>

      <StoreDetailsModal open={detailsOpen} store={store} onClose={() => setDetailsOpen(false)} />
    </>
  )
}
