'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, Pencil } from 'lucide-react'
import { Button } from '@cloud/ui'
import { cloneMerchant, findMerchant } from '@/components/merchants/data/helpers'
import type { Merchant, Store, Terminal } from '@/components/merchants/data/types'
import { MerchantAvatar } from '@/components/merchants/merchant-avatar'
import { TagChip } from '@/components/merchants/tag-chip'
import { StoreCardStrip } from '@/components/merchants/detail/store-card-strip'
import { SelectedStoreHeader } from '@/components/merchants/detail/selected-store-header'
import { SelectedStoreTerminals } from '@/components/merchants/detail/selected-store-terminals'
import { MerchantFormModal, type MerchantFormPayload } from '@/components/merchants/modals/merchant-form-modal'
import { StoreFormModal, type StoreFormPayload } from '@/components/merchants/modals/store-form-modal'
import { TerminalFormModal, type TerminalFormResult } from '@/components/merchants/modals/terminal-form-modal'
import { InstallTerminalModal } from '@/components/merchants/modals/install-terminal-modal'
import { UnbindTerminalModal } from '@/components/merchants/modals/unbind-terminal-modal'
import { ConfirmDialog } from '@/components/merchants/modals/confirm-dialog'

type StoreFormState = { mode: 'new' } | { mode: 'edit'; store: Store } | null
type TerminalFormState = { mode: 'new'; defaultStoreId: string } | { mode: 'edit'; terminal: Terminal } | null

export default function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const seed = findMerchant(id)
  const [merchant, setMerchant] = useState<Merchant | undefined>(() => (seed ? cloneMerchant(seed) : undefined))
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(seed?.stores[0]?.id)

  const [editMerchantOpen, setEditMerchantOpen] = useState(false)
  const [storeFormState, setStoreFormState] = useState<StoreFormState>(null)
  const [terminalFormState, setTerminalFormState] = useState<TerminalFormState>(null)
  const [installTerminal, setInstallTerminal] = useState<Terminal | null>(null)
  const [unbindTerminal, setUnbindTerminal] = useState<Terminal | null>(null)
  const [deletePendingTerminal, setDeletePendingTerminal] = useState<Terminal | null>(null)
  const [deleteStore, setDeleteStore] = useState<Store | null>(null)

  if (!merchant) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-3">
        <p className="text-content-tertiary text-sm">Merchant not found.</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/merchants')}>
          ← Back to merchants
        </Button>
      </div>
    )
  }

  const selectedStore =
    merchant.stores.find((s) => s.id === selectedStoreId) ?? merchant.stores[0]

  const updateMerchant = (patch: Partial<Merchant>) =>
    setMerchant((m) => (m ? { ...m, ...patch, updatedAt: 'just now' } : m))

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
      setMerchant((m) => (m ? { ...m, stores: [...m.stores, newStore], updatedAt: 'just now' } : m))
      setSelectedStoreId(newStore.id)
      toast.success(`Store "${newStore.name}" added`)
    } else {
      const target = storeFormState.store
      setMerchant((m) =>
        m
          ? {
              ...m,
              stores: m.stores.map((s) => (s.id === target.id ? { ...s, ...payload, updatedAt: 'just now' } : s)),
              updatedAt: 'just now',
            }
          : m,
      )
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
      setMerchant((m) => (m ? { ...m, terminals: [...m.terminals, ...created], updatedAt: 'just now' } : m))
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
      setMerchant((m) => (m ? { ...m, terminals: [...m.terminals, newT], updatedAt: 'just now' } : m))
      toast.success(`VarSheet ${newT.tid} created · pending installation`)
    } else if (terminalFormState?.mode === 'edit') {
      const tid = terminalFormState.terminal.tid
      setMerchant((m) =>
        m
          ? {
              ...m,
              terminals: m.terminals.map((t) => (t.tid === tid ? { ...t, ...payload, updatedAt: 'just now' } : t)),
              updatedAt: 'just now',
            }
          : m,
      )
      toast.success(`VarSheet ${tid} updated`)
    }
    setTerminalFormState(null)
  }

  const onConfirmInstall = (resolved: { sn: string; model: string }) => {
    if (!installTerminal) return
    const tid = installTerminal.tid
    setMerchant((m) =>
      m
        ? {
            ...m,
            terminals: m.terminals.map((t) =>
              t.tid === tid ? { ...t, sn: resolved.sn, model: resolved.model, state: 'active', lastSeen: 'just now', updatedAt: 'just now' } : t,
            ),
            updatedAt: 'just now',
          }
        : m,
    )
    toast.success(`${resolved.sn} installed · VarSheet ${tid} now installed`)
    setInstallTerminal(null)
  }

  const onConfirmUnbind = () => {
    if (!unbindTerminal) return
    const tid = unbindTerminal.tid
    setMerchant((m) =>
      m
        ? {
            ...m,
            terminals: m.terminals.map((t) =>
              t.tid === tid ? { ...t, sn: null, model: null, state: 'pending', lastSeen: '—', updatedAt: 'just now' } : t,
            ),
            updatedAt: 'just now',
          }
        : m,
    )
    toast.warning(`Device unbound from VarSheet ${tid} · awaiting reinstall`)
    setUnbindTerminal(null)
  }

  const onConfirmDeleteTerminal = () => {
    if (!deletePendingTerminal) return
    const tid = deletePendingTerminal.tid
    setMerchant((m) => (m ? { ...m, terminals: m.terminals.filter((t) => t.tid !== tid), updatedAt: 'just now' } : m))
    toast.success(`VarSheet ${tid} deleted`)
    setDeletePendingTerminal(null)
  }

  const deleteStoreTerminals = deleteStore ? merchant.terminals.filter((t) => t.storeId === deleteStore.id) : []
  const onConfirmDeleteStore = () => {
    if (!deleteStore || deleteStoreTerminals.length > 0) return
    const sid = deleteStore.id
    setMerchant((m) => (m ? { ...m, stores: m.stores.filter((s) => s.id !== sid), updatedAt: 'just now' } : m))
    toast.success(`Store "${deleteStore.name}" removed`)
    setDeleteStore(null)
  }

  return (
    <div>
      <div className="mb-3">
        <button
          className="flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors mb-4 cursor-pointer"
          onClick={() => router.push('/merchants')}
        >
          <ChevronLeft size={14} /> Back to merchants
        </button>

        <div className="flex items-start gap-4">
          <MerchantAvatar name={merchant.name} size={56} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold text-content-primary">{merchant.name}</h1>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-content-tertiary">
              <span className="font-mono">{merchant.mid}</span>
              <span>·</span>
              <span>{merchant.country}</span>
            </div>
            {merchant.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {merchant.tags.map((t) => (
                  <TagChip key={t} label={t} />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="primary" size="sm" onClick={() => setEditMerchantOpen(true)}>
              <Pencil size={13} /> Edit merchant
            </Button>
          </div>
        </div>
      </div>

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
    </div>
  )
}
