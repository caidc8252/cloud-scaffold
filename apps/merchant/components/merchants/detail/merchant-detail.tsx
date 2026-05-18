'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { cloneMerchant } from '../data/helpers'
import type { Merchant, Store, Terminal } from '../data/types'
import { MerchantFormModal, type MerchantFormPayload } from '../modals/merchant-form-modal'
import { StoreFormModal, type StoreFormPayload } from '../modals/store-form-modal'
import { TerminalFormModal, type TerminalFormResult } from '../modals/terminal-form-modal'
import { InstallTerminalModal } from '../modals/install-terminal-modal'
import { UnbindTerminalModal } from '../modals/unbind-terminal-modal'
import { ConfirmDialog } from '../modals/confirm-dialog'
import { MerchantDetailHeader } from './merchant-detail-header'
import { StoreCardStrip } from './store-card-strip'
import { SelectedStoreHeader } from './selected-store-header'
import { SelectedStoreTerminals } from './selected-store-terminals'

interface MerchantDetailProps {
  initialMerchant: Merchant
}

type StoreFormState = { mode: 'new' } | { mode: 'edit'; store: Store } | null
type TerminalFormState = { mode: 'new'; defaultStoreId: string } | { mode: 'edit'; terminal: Terminal } | null

export function MerchantDetail({ initialMerchant }: MerchantDetailProps) {
  const [merchant, setMerchant] = useState<Merchant>(() => cloneMerchant(initialMerchant))
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(initialMerchant.stores[0]?.id)

  const [editMerchantOpen, setEditMerchantOpen] = useState(false)
  const [storeFormState, setStoreFormState] = useState<StoreFormState>(null)
  const [terminalFormState, setTerminalFormState] = useState<TerminalFormState>(null)
  const [installTerminal, setInstallTerminal] = useState<Terminal | null>(null)
  const [unbindTerminal, setUnbindTerminal] = useState<Terminal | null>(null)
  const [deletePendingTerminal, setDeletePendingTerminal] = useState<Terminal | null>(null)
  const [deleteStore, setDeleteStore] = useState<Store | null>(null)

  const selectedStore =
    merchant.stores.find((s) => s.id === selectedStoreId) ?? merchant.stores[0]

  const updateMerchant = (patch: Partial<Merchant>) => setMerchant((m) => ({ ...m, ...patch, updatedAt: 'just now' }))

  const onSaveMerchant = (payload: MerchantFormPayload) => {
    updateMerchant({ name: payload.name, country: payload.country, tags: payload.tags, notes: payload.notes })
    setEditMerchantOpen(false)
    toast.success(`${payload.name} updated`)
  }

  const onSaveStore = (payload: StoreFormPayload) => {
    if (!storeFormState) return
    if (storeFormState.mode === 'new') {
      const newStore: Store = {
        id: `s-${merchant.id.replace(/^m-/, '')}-${Date.now().toString(36)}`,
        isHQ: false,
        createdAt: 'just now',
        updatedAt: 'just now',
        ...payload,
      }
      setMerchant((m) => ({ ...m, stores: [...m.stores, newStore], updatedAt: 'just now' }))
      setSelectedStoreId(newStore.id)
      toast.success(`Store "${newStore.name}" added`)
    } else {
      const target = storeFormState.store
      setMerchant((m) => ({
        ...m,
        stores: m.stores.map((s) => (s.id === target.id ? { ...s, ...payload, updatedAt: 'just now' } : s)),
        updatedAt: 'just now',
      }))
      toast.success(`Store "${payload.name}" updated`)
    }
    setStoreFormState(null)
  }

  const onSaveTerminal = (result: TerminalFormResult) => {
    if (result.kind === 'bulk') {
      const created: Terminal[] = result.rows.map((r, i) => ({
        tid: `T${String(1010000 + (Math.floor(Math.random() * 8999999) + i)).padStart(8, '0')}`,
        sn: null,
        model: null,
        state: 'pending',
        lastSeen: '—',
        createdAt: 'just now',
        updatedAt: 'just now',
        storeId: r.storeId,
        address: r.address,
        mcc: r.mcc,
        currency: r.currency,
        cardSchemes: r.schemes.split(',').map((s) => s.trim()).filter(Boolean),
      }))
      setMerchant((m) => ({ ...m, terminals: [...m.terminals, ...created], updatedAt: 'just now' }))
      toast.success(`${created.length} VarSheet${created.length === 1 ? '' : 's'} imported · pending installation`)
      setTerminalFormState(null)
      return
    }

    const payload = result.payload
    if (terminalFormState?.mode === 'new') {
      const newT: Terminal = {
        tid: payload.tid || `T${String(1010000 + Math.floor(Math.random() * 8999999)).padStart(8, '0')}`,
        sn: null,
        model: null,
        state: 'pending',
        lastSeen: '—',
        createdAt: 'just now',
        updatedAt: 'just now',
        storeId: payload.storeId,
        address: payload.address,
        merchantNameAcq: payload.merchantNameAcq,
        midAcq: payload.mid,
        tidAcq: payload.tid,
        acquirerId: payload.acquirerId,
        acquirerName: payload.acquirerName,
        bankBin: payload.bankBin,
        settlementAccount: payload.settlementAccount,
        mcc: payload.mcc,
        currency: payload.currency,
        country: payload.country,
        timezone: payload.timezone,
        cutoffTime: payload.cutoffTime,
        batchNumber: payload.batchNumber,
        reversalHours: payload.reversalHours,
        minTxAmount: payload.minTxAmount,
        maxTxAmount: payload.maxTxAmount,
        dailyVolumeLimit: payload.dailyVolumeLimit,
        networkMode: payload.networkMode,
        cardSchemes: payload.cardSchemes,
        cvv2: payload.cvv2,
        avs: payload.avs,
        pinBypassAllowed: payload.pinBypassAllowed,
        manualEntryAllowed: payload.manualEntryAllowed,
        contactlessLimit: payload.contactlessLimit,
        emvAids: payload.emvAids,
        tipAllowed: payload.tipAllowed,
        cashbackAllowed: payload.cashbackAllowed,
        refundAllowed: payload.refundAllowed,
        voidAllowed: payload.voidAllowed,
        preAuthAllowed: payload.preAuthAllowed,
        surchargeRate: payload.surchargeRate,
        dccEnabled: payload.dccEnabled,
        loyaltyIntegration: payload.loyaltyIntegration,
        tokenizationProvider: payload.tokenizationProvider,
        encryption: payload.encryption,
        keyIndex: payload.keyIndex,
        tlsVersion: payload.tlsVersion,
        receiptHeader: payload.receiptHeader,
        receiptFooter: payload.receiptFooter,
      }
      setMerchant((m) => ({ ...m, terminals: [...m.terminals, newT], updatedAt: 'just now' }))
      toast.success(`VarSheet ${newT.tid} created · pending installation`)
    } else if (terminalFormState?.mode === 'edit') {
      const id = terminalFormState.terminal.tid
      setMerchant((m) => ({
        ...m,
        terminals: m.terminals.map((t) => (t.tid === id ? { ...t, ...payload, updatedAt: 'just now' } : t)),
        updatedAt: 'just now',
      }))
      toast.success(`VarSheet ${id} updated`)
    }
    setTerminalFormState(null)
  }

  const onConfirmInstall = (resolved: { sn: string; model: string }) => {
    if (!installTerminal) return
    const id = installTerminal.tid
    setMerchant((m) => ({
      ...m,
      terminals: m.terminals.map((t) =>
        t.tid === id ? { ...t, sn: resolved.sn, model: resolved.model, state: 'active', lastSeen: 'just now', updatedAt: 'just now' } : t,
      ),
      updatedAt: 'just now',
    }))
    toast.success(`${resolved.sn} installed · VarSheet ${id} now installed`)
    setInstallTerminal(null)
  }

  const onConfirmUnbind = () => {
    if (!unbindTerminal) return
    const id = unbindTerminal.tid
    setMerchant((m) => ({
      ...m,
      terminals: m.terminals.map((t) =>
        t.tid === id ? { ...t, sn: null, model: null, state: 'pending', lastSeen: '—', updatedAt: 'just now' } : t,
      ),
      updatedAt: 'just now',
    }))
    toast.warning(`Device unbound from VarSheet ${id} · awaiting reinstall`)
    setUnbindTerminal(null)
  }

  const onConfirmDeleteTerminal = () => {
    if (!deletePendingTerminal) return
    const id = deletePendingTerminal.tid
    setMerchant((m) => ({ ...m, terminals: m.terminals.filter((t) => t.tid !== id), updatedAt: 'just now' }))
    toast.success(`VarSheet ${id} deleted`)
    setDeletePendingTerminal(null)
  }

  const deleteStoreTerminals = deleteStore ? merchant.terminals.filter((t) => t.storeId === deleteStore.id) : []
  const onConfirmDeleteStore = () => {
    if (!deleteStore || deleteStoreTerminals.length > 0) return
    const id = deleteStore.id
    setMerchant((m) => ({ ...m, stores: m.stores.filter((s) => s.id !== id), updatedAt: 'just now' }))
    toast.success(`Store "${deleteStore.name}" removed`)
    setDeleteStore(null)
  }

  return (
    <>
      <MerchantDetailHeader merchant={merchant} onEdit={() => setEditMerchantOpen(true)} />
      <StoreCardStrip
        merchant={merchant}
        selectedStoreId={selectedStore?.id}
        onSelectStore={setSelectedStoreId}
        onAddStore={() => setStoreFormState({ mode: 'new' })}
      />
      {selectedStore && (
        <SelectedStoreHeader
          store={selectedStore}
          onEdit={() => setStoreFormState({ mode: 'edit', store: selectedStore })}
          onDelete={() => setDeleteStore(selectedStore)}
        />
      )}
      {selectedStore && (
        <SelectedStoreTerminals
          merchant={merchant}
          store={selectedStore}
          onAdd={() => setTerminalFormState({ mode: 'new', defaultStoreId: selectedStore.id })}
          onEdit={(t) => setTerminalFormState({ mode: 'edit', terminal: t })}
          onInstall={(t) => setInstallTerminal(t)}
          onUnbind={(t) => setUnbindTerminal(t)}
          onDeletePending={(t) => setDeletePendingTerminal(t)}
        />
      )}

      {editMerchantOpen && (
        <MerchantFormModal
          open
          mode="edit"
          merchant={merchant}
          onClose={() => setEditMerchantOpen(false)}
          onSave={onSaveMerchant}
        />
      )}

      {storeFormState && (
        <StoreFormModal
          open
          mode={storeFormState.mode}
          merchant={merchant}
          store={storeFormState.mode === 'edit' ? storeFormState.store : undefined}
          onClose={() => setStoreFormState(null)}
          onSave={onSaveStore}
          onDelete={(s) => {
            setStoreFormState(null)
            setDeleteStore(s)
          }}
        />
      )}

      {terminalFormState && (
        <TerminalFormModal
          open
          mode={terminalFormState.mode}
          merchant={merchant}
          stores={merchant.stores}
          terminal={terminalFormState.mode === 'edit' ? terminalFormState.terminal : undefined}
          defaultStoreId={terminalFormState.mode === 'new' ? terminalFormState.defaultStoreId : undefined}
          onClose={() => setTerminalFormState(null)}
          onSave={onSaveTerminal}
          onDelete={(t) => {
            setTerminalFormState(null)
            if (t.state === 'pending' && !t.sn) setDeletePendingTerminal(t)
            else setUnbindTerminal(t)
          }}
        />
      )}

      {installTerminal && (
        <InstallTerminalModal
          open
          merchant={merchant}
          terminal={installTerminal}
          onClose={() => setInstallTerminal(null)}
          onConfirm={onConfirmInstall}
        />
      )}

      {unbindTerminal && (
        <UnbindTerminalModal
          open
          merchant={merchant}
          terminal={unbindTerminal}
          onClose={() => setUnbindTerminal(null)}
          onConfirm={onConfirmUnbind}
        />
      )}

      <ConfirmDialog
        open={!!deletePendingTerminal}
        title={deletePendingTerminal ? `Delete VarSheet ${deletePendingTerminal.tid}?` : 'Delete VarSheet?'}
        description="This removes the pending registration permanently. The Terminal No. will not be reusable."
        confirmLabel="Delete VarSheet"
        onClose={() => setDeletePendingTerminal(null)}
        onConfirm={onConfirmDeleteTerminal}
      />

      <ConfirmDialog
        open={!!deleteStore}
        title={deleteStore ? `Remove "${deleteStore.name}"?` : 'Remove store?'}
        description={
          deleteStoreTerminals.length > 0
            ? `Move or unbind ${deleteStoreTerminals.length} terminal${
                deleteStoreTerminals.length === 1 ? '' : 's'
              } before removing this store.`
            : 'The store record will be deleted.'
        }
        confirmLabel="Remove store"
        confirmDisabled={deleteStoreTerminals.length > 0}
        onClose={() => setDeleteStore(null)}
        onConfirm={onConfirmDeleteStore}
      />
    </>
  )
}
