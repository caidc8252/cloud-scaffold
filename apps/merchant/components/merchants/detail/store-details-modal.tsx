'use client'

import { Button, Modal } from '@cloud/ui'
import type { Store } from '../data/types'

interface StoreDetailsModalProps {
  open: boolean
  store: Store
  onClose: () => void
}

export function StoreDetailsModal({ open, store, onClose }: StoreDetailsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="sm:max-w-md"
      title={store.name}
      description={store.isHQ ? 'Headquarter — auto-created with the merchant.' : 'Store details'}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-2 gap-x-3.5">
        <Label>Address</Label>
        <Value>{store.address || <span className="text-content-tertiary">—</span>}</Value>
        <Label>Country</Label>
        <Value>{store.country}</Value>
        {store.notes && (
          <>
            <Label>Notes</Label>
            <Value>
              <span className="whitespace-pre-wrap">{store.notes}</span>
            </Value>
          </>
        )}
        <Label>Created</Label>
        <Value mono>{store.createdAt}</Value>
        {store.updatedAt && store.updatedAt !== store.createdAt && (
          <>
            <Label>Updated</Label>
            <Value mono>{store.updatedAt}</Value>
          </>
        )}
      </div>
    </Modal>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] text-content-tertiary font-medium pt-0.5">{children}</div>
}
function Value({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <div className={`text-xs text-content-primary ${mono ? 'font-mono text-[11.5px] text-content-tertiary' : ''}`}>{children}</div>
}
