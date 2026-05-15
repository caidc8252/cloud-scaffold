'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { ScanLine, Check, X, Trash2, Sparkles } from 'lucide-react'
import {
  Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Checkbox, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Progress,
} from '@cloud/ui'
import { fakeSerialNumber, type Order, type OrderDevice, type OrderItem } from '@/lib/data/orders'

const ACTIVATION_RESOLVE_DELAY = 320
const SAMPLE_TYPES = ['Stand-alone', 'Semi-integration', 'Full-integration']

type ActivationResult = { error: string } | { sn: string; itemId: string; modelName: string; type: string }

function lookupActivationCode(code: string, orderItems: OrderItem[], alreadyActivatedSet: Set<string>): ActivationResult | null {
  if (!code || code.length !== 6) return null
  if (code.startsWith('000')) return { error: 'No device found for this activation code.' }
  if (alreadyActivatedSet.has(code)) return { error: 'This activation code is already bound to a device in this order.' }
  const n = parseInt(code, 10)
  const item = orderItems[n % orderItems.length]
  if (!item) return { error: 'No matching model on this order.' }
  if (item.devices.length >= item.qty) {
    return { error: `${item.modelName} already has all ${item.qty} units activated. Try a different code.` }
  }
  const prefix = (item.modelName.match(/[A-Z]\d+/g)?.[0] || item.modelName.slice(0, 3).toUpperCase())
  return {
    sn: fakeSerialNumber(prefix, 90000 + (n % 99999)),
    itemId: item.id,
    modelName: item.modelName,
    type: item.type,
  }
}

export function ActivationTab({ order, onUpdate, readonly }: {
  order: Order; onUpdate: (o: Order) => void; readonly: boolean
}) {
  const [code, setCode] = useState('')
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState<{ itemId: string; sn: string } | null>(null)
  const [removeTarget, setRemoveTarget] = useState<{ itemId: string; deviceIdx: number; sn: string; modelName: string } | null>(null)
  const [factoryReset, setFactoryReset] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const orderRef = useRef(order)
  useEffect(() => { orderRef.current = order }, [order])

  const activatedCodes = useMemo(() => {
    const s = new Set<string>()
    order.items.forEach(i => i.devices.forEach(d => d.code && s.add(d.code)))
    return s
  }, [order])

  const handleCodeChange = useCallback((value: string) => {
    setCode(value)
    clearTimeout(timerRef.current)

    if (value.length !== 6) {
      setError('')
      setResolving(false)
      return
    }
    setResolving(true)
    setError('')

    timerRef.current = setTimeout(() => {
      setResolving(false)
      const cur = orderRef.current
      const codes = new Set<string>()
      cur.items.forEach(i => i.devices.forEach(d => d.code && codes.add(d.code)))
      const res = lookupActivationCode(value, cur.items, codes)
      if (!res) return
      if ('error' in res) { setError(res.error ?? 'Unknown error'); return }
      const nextItems = cur.items.map(it => it.id !== res.itemId ? it : {
        ...it,
        devices: [...it.devices, { sn: res.sn, code: value, type: res.type }],
      })
      onUpdate({ ...cur, items: nextItems })
      setFlash({ itemId: res.itemId, sn: res.sn })
      setCode('')
      setTimeout(() => setFlash(null), 1600)
      inputRef.current?.focus()
    }, ACTIVATION_RESOLVE_DELAY)
  }, [onUpdate])

  const removeDevice = (itemId: string, deviceIdx: number, withReset: boolean) => {
    const target = order.items.find(it => it.id === itemId)
    const dev = target?.devices[deviceIdx]
    const nextItems = order.items.map(it => it.id !== itemId ? it : {
      ...it,
      devices: it.devices.filter((_, i) => i !== deviceIdx),
    })
    const ev = {
      at: new Date().toISOString(), kind: 'info', by: 'jordan.d@carbon',
      text: `Unbound ${target?.modelName} · SN ${dev?.sn}${withReset ? ' · factory reset triggered' : ''}`,
    }
    onUpdate({ ...order, items: nextItems, events: [...order.events, ev] })
  }

  const confirmRemove = () => {
    if (!removeTarget) return
    removeDevice(removeTarget.itemId, removeTarget.deviceIdx, factoryReset)
    toast.success('Device unbound', {
      description: factoryReset
        ? `${removeTarget.sn} unbound · factory reset signal sent.`
        : `${removeTarget.sn} unbound from this order.`,
    })
    setRemoveTarget(null)
    setFactoryReset(true)
  }

  const updateDeviceType = (itemId: string, deviceIdx: number, type: string) => {
    const nextItems = order.items.map(it => it.id !== itemId ? it : {
      ...it,
      devices: it.devices.map((d, i) => i === deviceIdx ? { ...d, type } : d),
    })
    onUpdate({ ...order, items: nextItems })
  }

  const simulateScan = () => {
    const open = order.items.filter(i => i.devices.length < i.qty)
    if (open.length === 0) return
    const itemIdx = order.items.indexOf(open[0])
    for (let attempt = 0; attempt < 200; attempt++) {
      const base = 100000 + Math.floor(Math.random() * 899999)
      const adjusted = base - (base % order.items.length) + itemIdx
      const c = String(adjusted).padStart(6, '0').slice(-6)
      if (c.length === 6 && !c.startsWith('000') && !activatedCodes.has(c)) {
        handleCodeChange(c)
        return
      }
    }
  }

  // Flatten activated devices, most recent first
  const allDevices: (OrderDevice & { itemId: string; modelName: string; deviceIdx: number })[] = []
  order.items.forEach(it => {
    it.devices.forEach((d, i) => allDevices.push({ ...d, itemId: it.id, modelName: it.modelName, deviceIdx: i }))
  })
  allDevices.reverse()

  const codeValid = code.length === 6
  const inputBorder = error ? 'border-error/50' : codeValid ? 'border-success/40' : 'border-line-default'

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-content-primary">Devices & activation</h3>
        <p className="mt-0.5 text-[12.5px] text-content-tertiary">
          Enter each device&rsquo;s 6-digit activation code below. Once matched, the device is bound to this order &mdash; exiting this page doesn&rsquo;t affect already-bound records.
        </p>
      </div>

      {/* Unified input */}
      {!readonly && (
        <div className={`flex items-stretch gap-2.5 p-3.5 bg-surface-2 border ${inputBorder} rounded-xl mb-3.5 transition-colors duration-150`}>
          <div className="size-[38px] rounded-lg bg-surface-3 grid place-items-center text-content-secondary shrink-0">
            <ScanLine size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[11.5px] font-medium text-content-tertiary uppercase tracking-[0.05em] mb-1">Activation code</label>
            <input
              ref={inputRef}
              value={code}
              onChange={e => handleCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric" maxLength={6} autoFocus
              placeholder="Enter 6-digit code"
              className="w-full py-1.5 border-0 bg-transparent outline-none font-mono text-[22px] tracking-[0.4em] font-semibold text-content-primary tabular-nums"
            />
            <div className="min-h-4 text-xs text-content-tertiary mt-0.5">
              {resolving ? (
                <span className="inline-flex items-center gap-1.5 text-info">
                  <span className="size-[7px] rounded-full bg-current inline-block animate-pulse" />
                  Matching with backend…
                </span>
              ) : error ? (
                <span className="inline-flex items-center gap-1.5 text-error"><X size={12} /> {error}</span>
              ) : code ? (
                <span>{code.length}/6 digits</span>
              ) : (
                <span>Type or scan the code shown on each device&rsquo;s boot screen.</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={simulateScan} title="Simulate scanning a device">
            <Sparkles size={14} /> Scan
          </Button>
        </div>
      )}

      {/* Per-model progress chips */}
      <div className="flex gap-2 flex-wrap mb-3.5">
        {order.items.map(it => {
          const done = it.devices.length
          const pct = it.qty > 0 ? (done / it.qty) * 100 : 0
          const complete = done >= it.qty
          return (
            <div key={it.id} className={[
              'px-3 py-2 bg-surface-2 border rounded-lg flex items-center gap-2.5 min-w-[160px]',
              complete ? 'border-success/30' : 'border-line-subtle',
            ].join(' ')}>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-content-primary">{it.modelName}</div>
                <Progress value={pct} className="mt-1" />
              </div>
              <span className={`tabular-nums text-[12.5px] font-medium ${complete ? 'text-success' : 'text-content-secondary'}`}>
                {done}/{it.qty}
              </span>
            </div>
          )
        })}
      </div>

      {/* Activated devices list */}
      <div className="rounded-xl border border-line-default bg-surface-2 shadow-1 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line-subtle flex items-center justify-between">
          <h3 className="text-sm font-semibold text-content-primary">Activated devices ({allDevices.length})</h3>
          <span className="text-xs text-content-tertiary">Each record is bound to the backend.</span>
        </div>

        {/* Unbind confirmation dialog */}
        <Dialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unbind device</DialogTitle>
              <DialogDescription>
                Remove <strong className="text-content-primary font-mono">{removeTarget?.sn}</strong> ({removeTarget?.modelName}) from this order? The device will return to inventory and a new activation code can be issued.
              </DialogDescription>
            </DialogHeader>
            <label className="flex items-start gap-2.5 p-3 bg-surface-2 border border-line-subtle rounded-lg cursor-pointer mt-2">
              <Checkbox checked={factoryReset} onCheckedChange={(v) => setFactoryReset(!!v)} className="mt-0.5" />
              <div>
                <div className="text-[13px] font-medium text-content-primary">Also factory-reset the device</div>
                <div className="text-xs text-content-tertiary mt-0.5">
                  Sends a reset signal so the device wipes its config the next time it comes online. Leave unchecked if the unit will be re-bound to another order.
                </div>
              </div>
            </label>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setRemoveTarget(null)}>Cancel</Button>
              <Button variant="primary" onClick={confirmRemove}>
                <Trash2 size={14} /> {factoryReset ? 'Unbind & factory reset' : 'Unbind device'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {allDevices.length === 0 ? (
          <div className="py-9 text-center">
            <div className="text-[13px] text-content-secondary mb-1">No devices activated yet.</div>
            <div className="text-xs text-content-tertiary">Enter an activation code above to bind the first device.</div>
          </div>
        ) : (
          <div>
            {allDevices.map((d) => {
              const isFlash = flash && flash.itemId === d.itemId && flash.sn === d.sn
              return (
                <div key={`${d.itemId}-${d.deviceIdx}`} className={[
                  'grid items-center gap-3.5 px-4 py-3 border-t border-line-subtle transition-colors duration-600',
                  isFlash ? 'bg-success-50' : 'bg-transparent',
                ].join(' ')} style={{ gridTemplateColumns: '40px 1fr 140px 180px 40px' }}>
                  <div className="size-7 rounded-md bg-success text-white grid place-items-center">
                    <Check size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[13px] font-medium text-content-primary">{d.sn}</div>
                    <div className="text-[11.5px] text-content-tertiary mt-px font-mono">code {d.code}</div>
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-surface-3 border border-line-subtle text-xs font-medium text-content-primary">{d.modelName}</span>
                  </div>
                  <div>
                    {readonly ? (
                      <span className="text-[12.5px] text-content-secondary">{d.type}</span>
                    ) : (
                      <Select value={d.type} onValueChange={(v) => { if (v) updateDeviceType(d.itemId, d.deviceIdx, v) }}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SAMPLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="text-right">
                    {!readonly && (
                      <button className="inline-flex items-center justify-center size-7 rounded-md text-content-tertiary hover:text-error hover:bg-error-50 transition-colors cursor-pointer"
                        onClick={() => { setFactoryReset(true); setRemoveTarget({ itemId: d.itemId, deviceIdx: d.deviceIdx, sn: d.sn, modelName: d.modelName }) }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
