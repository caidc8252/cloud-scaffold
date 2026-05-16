'use client'

import { Unlink } from 'lucide-react'
import { Alert, AlertDescription, Button, Modal } from '@cloud/ui'
import type { Merchant, Terminal } from '../data/types'

interface UnbindTerminalModalProps {
  open: boolean
  merchant: Merchant
  terminal: Terminal
  onClose: () => void
  onConfirm: () => void
}

export function UnbindTerminalModal({ open, merchant, terminal, onClose, onConfirm }: UnbindTerminalModalProps) {
  const store = merchant.stores.find((s) => s.id === terminal.storeId)
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="sm:max-w-lg"
      title={`Unbind terminal ${terminal.sn ?? terminal.tid}?`}
      description="Unbinding clears the device from this VarSheet. The VarSheet stays in place — you can bind a different device later."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" iconLeft={<Unlink size={14} />} onClick={onConfirm}>
            Unbind device
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Alert variant="warning">
          <AlertDescription>
            End the payment session on the terminal first. Unbinding while a transaction is in flight may strand it in
            &quot;pending&quot; state.
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-1.5 gap-x-3 p-3 rounded-md bg-surface-2 border border-line-default">
          <KvLabel>Merchant No.</KvLabel>
          <KvValue mono>{merchant.mid}</KvValue>
          <KvLabel>Terminal No.</KvLabel>
          <KvValue mono>{terminal.tid}</KvValue>
          <KvLabel>Store</KvLabel>
          <KvValue>
            {store?.name ?? '—'}
            {store?.isHQ ? ' (HQ)' : ''}
          </KvValue>
          <KvLabel>Serial number</KvLabel>
          <KvValue mono>{terminal.sn ?? '—'}</KvValue>
          <KvLabel>Model</KvLabel>
          <KvValue>{terminal.model ?? '—'}</KvValue>
          <KvLabel>Last seen</KvLabel>
          <KvValue>{terminal.lastSeen}</KvValue>
        </div>
      </div>
    </Modal>
  )
}

function KvLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] text-content-tertiary font-medium pt-0.5">{children}</div>
}
function KvValue({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <div className={`text-xs text-content-primary ${mono ? 'font-mono' : ''}`}>{children}</div>
}
