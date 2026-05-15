'use client'

import { Link2, Pencil, Plus, Trash2, Unlink } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  Table,
  type TableColumn,
} from '@cloud/ui'
import type { Merchant, Store, Terminal } from '../data/types'

interface SelectedStoreTerminalsProps {
  merchant: Merchant
  store: Store
  onAdd: () => void
  onEdit: (terminal: Terminal) => void
  onInstall: (terminal: Terminal) => void
  onUnbind: (terminal: Terminal) => void
  onDeletePending: (terminal: Terminal) => void
}

export function SelectedStoreTerminals({
  merchant,
  store,
  onAdd,
  onEdit,
  onInstall,
  onUnbind,
  onDeletePending,
}: SelectedStoreTerminalsProps) {
  const terminals = merchant.terminals.filter((t) => t.storeId === store.id)

  const columns: TableColumn<Terminal>[] = [
    {
      key: 'mid',
      title: 'Merchant No.',
      render: () => <span className="font-mono text-xs text-content-secondary">{merchant.mid}</span>,
    },
    {
      key: 'tid',
      title: 'Terminal No.',
      render: (t) => <span className="font-mono text-xs font-medium">{t.tid}</span>,
    },
    {
      key: 'sn',
      title: 'Serial',
      render: (t) =>
        t.sn ? (
          <span className="font-mono text-xs">{t.sn}</span>
        ) : (
          <span className="italic text-[11.5px] text-content-tertiary">not installed</span>
        ),
    },
    { key: 'model', title: 'Model', render: (t) => t.model ?? <span className="text-content-tertiary">—</span> },
    {
      key: 'state',
      title: 'Status',
      render: (t) => (
        <Badge tone={t.state === 'active' ? 'success' : 'warning'}>{t.state === 'active' ? 'Installed' : 'Pending'}</Badge>
      ),
    },
    {
      key: 'lastSeen',
      title: 'Last seen',
      render: (t) => <span className="text-[11.5px] text-content-tertiary">{t.lastSeen}</span>,
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          {t.state === 'pending' ? (
            <>
              <Button size="sm" variant="outline" iconLeft={<Link2 size={12} />} onClick={() => onInstall(t)}>
                Bind
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Edit VarSheet" onClick={() => onEdit(t)}>
                <Pencil size={13} />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Delete VarSheet"
                onClick={() => onDeletePending(t)}
              >
                <Trash2 size={13} />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon-sm" variant="ghost" aria-label="Edit terminal" onClick={() => onEdit(t)}>
                <Pencil size={13} />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Unbind terminal" onClick={() => onUnbind(t)}>
                <Unlink size={13} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Payment terminals</span>
          <span className="font-mono text-[10.5px] px-1.5 py-px rounded-full bg-surface-3 text-content-tertiary border border-line-default">
            {terminals.length}
          </span>
        </CardTitle>
        <CardDescription>
          Pending rows aren&apos;t bound to a physical device yet — use <b>Bind</b> to enter the 6-digit code on the
          device screen.
        </CardDescription>
        <CardAction>
          <Button variant="primary" size="sm" iconLeft={<Plus size={12} />} onClick={onAdd}>
            Add terminal
          </Button>
        </CardAction>
      </CardHeader>

      {terminals.length === 0 ? (
        <div className="px-4 pb-4">
          <Empty
            title="No terminals yet"
            description="Create a VarSheet to register a new terminal for this store, then bind it on-site."
            action={
              <Button variant="primary" size="sm" iconLeft={<Plus size={12} />} onClick={onAdd}>
                Add terminal
              </Button>
            }
          />
        </div>
      ) : (
        <Table<Terminal> columns={columns} rows={terminals} rowKey={(t) => t.tid} />
      )}
    </Card>
  )
}
