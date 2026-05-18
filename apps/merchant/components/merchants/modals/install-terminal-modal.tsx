'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import { Button, Modal, Spinner } from '@cloud/ui'
import type { Merchant, Terminal } from '../data/types'

interface ResolvedDevice {
  sn: string
  model: string
}

const SAMPLES: ResolvedDevice[] = [
  { sn: 'N950-0288-7541', model: 'N950' },
  { sn: 'N950-0014-7912', model: 'N950' },
  { sn: 'S90-0822-3104', model: 'S90' },
  { sn: 'S60-0488-2284', model: 'S60' },
  { sn: 'N750-0099-1052', model: 'N750' },
  { sn: 'X800-0099-2018', model: 'X800' },
]

function resolveActivationCode(code: string): ResolvedDevice {
  let h = 0
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff
  return SAMPLES[h % SAMPLES.length]
}

type Phase = 'entering' | 'resolving' | 'resolved' | 'error'

interface InstallTerminalModalProps {
  open: boolean
  merchant: Merchant
  terminal: Terminal
  onClose: () => void
  onConfirm: (resolved: ResolvedDevice) => void
}

export function InstallTerminalModal({ open, merchant, terminal, onClose, onConfirm }: InstallTerminalModalProps) {
  const store = merchant.stores.find((s) => s.id === terminal.storeId)
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState<Phase>('entering')
  const [resolved, setResolved] = useState<ResolvedDevice | null>(null)
  const lookupTimer = useRef<number | null>(null)

  const onCodeChange = (raw: string) => {
    const next = raw.replace(/\D/g, '').slice(0, 6)
    setCode(next)
    setResolved(null)
    if (lookupTimer.current != null) window.clearTimeout(lookupTimer.current)
    if (next.length !== 6) {
      setPhase('entering')
      return
    }
    setPhase('resolving')
    lookupTimer.current = window.setTimeout(() => {
      if (next === '000000') {
        setPhase('error')
        return
      }
      setResolved(resolveActivationCode(next))
      setPhase('resolved')
    }, 600)
  }

  const borderColor =
    phase === 'error' ? 'border-error-strong' : phase === 'resolved' ? 'border-success-strong' : 'border-line-default'

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="sm:max-w-xl"
      title="Bind device"
      description="Enter the 6-digit code shown on the terminal screen. The system will match it to a device and bind that SN to this VarSheet."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            iconLeft={<Check size={14} />}
            disabled={phase !== 'resolved' || !resolved}
            onClick={() => resolved && onConfirm(resolved)}
          >
            Confirm install
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-y-1.5 gap-x-3 p-3 rounded-md bg-surface-2 border border-line-default">
          <KvLabel>Merchant No.</KvLabel>
          <KvValue mono>{merchant.mid}</KvValue>
          <KvLabel>Terminal No.</KvLabel>
          <KvValue mono>{terminal.tid}</KvValue>
          <KvLabel>Store</KvLabel>
          <KvValue>
            {store?.name ?? '—'}
            {store?.isHQ ? ' (HQ)' : ''}
          </KvValue>
        </div>

        <div>
          <label htmlFor="device-code" className="block text-xs font-medium text-content-secondary mb-1.5">
            Device code
          </label>
          <input
            id="device-code"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="000000"
            autoFocus
            inputMode="numeric"
            className={`w-full px-4 py-3.5 text-center font-mono text-3xl font-semibold tracking-[0.18em] rounded-md bg-surface-2 border-[1.5px] outline-none transition-colors focus:border-line-focus ${borderColor}`}
          />
        </div>

        {phase === 'resolving' && (
          <div className="flex items-center gap-2 text-sm text-content-secondary">
            <Spinner size="sm" /> Looking up the code…
          </div>
        )}
        {phase === 'error' && (
          <div className="flex items-center gap-2 text-sm text-error-strong">
            <AlertTriangle size={14} /> No device matches that code. Re-check the screen and re-enter.
          </div>
        )}
        {phase === 'resolved' && resolved && (
          <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-y-1.5 gap-x-3 p-3 rounded-md bg-success-bg border border-success-strong/40">
            <KvLabel>Serial number</KvLabel>
            <KvValue mono>{resolved.sn}</KvValue>
            <KvLabel>Model</KvLabel>
            <KvValue>{resolved.model}</KvValue>
          </div>
        )}
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
