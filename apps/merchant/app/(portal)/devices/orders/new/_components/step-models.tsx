'use client'

import { useState, useRef } from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'
import {
  Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Card, CardHeader, CardTitle, CardContent, CardDescription,
} from '@cloud/ui'
import { DEVICE_MODELS, emptyDevices, moneyUsd, type OrderItem } from '@/lib/data/orders'

function ModelRow({ item, onChange, onRemove }: {
  item: OrderItem; onChange: (next: OrderItem) => void; onRemove: () => void
}) {
  const model = DEVICE_MODELS.find(m => m.id === item.modelId)
  if (!model) return null
  const total = model.unitPrice * item.qty

  return (
    <div className="grid items-center gap-3 p-3.5 bg-surface-2 border border-line-default rounded-xl"
      style={{ gridTemplateColumns: '1fr 180px 110px 110px 32px' }}>
      <div className="flex gap-3 items-center min-w-0">
        <div className="size-[35px] rounded-lg bg-surface-3 border border-line-subtle flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-content-secondary">{model.name.slice(0, 3)}</span>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm text-content-primary">{model.name}</div>
          <div className="text-xs text-content-tertiary truncate">{model.family} · {moneyUsd(model.unitPrice)} ea</div>
        </div>
      </div>
      <Select value={item.type} onValueChange={(v) => { if (v) onChange({ ...item, type: v }) }}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {model.types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="inline-flex items-center border border-line-default rounded-lg bg-surface-2">
        <button className="flex items-center justify-center size-8 rounded-l-lg hover:bg-surface-hover cursor-pointer" onClick={() => onChange({ ...item, qty: Math.max(1, item.qty - 1) })}>
          <Minus size={12} />
        </button>
        <input value={item.qty} onChange={e => onChange({ ...item, qty: Math.max(1, parseInt(e.target.value || '1', 10)) })}
          className="w-10 border-0 bg-transparent text-center tabular-nums text-sm text-content-primary outline-none" />
        <button className="flex items-center justify-center size-8 rounded-r-lg hover:bg-surface-hover cursor-pointer" onClick={() => onChange({ ...item, qty: item.qty + 1 })}>
          <Plus size={12} />
        </button>
      </div>
      <div className="text-right font-semibold text-sm tabular-nums text-content-primary">{moneyUsd(total)}</div>
      <button className="flex items-center justify-center size-7 rounded-md text-content-tertiary hover:text-error hover:bg-error-50 cursor-pointer" onClick={onRemove}>
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export function StepModels({ items, setItems }: { items: OrderItem[]; setItems: (items: OrderItem[]) => void }) {
  const [adderOpen, setAdderOpen] = useState(items.length === 0)
  const idCounterRef = useRef(0)

  const addModel = (modelId: string) => {
    const m = DEVICE_MODELS.find(x => x.id === modelId)
    if (!m) return
    idCounterRef.current += 1
    setItems([...items, {
      id: `li-${idCounterRef.current}`,
      modelId: m.id, modelName: m.name,
      unitPrice: m.unitPrice, qty: 1, type: m.types[0], devices: emptyDevices(1),
    }])
    setAdderOpen(false)
  }

  const updateItem = (idx: number, next: OrderItem) => {
    setItems(items.map((it, i) => i === idx ? { ...next, devices: emptyDevices(next.qty) } : it))
  }
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const available = DEVICE_MODELS.filter(m => !items.find(i => i.modelId === m.id))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Models & quantities</CardTitle>
        <CardDescription>Add one or more models. An order can contain any number of model lines.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2.5">
          {items.length === 0 && (
            <div className="py-8 text-center text-sm text-content-tertiary border border-dashed border-line-default rounded-xl">
              No models yet. Add your first model below.
            </div>
          )}
          {items.map((it, idx) => (
            <ModelRow key={it.id} item={it}
              onChange={next => updateItem(idx, next)}
              onRemove={() => removeItem(idx)} />
          ))}
        </div>

        {adderOpen && available.length > 0 ? (
          <div className="mt-3 p-3 bg-surface-3 border border-dashed border-line-default rounded-xl">
            <div className="text-xs text-content-tertiary uppercase tracking-[0.06em] font-medium mb-2.5">Add a model</div>
            <div className="grid grid-cols-2 gap-2">
              {available.map(m => (
                <button key={m.id} type="button" onClick={() => addModel(m.id)}
                  className="flex items-center gap-3 w-full text-left p-2.5 rounded-lg bg-surface-2 border border-line-default hover:border-primary-300 cursor-pointer transition-colors">
                  <div className="size-[35px] rounded-lg bg-surface-3 border border-line-subtle flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-content-secondary">{m.name.slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-content-primary">{m.name}</div>
                    <div className="text-xs text-content-tertiary">{m.family} · {moneyUsd(m.unitPrice)} ea</div>
                  </div>
                  <Plus size={14} className="text-content-tertiary" />
                </button>
              ))}
            </div>
            {items.length > 0 && (
              <div className="mt-2.5 text-right">
                <Button variant="ghost" size="sm" onClick={() => setAdderOpen(false)}>Done adding</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <Button variant="secondary" size="md" onClick={() => setAdderOpen(true)} disabled={available.length === 0}>
              <Plus size={14} /> Add another model
            </Button>
            {available.length === 0 && <span className="text-xs text-content-tertiary">All models added.</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
