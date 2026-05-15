'use client'

import { useMemo, useState } from 'react'
import { Check, Plus, Trash2, Unlink } from 'lucide-react'
import { Button, Modal } from '@cloud/ui'
import type { Merchant, Store, Terminal } from '../data/types'
import { BulkImportPanel, type BulkImportRow } from './bulk-import-panel'
import { VarSheetForm } from './var-sheet-form'
import { MID_PATTERN, TID_PATTERN, makeInitialVarSheet, type VarSheetState } from './var-sheet-state'

export type TerminalFormResult =
  | { kind: 'single'; payload: VarSheetState }
  | { kind: 'bulk'; rows: BulkImportRow[] }

interface TerminalFormModalProps {
  open: boolean
  mode: 'new' | 'edit'
  merchant: Merchant
  stores: Store[]
  terminal?: Terminal
  defaultStoreId?: string
  onClose: () => void
  onSave: (result: TerminalFormResult) => void
  onDelete?: (terminal: Terminal) => void
}

type EntryMode = 'single' | 'bulk'

export function TerminalFormModal({
  open,
  mode,
  merchant,
  stores,
  terminal,
  defaultStoreId,
  onClose,
  onSave,
  onDelete,
}: TerminalFormModalProps) {
  const isEdit = mode === 'edit' && !!terminal
  const isPending = isEdit && terminal?.state === 'pending' && !terminal?.sn
  const [entryMode, setEntryMode] = useState<EntryMode>('single')
  const [vs, setVs] = useState<VarSheetState>(() => makeInitialVarSheet(merchant, terminal, defaultStoreId))

  const setField = <K extends keyof VarSheetState>(key: K, value: VarSheetState[K]) => {
    setVs((prev) => ({ ...prev, [key]: value }))
  }

  const canSave = useMemo(() => MID_PATTERN.test(vs.mid) && TID_PATTERN.test(vs.tid) && vs.cardSchemes.length > 0, [vs])

  const title = isEdit
    ? isPending
      ? `Edit VarSheet ${terminal.tid}`
      : `Edit terminal ${terminal.sn ?? terminal.tid}`
    : 'Add terminal'

  const description = isEdit
    ? "Update this VarSheet's acquirer parameters. Changes apply at the terminal's next check-in."
    : 'Create a VarSheet (acquirer parameter sheet). The new VarSheet is pending until a device is bound on-site with the 6-digit code.'

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="sm:max-w-4xl"
      title={title}
      description={description}
      footer={
        <>
          {isEdit && onDelete && (
            <Button
              variant="destructive"
              iconLeft={isPending ? <Trash2 size={14} /> : <Unlink size={14} />}
              onClick={() => onDelete(terminal)}
            >
              {isPending ? 'Delete VarSheet' : 'Unbind terminal'}
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            iconLeft={isEdit ? <Check size={14} /> : <Plus size={14} />}
            disabled={entryMode === 'single' && !canSave}
            onClick={() => onSave({ kind: 'single', payload: vs })}
          >
            {isEdit ? 'Save changes' : 'Create terminal'}
          </Button>
        </>
      }
    >
      {!isEdit && (
        <div className="inline-flex p-0.5 rounded-md bg-surface-3 self-start mb-3">
          {(
            [
              { id: 'single', label: 'Single terminal' },
              { id: 'bulk', label: 'Bulk import (CSV / XLSX)' },
            ] as const
          ).map((opt) => {
            const on = entryMode === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEntryMode(opt.id)}
                className={
                  on
                    ? 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-medium bg-surface-2 text-content-primary shadow-1'
                    : 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs text-content-secondary hover:text-content-primary'
                }
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {entryMode === 'bulk' && !isEdit ? (
        <BulkImportPanel merchant={merchant} stores={stores} onCommit={(rows) => onSave({ kind: 'bulk', rows })} />
      ) : (
        <VarSheetForm stores={stores} vs={vs} setField={setField} />
      )}
    </Modal>
  )
}
